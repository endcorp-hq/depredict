import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
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
import { getCurrentUnixTime } from "../helpers";
import { PublicKeyBytes, publicKeyBytes } from "@metaplex-foundation/umi";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";

const MPL_CORE_CPI_SIGNER = new PublicKey("CbNY3JiXdXNE9tPNEk1aRZVEkWdj2v7kfJLNQwZZgpXk");

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

async function createMarket(): Promise<{ marketPda: PublicKey; marketId: anchor.BN; positionPagePda: PublicKey; marketCreatorPda: PublicKey; }>
{
  const configPda = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  )[0];
  const cfg: any = await program.account.config.fetch(configPda);
  const marketId = cfg.nextMarketId as anchor.BN;
  const marketPda = deriveMarketPda(marketId);
  const positionPagePda = derivePositionPagePda(marketId, 0);
  const [marketCreatorPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_creator"), ADMIN.publicKey.toBytes()],
    program.programId
  );

  const now = await getCurrentUnixTime();
  const question = Array.from(Buffer.from(`BATCH-TEST-${marketId.toString()}`));
  const marketStart = new anchor.BN(now + 60);
  const bettingStart = new anchor.BN(now - 60);
  const marketEnd = new anchor.BN(now + 3600);

  await program.methods
    .createMarket({
      question,
      marketStart,
      marketEnd,
      metadataUri: "https://arweave.net/batch",
      oracleType: { none: {} },
      marketType: { future: {} },
      bettingStart,
    })
    .accountsPartial({
      payer: ADMIN.publicKey,
      market: marketPda,
      oraclePubkey: ADMIN.publicKey,
      mint: LOCAL_MINT.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      config: configPda,
      marketCreator: marketCreatorPda,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([ADMIN])
    .rpc();

  return { marketPda, marketId, positionPagePda, marketCreatorPda };
}

async function ensurePageExists(marketPda: PublicKey, marketId: anchor.BN, pageIndex: number, marketCreatorPda: PublicKey) {
  const pagePda = derivePositionPagePda(marketId, pageIndex);
  const info = await provider.connection.getAccountInfo(pagePda);
  if (!info) {
    await program.methods
      .ensurePositionPage({ pageIndex })
      .accountsPartial({
        payer: ADMIN.publicKey,
        market: marketPda,
        marketCreator: marketCreatorPda,
        positionPage: pagePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([ADMIN])
      .rpc();
  }
  return pagePda;
}

async function openPosition(params: {
  marketPda: PublicKey;
  positionPagePda: PublicKey;
  marketCreatorPda: PublicKey;
  marketId: anchor.BN;
  direction: { yes: {} } | { no: {} };
  amount: anchor.BN;
}): Promise<{ assetId: PublicKey; slotIndex: number; pageIndex: number }>
{
  const marketAccount: any = await program.account.marketState.fetch(params.marketPda);
  const marketVault = marketAccount.marketVault as PublicKey;
  const marketCreatorAccount: any = await program.account.marketCreator.fetch(params.marketCreatorPda);
  console.log("[open] direction=", Object.keys(params.direction)[0], "amount=", params.amount.toString());
  console.log("[open] positionPage=", params.positionPagePda.toBase58());

  const treeConfig = PublicKey.findProgramAddressSync(
    [marketCreatorAccount.merkleTree.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  )[0];

  await program.methods
    .openPosition({ amount: params.amount, direction: params.direction, metadataUri: "https://arweave.net/position" })
    .accountsPartial({
      user: USER.publicKey,
      positionPage: params.positionPagePda,
      market: params.marketPda,
      marketCreator: params.marketCreatorPda,
      mint: LOCAL_MINT.publicKey,
      userMintAta: getAssociatedTokenAddressSync(LOCAL_MINT.publicKey, USER.publicKey, false, TOKEN_PROGRAM_ID),
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
    .signers([USER, ADMIN])
    .rpc();
  console.log("[open] tx submitted");

  // Poll both pages until we find an entry that is open, has non-default assetId,
  // and matches the requested direction and amount (mirrors claim-order flow)
  for (let attempt = 0; attempt < 80; attempt++) {
    // check current page (index 1)
    const pageAfterCurr: any = await program.account.positionPage.fetch(params.positionPagePda);
    for (let i = 0; i < pageAfterCurr.entries.length; i++) {
      const entry = pageAfterCurr.entries[i];
      const idStr = (entry.assetId as PublicKey).toString();
      if (
        Object.keys(entry.status)[0] === "open" &&
        idStr !== PublicKey.default.toString() &&
        Object.keys(entry.direction)[0] === Object.keys(params.direction)[0] &&
        (entry.amount as anchor.BN).eq(params.amount)
      ) {
        return { slotIndex: i, assetId: entry.assetId as PublicKey, pageIndex: 1 };
      }
    }
    await wait(700);
  }
  throw new Error("Could not locate newly created position entry (no new assetId found)");
}

async function fetchDasProofs(assetIds: PublicKey[]) {
  const dasRpc = process.env.DAS_RPC || provider.connection.rpcEndpoint;
  const umi = createUmi(dasRpc).use(dasApi());
  console.log("[das] rpc=", dasRpc);
  const results: Array<{
    assetId: PublicKey;
    root: PublicKeyBytes;
    dataHash: PublicKeyBytes;
    creatorHash: PublicKeyBytes;
    nonce: anchor.BN;
    index: number;
  }> = [];
  const fetchWithRetry = async <T>(fn: () => Promise<T>, attempts = 10): Promise<T> => {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) { try { return await fn(); } catch (e) { lastErr = e; } }
    throw lastErr;
  };

  // Give DAS a chance to index mints (longer wait for reliability)
  await wait(30000);

  for (const assetId of assetIds) {
    const umiId = fromWeb3JsPublicKey(assetId);
    console.log("[das] fetching asset/proof for", assetId.toBase58());
    const asset = await fetchWithRetry(() => (umi.rpc as any).getAsset(umiId)) as any;
    const proof = await fetchWithRetry(() => (umi.rpc as any).getAssetProof(umiId)) as any;
    results.push({
      assetId,
      root: publicKeyBytes(proof.root),
      dataHash: publicKeyBytes(asset.compression.data_hash),
      creatorHash: publicKeyBytes(asset.compression.creator_hash),
      nonce: new anchor.BN(asset.compression.seq),
      index: proof.node_index,
    });
  }
  return results;
}

async function resolveMarketYes(marketPda: PublicKey, marketCreatorPda: PublicKey) {
  console.log("[resolve] resolving market YES", marketPda.toBase58());
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
  console.log("[resolve] resolved");
}

async function claimPosition(args: {
  marketPda: PublicKey;
  positionPagePda: PublicKey;
  pageIndex: number;
  marketCreatorPda: PublicKey;
  assetId: PublicKey;
  root: PublicKeyBytes;
  dataHash: PublicKeyBytes;
  creatorHash: PublicKeyBytes;
  nonce: anchor.BN;
  index: number;
}) {
  const marketState: any = await program.account.marketState.fetch(args.marketPda);
  const claimerMintAta = getAssociatedTokenAddressSync(LOCAL_MINT.publicKey, USER.publicKey, false, TOKEN_PROGRAM_ID);
  const marketCreatorAccount: any = await program.account.marketCreator.fetch(args.marketCreatorPda);
  const configPda = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId)[0];
  const configAccount: any = await program.account.config.fetch(configPda);

  await program.methods
    .settlePosition({
      pageIndex: args.pageIndex,
      slotIndex: null, // let on-chain search by assetId
      assetId: args.assetId,
      root: Array.from(args.root),
      dataHash: Array.from(args.dataHash),
      creatorHash: Array.from(args.creatorHash),
      nonce: args.nonce,
      leafIndex: args.index,
    })
    .accountsPartial({
      claimer: USER.publicKey,
      market: args.marketPda,
      marketCreator: args.marketCreatorPda,
      positionPage: args.positionPagePda,
      mint: LOCAL_MINT.publicKey,
      claimerMintAta,
      marketVault: marketState.marketVault as PublicKey,
      merkleTree: marketCreatorAccount.merkleTree,
      collection: marketCreatorAccount.coreCollection,
      mplCoreProgram: MPL_CORE_ID,
      bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      treeConfig: PublicKey.findProgramAddressSync(
        [ (await program.account.marketCreator.fetch(args.marketCreatorPda)).merkleTree.toBuffer() ],
        BUBBLEGUM_PROGRAM_ID
      )[0],
      mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
      logWrapperProgram: MPL_NOOP_ID,
      compressionProgram: ACCOUNT_COMPRESSION_ID,
    })
    .signers([USER])
    .rpc();
  console.log("[claim] claimed asset=", args.assetId.toBase58());
}

describe("batch open and claim", () => {
  let marketPda: PublicKey;
  let marketId: anchor.BN;
  let positionPagePda: PublicKey;
  let marketCreatorPda: PublicKey;

  before(async () => {
    const created = await createMarket();
    marketPda = created.marketPda;
    marketId = created.marketId;
    // After creating page 1, pages_allocated will be 2, so current becomes 1
    positionPagePda = derivePositionPagePda(marketId, 1);
    marketCreatorPda = created.marketCreatorPda;
    // Ensure current (1) and next (2) exist to satisfy on-chain checks
    console.log("[setup] marketPda=", marketPda.toBase58(), "marketId=", marketId.toString());
    console.log("[setup] positionPage(current)=", positionPagePda.toBase58());
    await ensurePageExists(marketPda, marketId, 1, marketCreatorPda);
    await ensurePageExists(marketPda, marketId, 2, marketCreatorPda);
    console.log("[setup] ensured pages 1 and 2 exist");
  });

  it("creates market, opens 20 positions, resolves YES, and claims", async () => {

    const positions: Array<{ assetId: PublicKey; slotIndex: number; pageIndex: number }>= [];
    for (let i = 0; i < 20; i++) {
      const direction = i % 2 === 0 ? { yes: {} } : { no: {} };
      const amount = new anchor.BN(1_000_000 + i * 10_000);
      const pos = await openPosition({
        marketPda,
        positionPagePda,
        marketCreatorPda,
        marketId,
        direction,
        amount,
      });
      positions.push(pos);
      // Avoid ConcurrentTransaction (ts > market.update_ts) by spacing txs
      await wait(1100);
    }
    console.log("[open] opened positions=", positions.length);

    const proofs = await fetchDasProofs(positions.map(p => p.assetId));
    console.log("[das] proofs fetched=", proofs.length);

    await resolveMarketYes(marketPda, marketCreatorPda);

    // Claim all positions (YES will receive payout; NO should get zero)
    for (const p of proofs) {
      console.log("[claim] starting", p.assetId.toBase58());
      // determine page from recorded opens
      const opened = positions.find(x => x.assetId.toString() === p.assetId.toString());
      if (!opened) throw new Error("Opened position not found for asset " + p.assetId.toBase58());
      await claimPosition({
        marketPda,
        positionPagePda: opened.pageIndex === 1 ? positionPagePda : derivePositionPagePda(marketId, opened.pageIndex),
        pageIndex: opened.pageIndex,
        marketCreatorPda,
        assetId: p.assetId,
        root: p.root,
        dataHash: p.dataHash,
        creatorHash: p.creatorHash,
        nonce: p.nonce,
        index: p.index,
      });
    }

    const pageAfter: any = await program.account.positionPage.fetch(positionPagePda);
    let claimed = 0;
    for (let i = 0; i < pageAfter.entries.length; i++) {
      if (Object.keys(pageAfter.entries[i].status)[0] === "claimed") claimed++;
    }
    assert.isAtLeast(claimed, 20);
  }).timeout(1_000_000);
});
