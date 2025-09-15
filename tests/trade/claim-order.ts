import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import {
  program,
  provider,
  USER,
  ADMIN,
  LOCAL_MINT,
  BUBBLEGUM_PROGRAM_ID,
  MPL_CORE_ID,
  MPL_NOOP_ID,
  ACCOUNT_COMPRESSION_ID,
} from "../constants";
import { getCurrentMarketId, ensureAccountBalance } from "../helpers";
import { publicKey, publicKeyBytes, PublicKeyBytes } from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api'
import {fromWeb3JsPublicKey} from '@metaplex-foundation/umi-web3js-adapters'
const MPL_CORE_CPI_SIGNER = new PublicKey("CbNY3JiXdXNE9tPNEk1aRZVEkWdj2v7kfJLNQwZZgpXk");

function toBigInt(n: anchor.BN | number): bigint {
  return BigInt(anchor.BN.isBN(n) ? (n as anchor.BN).toString() : Math.trunc(n));
}

function computeExpectedPayout(positionAmount: bigint, winningLiquidity: bigint, othersideLiquidity: bigint): bigint {
  if (winningLiquidity === BigInt(0)) return BigInt(0);
  const shareOfOtherside = (othersideLiquidity * positionAmount) / winningLiquidity;
  return positionAmount + shareOfOtherside;
}

async function waitOneSecond() { await new Promise((r) => setTimeout(r, 1100)); }

describe("depredict", () => {
  const usdcMint = LOCAL_MINT.publicKey;

  let marketPda: PublicKey;
  let marketIdBn: anchor.BN;
  let positionPagePda: PublicKey;

  let yesSlotIndex: number | null = null;
  let yesAssetId: PublicKey | null = null;
  let yesTree: any | null = null;
  let yesRoot: PublicKeyBytes | null = null;
  let yesDataHash: PublicKeyBytes | null = null;
  let yesCreatorHash: PublicKeyBytes | null = null;
  let yesNonce: number | null = null;
  let yesIndex: number | null = null;
  let yesProof: any | null = null;


  let noSlotIndex: number | null = null;
  let noAssetId: PublicKey | null = null;
  let noTree: any | null = null;
  let noRoot: PublicKeyBytes | null = null;
  let noDataHash: PublicKeyBytes | null = null;
  let noCreatorHash: PublicKeyBytes | null = null;
  let noNonce: number | null = null;
  let noIndex: number | null = null;
  let noProof: any | null = null;



  let marketCreatorPda: PublicKey;
  let marketCreatorAccount: any;

  async function loadMarketCreator() {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market_creator"), ADMIN.publicKey.toBytes()],
      program.programId
    );
    marketCreatorPda = pda;
    marketCreatorAccount = await program.account.marketCreator.fetch(pda);
  }

  function deriveMarketPda(marketId: anchor.BN): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];
  }

  function derivePositionPagePda(marketId: anchor.BN, pageIndex: number): PublicKey {
    const pageIndexBuf = Buffer.from(new Uint16Array([pageIndex]).buffer);
    return PublicKey.findProgramAddressSync(
      [Buffer.from("pos_page"), marketId.toArrayLike(Buffer, "le", 8), pageIndexBuf],
      program.programId
    )[0];
  }

  async function ensurePageExists(pageIndex = 0) {
    const info = await provider.connection.getAccountInfo(positionPagePda);
    if (!info) {
      await program.methods
        .ensurePositionPage({ pageIndex })
        .accountsPartial({
          payer: ADMIN.publicKey,
          market: marketPda,
          marketCreator: marketCreatorPda,
          positionPage: positionPagePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([ADMIN])
        .rpc();
    }
  }

  async function openPosition({
    direction,
    amount,
    pageIndex = 0,
  }: {
    direction: { yes: {} } | { no: {} };
    amount: anchor.BN;
    pageIndex?: number;
  }): Promise<{ slotIndex: number; assetId: PublicKey }> {
    const marketAccountBefore = await program.account.marketState.fetch(marketPda);
    const marketVault = marketAccountBefore.marketVault as PublicKey;

    const treeConfig = PublicKey.findProgramAddressSync(
      [marketCreatorAccount.merkleTree.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    )[0];

    await program.methods
      .openPosition({ amount, direction, metadataUri: "https://arweave.net/position", pageIndex })
      .accountsPartial({
        user: USER.publicKey,
        marketFeeVault: marketCreatorAccount.feeVault,
        positionPage: positionPagePda,
        market: marketPda,
        marketCreator: marketCreatorPda,
        mint: usdcMint,
        userMintAta: getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID),
        marketVault,
        merkleTree: marketCreatorAccount.merkleTree,
        collection: marketCreatorAccount.coreCollection,
        treeConfig,
        mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        mplCoreProgram: MPL_CORE_ID,
        logWrapperProgram: MPL_NOOP_ID,
        compressionProgram: ACCOUNT_COMPRESSION_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([USER])
      .rpc();

    const page = await program.account.positionPage.fetch(positionPagePda);
    for (let i = 0; i < page.entries.length; i++) {
      const entry = page.entries[i];
      if (Object.keys(entry.status)[0] === "open" && entry.assetId && entry.assetId.toString() !== PublicKey.default.toString()) {
        if (Object.keys(entry.direction)[0] === Object.keys(direction)[0] && entry.amount.gt(new anchor.BN(0))) {
          return { slotIndex: i, assetId: entry.assetId as PublicKey };
        }
      }
    }
    throw new Error("Could not locate newly created position entry");
  }

  before(async () => {
    //await ensureAccountBalance(USER.publicKey, 2_000_000_000);
    // await ensureAccountBalance(ADMIN.publicKey, 2_000_000_000);

    await loadMarketCreator();

    marketIdBn = await getCurrentMarketId();
    marketPda = deriveMarketPda(marketIdBn);
    positionPagePda = derivePositionPagePda(marketIdBn, 0);

    await ensurePageExists(0);

    const yes = await openPosition({ direction: { yes: {} }, amount: new anchor.BN(1_000_000), pageIndex: 0 });
    yesSlotIndex = yes.slotIndex;
    yesAssetId = yes.assetId;
    let yesUmiAssetId = fromWeb3JsPublicKey(yes.assetId);

    // load cNFT data from DAS API (allow override via DAS_RPC env)
    const dasRpc = process.env.DAS_RPC || provider.connection.rpcEndpoint;
    const umi = createUmi(dasRpc).use(dasApi())
    const fetchWithRetry = async <T>(fn: () => Promise<T>, attempts = 10): Promise<T> => {
      let lastErr: any;
      for (let i = 0; i < attempts; i++) {
        try { return await fn(); } catch (e) { lastErr = e; }
      }
      throw lastErr;
    };
    await new Promise(resolve => setTimeout(resolve, 10000));
    // load cNFT data from DAS API
    const yesAsset = await fetchWithRetry(() => umi.rpc.getAsset(yesUmiAssetId));
    const yesAssetProof = await fetchWithRetry(() => umi.rpc.getAssetProof(yesUmiAssetId));

    yesTree = yesAssetProof.tree_id;
    yesRoot = publicKeyBytes(yesAssetProof.root);
    yesDataHash = publicKeyBytes(yesAsset.compression.data_hash);
    yesCreatorHash = publicKeyBytes(yesAsset.compression.creator_hash);
    yesNonce = yesAsset.compression.seq;
    yesIndex = yesAssetProof.node_index; // why example show  '- 2 ** yesAssetProof.proof.length'?
    yesProof = yesAssetProof.proof;

    const no = await openPosition({ direction: { no: {} }, amount: new anchor.BN(2_000_000), pageIndex: 0 });
    noSlotIndex = no.slotIndex;
    noAssetId = no.assetId;
    let noUmiAssetId = fromWeb3JsPublicKey(no.assetId);


    // timeout 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    const noAsset = await fetchWithRetry(() => umi.rpc.getAsset(noUmiAssetId));
    const noAssetProof = await fetchWithRetry(() => umi.rpc.getAssetProof(noUmiAssetId));


    noTree = noAssetProof.tree_id;
    noRoot = publicKeyBytes(noAssetProof.root);
    noDataHash = publicKeyBytes(noAsset.compression.data_hash);
    noCreatorHash = publicKeyBytes(noAsset.compression.creator_hash);
    noNonce = noAsset.compression.seq;
    noIndex = noAssetProof.node_index; // why example show  '- 2 ** yesAssetProof.proof.length'?
    noProof = noAssetProof.proof;
    });

  describe("Claim Order", () => {
    it("fails before market is resolved", async () => {
      const claimerMintAta = getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID);
      const marketAccount = await program.account.marketState.fetch(marketPda);
      const userBalBefore = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);

      try {



        await program.methods
          .settlePosition({
            pageIndex: 0,
            slotIndex: yesSlotIndex as number,
            assetId: yesAssetId as PublicKey,
            root: Array.from(yesRoot!),
            dataHash: Array.from(yesDataHash!),
            creatorHash: Array.from(yesCreatorHash!),
            nonce: new anchor.BN(yesNonce!),
            index: yesIndex as number,
          })
          .accountsPartial({
            claimer: USER.publicKey,
            market: marketPda,
            marketCreator: marketCreatorPda,
            positionPage: positionPagePda,
            mint: usdcMint,
            claimerMintAta,
            marketVault: marketAccount.marketVault as PublicKey,
            mplCoreProgram: MPL_CORE_ID,
            bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            treeConfig: PublicKey.findProgramAddressSync(
              [marketCreatorAccount.merkleTree.toBuffer()],
              BUBBLEGUM_PROGRAM_ID
            )[0],
            mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
            logWrapperProgram: MPL_NOOP_ID,
            compressionProgram: ACCOUNT_COMPRESSION_ID,
          })
          .signers([USER])
          .rpc();
        assert.fail("Expected failure before market resolution");
      } catch (e: any) {
        const s = e.toString ? e.toString() : "";
        assert.include(s, "MarketStillActive");
      }

      const userBalAfter = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);
      if (userBalBefore && userBalAfter) {
        assert.equal(userBalAfter.value.amount, userBalBefore.value.amount);
      }
    });

    it("resolves market to YES (winner = YES)", async () => {
      await program.methods
        .resolveMarket({ oracleValue: 11 })
        .accounts({
          signer: ADMIN.publicKey,
          market: marketPda,
          marketCreator: marketCreatorPda,
          oraclePubkey: ADMIN.publicKey,
        })
        .signers([ADMIN])
        .rpc();

      const m = await program.account.marketState.fetch(marketPda);
      assert.equal(Object.keys(m.marketState)[0], "resolved");
      assert.equal(Object.keys(m.winningDirection)[0], "yes");
      await waitOneSecond();
    });

    it("claims winning YES position and receives correct payout", async () => {
      const pageBefore: any = await program.account.positionPage.fetch(positionPagePda);
      const entryBefore = pageBefore.entries[yesSlotIndex as number];
      assert.equal(Object.keys(entryBefore.status)[0], "open");

      const marketBefore: any = await program.account.marketState.fetch(marketPda);
      const winningLiquidity = toBigInt(marketBefore.yesLiquidity);
      const otherLiquidity = toBigInt(marketBefore.noLiquidity);
      const positionAmount = toBigInt(entryBefore.amount);
      const expectedPayout = computeExpectedPayout(positionAmount, winningLiquidity, otherLiquidity);

      const claimerMintAta = getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID);
      const userBalBefore = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);
      const vaultBalBefore = await provider.connection.getTokenAccountBalance(marketBefore.marketVault as PublicKey);



      await waitOneSecond();
      await program.methods
        .settlePosition({
            pageIndex: 0,
            slotIndex: yesSlotIndex as number,
            assetId: yesAssetId as PublicKey,
            root: Array.from(yesRoot!),
            dataHash: Array.from(yesDataHash!),
            creatorHash: Array.from(yesCreatorHash!),
            nonce: new anchor.BN(yesNonce!),
            index: yesIndex as number,
        })
        .accountsPartial({
          claimer: USER.publicKey,
          market: marketPda,
          marketCreator: marketCreatorPda,
          positionPage: positionPagePda,
          mint: usdcMint,
          claimerMintAta,
          marketVault: marketBefore.marketVault as PublicKey,
          mplCoreProgram: MPL_CORE_ID,
          bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          treeConfig: PublicKey.findProgramAddressSync(
            [marketCreatorAccount.merkleTree.toBuffer()],
            BUBBLEGUM_PROGRAM_ID
          )[0],
          mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
          logWrapperProgram: MPL_NOOP_ID,
          compressionProgram: ACCOUNT_COMPRESSION_ID,
        })
        .signers([USER])
        .rpc();

      const pageAfter: any = await program.account.positionPage.fetch(positionPagePda);
      const entryAfter = pageAfter.entries[yesSlotIndex as number];
      assert.equal(Object.keys(entryAfter.status)[0], "claimed");

      const userBalAfter = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);
      const vaultBalAfter = await provider.connection.getTokenAccountBalance(marketBefore.marketVault as PublicKey);

      if (userBalBefore && userBalAfter) {
        const delta = BigInt(userBalAfter.value.amount) - BigInt(userBalBefore.value.amount);
        assert.equal(delta.toString(), expectedPayout.toString());
      }
      if (vaultBalBefore && vaultBalAfter) {
        const vaultDelta = BigInt(vaultBalBefore.value.amount) - BigInt(vaultBalAfter.value.amount);
        assert.isTrue(vaultDelta >= BigInt(0));
        assert.equal(vaultDelta.toString(), expectedPayout.toString());
      }
    });

    it("claims losing NO position and receives zero", async () => {
      const pageBefore: any = await program.account.positionPage.fetch(positionPagePda);
      const entryBefore = pageBefore.entries[noSlotIndex as number];
      assert.equal(Object.keys(entryBefore.status)[0], "open");

      const claimerMintAta = getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID);
      const userBalBefore = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);
      const marketState: any = await program.account.marketState.fetch(marketPda);

      await waitOneSecond();
      await program.methods
        .settlePosition({
            pageIndex: 0,
            slotIndex: yesSlotIndex as number,
            assetId: yesAssetId as PublicKey,
            root: Array.from(yesRoot!),
            dataHash: Array.from(yesDataHash!),
            creatorHash: Array.from(yesCreatorHash!),
            nonce: new anchor.BN(yesNonce!),
            index: yesIndex as number,
        })
        .accountsPartial({
          claimer: USER.publicKey,
          market: marketPda,
          marketCreator: marketCreatorPda,
          positionPage: positionPagePda,
          mint: usdcMint,
          claimerMintAta,
          marketVault: marketState.marketVault as PublicKey,
          mplCoreProgram: MPL_CORE_ID,
          bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          treeConfig: PublicKey.findProgramAddressSync(
            [marketCreatorAccount.merkleTree.toBuffer()],
            BUBBLEGUM_PROGRAM_ID
          )[0],
          mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
          logWrapperProgram: MPL_NOOP_ID,
          compressionProgram: ACCOUNT_COMPRESSION_ID,
        })
        .signers([USER])
        .rpc();

      const pageAfter: any = await program.account.positionPage.fetch(positionPagePda);
      const entryAfter = pageAfter.entries[noSlotIndex as number];
      assert.equal(Object.keys(entryAfter.status)[0], "claimed");

      const userBalAfter = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);
      if (userBalBefore && userBalAfter) {
        const delta = BigInt(userBalAfter.value.amount) - BigInt(userBalBefore.value.amount);
        assert.equal(delta.toString(), BigInt(0).toString());
      }
    });

    it("prevents double-claiming the same position", async () => {
      try {
        await waitOneSecond();
        await program.methods
          .settlePosition({             
            pageIndex: 0,
            slotIndex: yesSlotIndex as number,
            assetId: yesAssetId as PublicKey,
            root: Array.from(yesRoot!),
            dataHash: Array.from(yesDataHash!),
            creatorHash: Array.from(yesCreatorHash!),
            nonce: new anchor.BN(yesNonce!),
            index: yesIndex as number,
        })
          .accountsPartial({
            claimer: USER.publicKey,
            market: marketPda,
            marketCreator: marketCreatorPda,
            positionPage: positionPagePda,
            mint: usdcMint,
            claimerMintAta: getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID),
            marketVault: (await program.account.marketState.fetch(marketPda)).marketVault as PublicKey,
            mplCoreProgram: MPL_CORE_ID,
            bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            treeConfig: PublicKey.findProgramAddressSync(
              [marketCreatorAccount.merkleTree.toBuffer()],
              BUBBLEGUM_PROGRAM_ID
            )[0],
            mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
            logWrapperProgram: MPL_NOOP_ID,
            compressionProgram: ACCOUNT_COMPRESSION_ID,
          })
          .signers([USER])
          .rpc();
        assert.fail("Expected double-claim to fail");
      } catch (e: any) {
        const s = e.toString ? e.toString() : "";
        assert.match(s, /PositionNotFound|InvalidNft|ConcurrentTransaction/);
      }
    });

    it("fails with wrong assetId (InvalidNft)", async () => {
      const wrongAsset = Keypair.generate().publicKey;
      try {
        await program.methods
          .settlePosition({             
            pageIndex: 0,
            slotIndex: noSlotIndex,
            assetId: wrongAsset,
            root: Array.from(noRoot!),
            dataHash: Array.from(noDataHash!),
            creatorHash: Array.from(noCreatorHash!),
            nonce: new anchor.BN(noNonce!),
            index: noIndex as number,
        })
          .accountsPartial({
            claimer: USER.publicKey,
            market: marketPda,
            marketCreator: marketCreatorPda,
            positionPage: positionPagePda,
            mint: usdcMint,
            claimerMintAta: getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID),
            marketVault: (await program.account.marketState.fetch(marketPda)).marketVault as PublicKey,
            mplCoreProgram: MPL_CORE_ID,
            bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            treeConfig: PublicKey.findProgramAddressSync(
              [marketCreatorAccount.merkleTree.toBuffer()],
              BUBBLEGUM_PROGRAM_ID
            )[0],
            mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
            logWrapperProgram: MPL_NOOP_ID,
            compressionProgram: ACCOUNT_COMPRESSION_ID,
          })
          .signers([USER])
          .rpc();
        assert.fail("Expected InvalidNft error");
      } catch (e: any) {
        const s = e.toString ? e.toString() : "";
        assert.include(s, "InvalidNft");
      }
    });

    it("rejects when claimer is market creator authority (Unauthorized)", async () => {
      try {
        await program.methods
          .settlePosition({ 
            pageIndex: 0,
            slotIndex: yesSlotIndex as number,
            assetId: yesAssetId as PublicKey,
            root: Array.from(yesRoot!),
            dataHash: Array.from(yesDataHash!),
            creatorHash: Array.from(yesCreatorHash!),
            nonce: new anchor.BN(yesNonce!),
            index: yesIndex as number,
           })
          .accountsPartial({
            claimer: ADMIN.publicKey,
            market: marketPda,
            marketCreator: marketCreatorPda,
            positionPage: positionPagePda,
            mint: usdcMint,
            claimerMintAta: getAssociatedTokenAddressSync(usdcMint, ADMIN.publicKey, false, TOKEN_PROGRAM_ID),
            marketVault: (await program.account.marketState.fetch(marketPda)).marketVault as PublicKey,
            mplCoreProgram: MPL_CORE_ID,
            bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            treeConfig: PublicKey.findProgramAddressSync(
              [marketCreatorAccount.merkleTree.toBuffer()],
              BUBBLEGUM_PROGRAM_ID
            )[0],
            mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
            logWrapperProgram: MPL_NOOP_ID,
            compressionProgram: ACCOUNT_COMPRESSION_ID,
          })
          .signers([ADMIN])
          .rpc();
        assert.fail("Expected Unauthorized for market creator as claimer");
      } catch (e: any) {
        const s = e.toString ? e.toString() : "";
        assert.include(s, "Unauthorized");
      }
    });
  });
});
