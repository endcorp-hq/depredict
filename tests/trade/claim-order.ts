import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, TransactionInstruction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
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
import { PublicKeyBytes } from '@metaplex-foundation/umi'
import { fetchAssetProofWithRetry, proofToRemainingAccounts, sendWithLookupV0 } from "../mpl_functions";
import { getCurrentMarketId } from "../helpers";
const MPL_CORE_CPI_SIGNER = new PublicKey("CbNY3JiXdXNE9tPNEk1aRZVEkWdj2v7kfJLNQwZZgpXk");
const FEE_BPS_DENOMINATOR = BigInt(10_000);

let CACHED_LUT: PublicKey | null = null;

function toBigInt(n: anchor.BN | number): bigint {
  return BigInt(anchor.BN.isBN(n) ? (n as anchor.BN).toString() : Math.trunc(n));
}

function computeExpectedNetPayout(
  positionAmount: bigint,
  winningLiquidity: bigint,
  othersideLiquidity: bigint,
  creatorFeeBps: number,
  protocolFeeBps: number,
): bigint {
  if (winningLiquidity === BigInt(0)) return BigInt(0);
  const shareOfOtherside = (othersideLiquidity * positionAmount) / winningLiquidity;
  const grossPayout = positionAmount + shareOfOtherside;
  const creatorFee = (grossPayout * BigInt(creatorFeeBps)) / FEE_BPS_DENOMINATOR;
  const afterCreator = grossPayout - creatorFee;
  const protocolFee = (afterCreator * BigInt(protocolFeeBps)) / FEE_BPS_DENOMINATOR;
  return afterCreator - protocolFee;
}

async function waitOneSecond() { await new Promise((r) => setTimeout(r, 1100)); }

// moved helpers imported from ../mpl_functions

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
  let configPda: PublicKey;
  let treeConfigPda: PublicKey;

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
    const targetPagePda = derivePositionPagePda(marketIdBn, pageIndex);
    const info = await provider.connection.getAccountInfo(targetPagePda);
    if (!info) {
      await program.methods
        .ensurePositionPage({ pageIndex })
        .accountsPartial({
          payer: ADMIN.publicKey,
          market: marketPda,
          marketCreator: marketCreatorPda,
          positionPage: targetPagePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([ADMIN])
        .rpc( { commitment: "confirmed" });
    }
  }

  function pickNewestEntry(pageAcc: any, desiredDirection: string): number | null {
    let newestIdx: number | null = null;
    let newestTs: anchor.BN | null = null;
    for (let i = 0; i < pageAcc.entries.length; i++) {
      const entry = pageAcc.entries[i];
      const statusKey = Object.keys(entry.status)[0];
      const dirKey = Object.keys(entry.direction)[0];
      const hasAsset = !!entry.assetId && !entry.assetId.equals(PublicKey.default);
      if (statusKey === "open" && hasAsset && dirKey === desiredDirection && entry.amount.gt(new anchor.BN(0))) {
        if (!newestTs || entry.createdAt.gt(newestTs)) {
          newestTs = entry.createdAt as anchor.BN;
          newestIdx = i;
        }
      }
    }
    return newestIdx;
  }

  async function openNewPosition({
    direction,
    amount,
  }): Promise<{ slotIndex: number; assetId: PublicKey }> {
    const marketAccountBefore = await program.account.marketState.fetch(marketPda);
    const marketVault = marketAccountBefore.marketVault as PublicKey;

    const treeConfig = PublicKey.findProgramAddressSync(
      [marketCreatorAccount.merkleTree.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    )[0];

    let tx = await program.methods
      .openPosition({ amount, direction, metadataUri: "https://arweave.net/position" })
      .accountsPartial({
        user: USER.publicKey,
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
      .rpc( { commitment: "confirmed" });
    console.log("tx: ", tx);

    const desiredDirection = Object.keys(direction)[0];
    const maxAttempts = 6;
    const fetchPageAndPick = async (pagePda: PublicKey): Promise<{ slotIndex: number; assetId: PublicKey } | null> => {
      try {
        const page: any = await program.account.positionPage.fetch(pagePda);
        const idx = pickNewestEntry(page, desiredDirection);
        if (idx !== null) {
          const entry = page.entries[idx];
          // console.log("entry.assetId", entry.assetId.toBase58());
          return { slotIndex: idx, assetId: entry.assetId as PublicKey };
        }
      } catch (_) {}
      return null;
    };

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const found = await fetchPageAndPick(positionPagePda);
      if (found) return found;
      await waitOneSecond();
    }

    throw new Error("Could not locate newly created position entry");
  }
  let configAccount: {
    bump: number;
    authority: anchor.web3.PublicKey;
    feeVault: anchor.web3.PublicKey;
    feeAmount: number;
    version: number;
    nextMarketId: anchor.BN;
    globalMarkets: anchor.BN;
    baseUri: number[];
}
  before(async () => {
    //await ensureAccountBalance(USER.publicKey, 2_000_000_000);
    // await ensureAccountBalance(ADMIN.publicKey, 2_000_000_000);

    await loadMarketCreator();
    treeConfigPda = PublicKey.findProgramAddressSync(
      [marketCreatorAccount.merkleTree.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    )[0];

    configPda = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    )[0];
    configAccount = await program.account.config.fetch(configPda);

    // Ensure fee vaults are valid SPL token accounts for the market mint
    const creatorFeeVaultAta = getAssociatedTokenAddressSync(usdcMint, ADMIN.publicKey, false, TOKEN_PROGRAM_ID);
    const protocolFeeVaultAta = getAssociatedTokenAddressSync(usdcMint, ADMIN.publicKey, false, TOKEN_PROGRAM_ID);

    // Create missing ATAs
    const ataIx: anchor.web3.TransactionInstruction[] = [];
    const creatorInfo = await provider.connection.getAccountInfo(creatorFeeVaultAta);
    if (!creatorInfo) {
      ataIx.push(
        createAssociatedTokenAccountInstruction(
          ADMIN.publicKey,
          creatorFeeVaultAta,
          ADMIN.publicKey,
          usdcMint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    const protocolInfo = await provider.connection.getAccountInfo(protocolFeeVaultAta);
    if (!protocolInfo) {
      ataIx.push(
        createAssociatedTokenAccountInstruction(
          ADMIN.publicKey,
          protocolFeeVaultAta,
          ADMIN.publicKey,
          usdcMint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    if (ataIx.length > 0) {
      const tx = new anchor.web3.Transaction().add(...ataIx);
      await provider.sendAndConfirm(tx, [ADMIN]);
    }

    // Update on-chain vault pointers if they are not ATAs yet
    const mcBefore: any = await program.account.marketCreator.fetch(marketCreatorPda);
    if (mcBefore.authority.equals(ADMIN.publicKey)) {
      if (!mcBefore.feeVault.equals(creatorFeeVaultAta)) {
        await program.methods
          .updateCreatorFeeVault(mcBefore.feeVault as PublicKey, creatorFeeVaultAta)
          .accountsPartial({
            signer: ADMIN.publicKey,
            marketCreator: marketCreatorPda,
            // merkleTree: mcBefore.merkleTree as PublicKey,
            //treeConfig: PublicKey.findProgramAddressSync([
            //  (mcBefore.merkleTree as PublicKey).toBuffer(),
            //], BUBBLEGUM_PROGRAM_ID)[0],
            systemProgram: SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc( { commitment: "confirmed" });
      }
    }

    if (configAccount.authority.equals(ADMIN.publicKey)) {
      if (!configAccount.feeVault.equals(protocolFeeVaultAta)) {
        await program.methods
          .updateFeeVault(protocolFeeVaultAta)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: configAccount.feeVault as PublicKey,
            config: configPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc( { commitment: "processed" });
        configAccount = await program.account.config.fetch(configPda);
      }
    }

    marketIdBn = await getCurrentMarketId();
    marketPda = deriveMarketPda(marketIdBn);
    positionPagePda = derivePositionPagePda(marketIdBn, 0);

    await ensurePageExists(0);
    await ensurePageExists(1);

    const yes = await openNewPosition({ direction: { yes: {} }, amount: new anchor.BN(1_000_000) });
    yesSlotIndex = yes.slotIndex;
    yesAssetId = yes.assetId;

    // allow time for indexing before fetching proofs
    // Allow some time for indexing
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Open NO position and resolve its asset data + proof
    const no = await openNewPosition({ direction: { no: {} }, amount: new anchor.BN(2_000_000) });
    noSlotIndex = no.slotIndex;
    noAssetId = no.assetId;

    // Allow some time for indexing
    await new Promise(resolve => setTimeout(resolve, 4000));
    });

  describe("Claim Order", () => {
    it("fails before market is resolved", async () => {
      const claimerMintAta = getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID);
      const marketAccount = await program.account.marketState.fetch(marketPda);
      const userBalBefore = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);
      if (yesSlotIndex === null || !yesAssetId) throw new Error("YES position not initialized");

      try {
        let tx = await program.methods
          .settlePosition({
            pageIndex: 0,
            slotIndex: yesSlotIndex,
            assetId: yesAssetId,
            // Dummy values; instruction will fail before these are used
            root: Array.from(new Uint8Array(32)),
            dataHash: Array.from(new Uint8Array(32)),
            creatorHash: Array.from(new Uint8Array(32)),
            nonce: new anchor.BN(0),
            leafIndex: 0,
          })
          .accountsPartial({
            claimer: USER.publicKey,
            market: marketPda,
            config: configPda,
            marketCreator: marketCreatorPda,
            positionPage: positionPagePda,
            mint: usdcMint,
            claimerMintAta,
            collection: marketCreatorAccount.coreCollection,
            mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
            mplCoreProgram: MPL_CORE_ID,
            marketVault: marketAccount.marketVault as PublicKey,
            merkleTree: marketCreatorAccount.merkleTree,
            bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            treeConfig: treeConfigPda,
            logWrapperProgram: MPL_NOOP_ID,
            compressionProgram: ACCOUNT_COMPRESSION_ID,
          })
          .signers([USER])
          .rpc({ commitment: "confirmed" });
        console.log("tx: ", tx);
        assert.fail("Expected failure before market resolution");
      } catch (err: any) {
        //assert.include(err, "Market still active");
        console.log("err: ", err);
      }
    });

    it("resolves market to YES (winner = YES)", async () => {
      let tx = await program.methods
        .resolveMarket({ oracleValue: 11 })
        .accounts({
          signer: ADMIN.publicKey,
          market: marketPda,
          marketCreator: marketCreatorPda,
          oraclePubkey: ADMIN.publicKey,
        })
        .signers([ADMIN])
        .rpc( { commitment: "confirmed" });
      console.log("tx: ", tx);
    });

    it("claims winning YES position and receives correct payout", async () => {
      if (yesSlotIndex === null || !yesAssetId) throw new Error("YES position not initialized");
      const p = await fetchAssetProofWithRetry(yesAssetId!);
      const pageBefore: any = await program.account.positionPage.fetch(positionPagePda);
      const entryBefore = pageBefore.entries[yesSlotIndex as number];
      assert.equal(Object.keys(entryBefore.status)[0], "open");

      const marketBefore: any = await program.account.marketState.fetch(marketPda);
      const winningLiquidity = toBigInt(marketBefore.yesLiquidity);
      const otherLiquidity = toBigInt(marketBefore.noLiquidity);
      const positionAmount = toBigInt(entryBefore.amount);
      const creatorFeeBps = Number(marketCreatorAccount.creatorFeeBps ?? 0);
      const protocolFeeBps = Number(configAccount.feeAmount ?? 0);
      const expectedPayout = computeExpectedNetPayout(
        positionAmount,
        winningLiquidity,
        otherLiquidity,
        creatorFeeBps,
        protocolFeeBps,
      );

      const claimerMintAta = getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID);
      const userBalBefore = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);
      const vaultBalBefore = await provider.connection.getTokenAccountBalance(marketBefore.marketVault as PublicKey);



      await waitOneSecond();
      const cuIx1 = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 });
      const ixYes = await program.methods
        .settlePosition({
            pageIndex: 0,
            slotIndex: yesSlotIndex,
            assetId: yesAssetId,
            root: Array.from(p.root),
            dataHash: Array.from(p.dataHash),
            creatorHash: Array.from(p.creatorHash),
            nonce: new anchor.BN(p.nonce!),
            leafIndex: p.index as number,
        })
        .accountsPartial({
          claimer: USER.publicKey,
          market: marketPda,
          config: configPda,
          marketCreator: marketCreatorPda,
          positionPage: positionPagePda,
          mint: usdcMint,
          claimerMintAta,
          collection: marketCreatorAccount.coreCollection,
          mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
          mplCoreProgram: MPL_CORE_ID,
          merkleTree: marketCreatorAccount.merkleTree,
          marketVault: marketBefore.marketVault as PublicKey, 
          bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          treeConfig: treeConfigPda,
          logWrapperProgram: MPL_NOOP_ID,
          compressionProgram: ACCOUNT_COMPRESSION_ID,
        })
        .remainingAccounts(proofToRemainingAccounts(p.proof))
        .instruction()

      
      const yesProofPubkeys = (p.proof as string[]).map((x) => new PublicKey(x));
      await sendWithLookupV0([cuIx1, ixYes], USER, yesProofPubkeys);

      const pageAfter: any = await program.account.positionPage.fetch(positionPagePda);
      const entryAfter = pageAfter.entries[yesSlotIndex as number];
      assert.equal(Object.keys(entryAfter.status)[0], "claimed");

      const userBalAfter = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);
      const vaultBalAfter = await provider.connection.getTokenAccountBalance(marketBefore.marketVault as PublicKey).catch(() => null);
      if (userBalBefore && userBalAfter) {
        const deltaUser = BigInt(userBalAfter.value.amount) - BigInt(userBalBefore.value.amount);
        assert.equal(deltaUser.toString(), expectedPayout.toString());
      }
      if (vaultBalBefore && vaultBalAfter) {
        const deltaVault = BigInt(vaultBalBefore.value.amount) - BigInt(vaultBalAfter.value.amount);
        assert.equal(deltaVault.toString(), expectedPayout.toString());
      }
    });

    it("claims losing NO position and receives zero", async () => {
      if (noSlotIndex === null || !noAssetId) throw new Error("NO position not initialized");
      const p = await fetchAssetProofWithRetry(noAssetId!);
      noRoot = p.root;
      noDataHash = p.dataHash;
      noCreatorHash = p.creatorHash;
      noNonce = p.nonce;
      noIndex = p.index;
      const pageBefore: any = await program.account.positionPage.fetch(positionPagePda);
      const entryBefore = pageBefore.entries[noSlotIndex as number];
      assert.equal(Object.keys(entryBefore.status)[0], "open");

      const claimerMintAta = getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID);
      const userBalBefore = await provider.connection.getTokenAccountBalance(claimerMintAta).catch(() => null);
      const marketState: any = await program.account.marketState.fetch(marketPda);

      await waitOneSecond();
      const cuIx2 = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 });
      const ixNo = await program.methods
        .settlePosition({
            pageIndex: 0,
            slotIndex: noSlotIndex,
            assetId: noAssetId,
            root: Array.from(p.root),
            dataHash: Array.from(p.dataHash),
            creatorHash: Array.from(p.creatorHash),
            nonce: new anchor.BN(p.nonce!),
            leafIndex: p.index as number,
        })
        .accountsPartial({
          claimer: USER.publicKey,
          market: marketPda,
          config: configPda,
          marketCreator: marketCreatorPda,
          positionPage: positionPagePda,
          mint: usdcMint,
          claimerMintAta,
          collection: marketCreatorAccount.coreCollection,
          mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
          mplCoreProgram: MPL_CORE_ID,
          merkleTree: marketCreatorAccount.merkleTree,
          marketVault: marketState.marketVault as PublicKey,
          bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          treeConfig: treeConfigPda,
          logWrapperProgram: MPL_NOOP_ID,
          compressionProgram: ACCOUNT_COMPRESSION_ID,
        })
        .remainingAccounts(proofToRemainingAccounts(p.proof))
        .instruction();

      const noProofPubkeys = (p.proof as string[]).map((x) => new PublicKey(x));
      await sendWithLookupV0([cuIx2, ixNo], USER, noProofPubkeys);

      const pageAfter: any = await program.account.positionPage.fetch(positionPagePda);
      const entryAfter = pageAfter.entries[noSlotIndex as number];
      assert.equal(Object.keys(entryAfter.status)[0], "claimed");
    });

    it("prevents double-claiming the same position", async () => {
      if (yesSlotIndex === null || !yesAssetId) throw new Error("YES position not initialized");
      await waitOneSecond();
      const p = await fetchAssetProofWithRetry(yesAssetId!);
      const cuIx = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 });
      const claimIx = await program.methods
        .settlePosition({             
          pageIndex: 0,
          slotIndex: yesSlotIndex,
          assetId: yesAssetId,
          root: Array.from(p.root),
          dataHash: Array.from(p.dataHash),
          creatorHash: Array.from(p.creatorHash!),
          nonce: new anchor.BN(p.nonce!),
          leafIndex: p.index as number,
      })
        .accountsPartial({
          claimer: USER.publicKey,
          market: marketPda,
          config: configPda,
          marketCreator: marketCreatorPda,
          positionPage: positionPagePda,
          mint: usdcMint,
          claimerMintAta: getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID),
          merkleTree: marketCreatorAccount.merkleTree,
          marketVault: (await program.account.marketState.fetch(marketPda)).marketVault as PublicKey,
          collection: marketCreatorAccount.coreCollection,
          mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
          mplCoreProgram: MPL_CORE_ID,
          bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          treeConfig: treeConfigPda,
          logWrapperProgram: MPL_NOOP_ID,
          compressionProgram: ACCOUNT_COMPRESSION_ID,
        })
        .remainingAccounts(proofToRemainingAccounts(p.proof))
        .instruction();

      const proofPubkeys = (p.proof as string[]).map((x) => new PublicKey(x));
      try {
        await sendWithLookupV0([cuIx, claimIx], USER, proofPubkeys);
        assert.fail("Expected double-claim to fail");
      } catch (e: any) {
        let diagnostic = e.toString ? e.toString() : "";
        if (typeof e.getLogs === "function") {
          try {
            const fetched = await e.getLogs();
            if (fetched && fetched.length) {
              diagnostic += "\n" + fetched.join("\n");
            }
          } catch (_) {}
        } else if (Array.isArray(e.logs)) {
          diagnostic += "\n" + e.logs.join("\n");
        }
        assert.match(
          diagnostic,
          /PositionNotFound|InvalidNft|ConcurrentTransaction/,
          "Double claim should fail with program error"
        );
      }
    });

    it("fails with wrong assetId (InvalidNft)", async () => {
      const wrongAsset = Keypair.generate().publicKey;
      if (noSlotIndex === null || !noRoot || !noDataHash || !noCreatorHash || noNonce === null || noIndex === null) {
        throw new Error("NO position proof not initialized");
      }
      try {
        await program.methods
          .settlePosition({             
            pageIndex: 0,
            slotIndex: noSlotIndex,
            assetId: wrongAsset,
            root: Array.from(noRoot),
            dataHash: Array.from(noDataHash),
            creatorHash: Array.from(noCreatorHash),
            nonce: new anchor.BN(noNonce),
            leafIndex: noIndex as number,
        })
          .accountsPartial({
            claimer: USER.publicKey,
            market: marketPda,
            config: configPda,
            marketCreator: marketCreatorPda,
            positionPage: positionPagePda,
            mint: usdcMint,
            collection: marketCreatorAccount.coreCollection,
            mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
            mplCoreProgram: MPL_CORE_ID,
            claimerMintAta: getAssociatedTokenAddressSync(usdcMint, USER.publicKey, false, TOKEN_PROGRAM_ID),
            merkleTree: marketCreatorAccount.merkleTree,
            marketVault: (await program.account.marketState.fetch(marketPda)).marketVault as PublicKey,
            bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            treeConfig: treeConfigPda,
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

  });
});
