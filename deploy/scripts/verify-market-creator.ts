import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import type { Depredict } from "../../target/types/depredict";

// mpl + umi
import { createTreeV2, setTreeDelegate } from "@metaplex-foundation/mpl-bubblegum";
import { createCollectionV2, mplCore, pluginAuthorityPairV2 } from "@metaplex-foundation/mpl-core";
import { generateSigner, signerIdentity, createSignerFromKeypair } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const RPC_URL = process.env.RPC_URL || process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";

const MARKET_CREATOR_KEYPAIR_PATH = process.argv[2] || path.resolve(process.cwd(), "keys/market_creator.json");
const FEE_VAULT_KEYPAIR_PATH = process.argv[3] || path.resolve(process.cwd(), "keys/market_fee_vault.json");

function loadKeypair(filePath: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Buffer.from(secret));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createCoreCollection(
  rpcEndpoint: string,
  programId: PublicKey,
  marketCreatorPda: PublicKey,
  authority: Keypair
) {
  const umi = createUmi(rpcEndpoint).use(mplCore());
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(authority));
  umi.use(signerIdentity(signer, true));

  const collection = generateSigner(umi);

  const seeds = [Buffer.from("market_creator"), authority.publicKey.toBytes()];
  const [derivedPda, bump] = PublicKey.findProgramAddressSync(seeds, programId);
  if (!derivedPda.equals(marketCreatorPda)) throw new Error("Derived PDA mismatch while creating collection");

  const localPda = [fromWeb3JsPublicKey(derivedPda), bump] as any;

  const builder = await createCollectionV2(umi, {
    collection,
    payer: signer,
    updateAuthority: localPda,
    name: "Market Creator Collection",
    uri: "https://example.com/metadata.json",
    plugins: [pluginAuthorityPairV2({ type: "BubblegumV2" })],
  });
  await builder.sendAndConfirm(umi);

  return new PublicKey(collection.publicKey.toString());
}

async function createMerkleTree(
  rpcEndpoint: string,
  marketCreatorPda: PublicKey,
  authority: Keypair
) {
  const umi = createUmi(rpcEndpoint);
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(authority));
  umi.use(signerIdentity(signer, true));

  const merkleTree = generateSigner(umi);
  const treeBuilder = await createTreeV2(umi, {
    merkleTree,
    maxDepth: 16,
    canopyDepth: 8,
    maxBufferSize: 64,
    public: false,
    treeCreator: signer,
  });
  await treeBuilder.sendAndConfirm(umi);

  // Allow time for the account to finalize/propagate on devnet
  await sleep(5000);

  const delegateBuilder = await setTreeDelegate(umi, {
    merkleTree: merkleTree.publicKey,
    treeCreator: signer,
    newTreeDelegate: fromWeb3JsPublicKey(marketCreatorPda),
  });
  // Retry delegation in case the tree config isn't immediately available
  let delegated = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await delegateBuilder.sendAndConfirm(umi);
      delegated = true;
      break;
    } catch (e) {
      if (attempt < 3) {
        await sleep(4000);
      } else {
        throw e;
      }
    }
  }

  return new PublicKey(merkleTree.publicKey.toString());
}

async function main() {
  console.log("🚀 Verifying Market Creator");
  console.log("RPC:", RPC_URL);
  console.log("Market Creator Keypair:", MARKET_CREATOR_KEYPAIR_PATH);

  const connection = new anchor.web3.Connection(RPC_URL, { commitment: "confirmed" });
  const MARKET_CREATOR = loadKeypair(MARKET_CREATOR_KEYPAIR_PATH);

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(MARKET_CREATOR),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.Depredict as anchor.Program<Depredict>;

  const [marketCreatorPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_creator"), MARKET_CREATOR.publicKey.toBytes()],
    program.programId
  );
  console.log("Market Creator PDA:", marketCreatorPda.toBase58());

  // Ensure PDA exists
  await program.account.marketCreator.fetch(marketCreatorPda);

  console.log("Creating MPL Core collection...");
  const coreCollection = await createCoreCollection(RPC_URL, program.programId, marketCreatorPda, MARKET_CREATOR);
  console.log("Collection:", coreCollection.toBase58());

  console.log("Creating Merkle tree...");
  const merkleTree = await createMerkleTree(RPC_URL, marketCreatorPda, MARKET_CREATOR);
  console.log("Merkle Tree:", merkleTree.toBase58());

  console.log("Verifying Market Creator...");
  const verifyTx = await program.methods
    .verifyMarketCreator({ coreCollection, merkleTree })
    .accountsPartial({
      signer: MARKET_CREATOR.publicKey,
      marketCreator: marketCreatorPda,
      coreCollection,
      merkleTree,
      systemProgram: SystemProgram.programId,
    })
    .signers([MARKET_CREATOR])
    .rpc({ commitment: "confirmed" });
  console.log("✅ Verified Market Creator:", verifyTx);

  const out = {
    marketCreatorAuthority: MARKET_CREATOR.publicKey.toBase58(),
    marketCreator: marketCreatorPda.toBase58(),
    coreCollection: coreCollection.toBase58(),
    merkleTree: merkleTree.toBase58(),
    verified: true,
    updatedAt: new Date().toISOString(),
  };
  const outPath = path.resolve(process.cwd(), "market_creator_verified_output.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("📝 Wrote:", outPath);
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});


