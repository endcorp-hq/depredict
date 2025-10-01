import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import type { Depredict } from "../../target/types/depredict";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ENV and defaults
const RPC_URL = process.env.RPC_URL || process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";

// CLI args (optional): node create-market-creator.ts [marketCreatorKeypairPath] [feeVaultKeypairPath]
const MARKET_CREATOR_KEYPAIR_PATH = process.argv[2] || path.resolve(process.cwd(), "keys/market_creator.json");
const FEE_VAULT_KEYPAIR_PATH = process.argv[3] || path.resolve(process.cwd(), "keys/market_fee_vault.json");

function loadKeypair(filePath: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(Buffer.from(secret));
}

async function ensureBalance(connection: anchor.web3.Connection, pubkey: PublicKey, minLamports = LAMPORTS_PER_SOL / 10) {
  const bal = await connection.getBalance(pubkey);
  if (bal < minLamports) {
    console.log(`⚠️  Low balance for ${pubkey.toBase58()}: ${(bal / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  }
}

async function main() {
  console.log("🚀 Creating Market Creator PDA");
  console.log("RPC:", RPC_URL);
  console.log("Market Creator Keypair:", MARKET_CREATOR_KEYPAIR_PATH);
  console.log("Fee Vault Keypair:", FEE_VAULT_KEYPAIR_PATH);

  // Setup provider and program with market creator wallet
  const connection = new anchor.web3.Connection(RPC_URL, { commitment: "confirmed" });
  const MARKET_CREATOR = loadKeypair(MARKET_CREATOR_KEYPAIR_PATH);
  const FEE_VAULT = loadKeypair(FEE_VAULT_KEYPAIR_PATH);

  await ensureBalance(connection, MARKET_CREATOR.publicKey);
  await ensureBalance(connection, FEE_VAULT.publicKey, 0);

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(MARKET_CREATOR),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.Depredict as anchor.Program<Depredict>;

  // Derive Market Creator PDA
  const [marketCreatorPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_creator"), MARKET_CREATOR.publicKey.toBytes()],
    program.programId
  );
  console.log("Market Creator PDA:", marketCreatorPda.toBase58());

  // Step 1: Create Market Creator if missing
  let exists = false;
  try {
    await program.account.marketCreator.fetch(marketCreatorPda);
    exists = true;
    console.log("✅ Market Creator already exists");
  } catch (_) {
    console.log("Creating Market Creator account...");
    const tx = await program.methods
      .createMarketCreator({
        name: "Admin Market Creator",
        feeVault: FEE_VAULT.publicKey,
        creatorFeeBps: 100,
      })
      .accountsPartial({
        signer: MARKET_CREATOR.publicKey,
        marketCreator: marketCreatorPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([MARKET_CREATOR])
      .rpc({ commitment: "confirmed" });
    console.log("✅ Created Market Creator:", tx);
  }

  // Persist result for later scripts/tests
  let isVerified = false;
  try {
    const acct = await program.account.marketCreator.fetch(marketCreatorPda);
    isVerified = !!acct.verified;
  } catch {}
  const out = {
    marketCreatorAuthority: MARKET_CREATOR.publicKey.toBase58(),
    marketCreator: marketCreatorPda.toBase58(),
    verified: isVerified,
    updatedAt: new Date().toISOString(),
  };
  const outPath = path.resolve(process.cwd(), "market_creator_output.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("📝 Wrote:", outPath);
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});


