import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configuration for mainnet deployment
const RPC_URL = process.env.RPC_URL;
const PROGRAM_ID = process.env.PROGRAM_ID;

// Initialize connection
const connection = new Connection(RPC_URL, "confirmed");



// Format SOL amount
function formatSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(9);
}

// Format fee amount in different units
function formatFeeAmount(lamports: number): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  const usd = sol * 100; // Assuming 1 SOL = $100 for display purposes
  
  return `${lamports} lamports (${sol.toFixed(9)} SOL, ~$${usd.toFixed(2)})`;
}

// Convert Anchor account numeric fields (number | BN | bigint | stringy) to number
function asNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  if (value != null) {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
    const s = value.toString?.();
    const m = Number(s);
    if (!Number.isNaN(m)) return m;
  }
  throw new Error('Unable to convert value to number');
}

async function main() {
  console.log("🔍 Reading on-chain config account info...");
  console.log("Program ID:", PROGRAM_ID);
  console.log("RPC URL:", RPC_URL);

  try {
    // Calculate config PDA
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      new PublicKey(PROGRAM_ID)
    );
    console.log("🔧 Config PDA:", configPda.toString());

    // Preflight: check account exists and has expected size for current layout
    const info = await connection.getAccountInfo(configPda, "confirmed");
    if (!info) {
      console.log("❌ Config account does not exist on-chain");
      console.log("   Run the init script first: yarn init-mainnet (with devnet RPC/PROGRAM_ID)");
      process.exit(1);
    }
    const expectedSize = 293; // 8 (disc) + 1 + 32 + 32 + 2 + 2 + 8 + 8 + 200
    console.log(`📦 Account owner: ${info.owner.toBase58()}`);
    console.log(`📦 Account data length: ${info.data.length} bytes (expected ${expectedSize})`);
    if (info.data.length !== expectedSize) {
      console.error("❌ Config account size mismatch with current program layout.");
      console.error("   The on-chain account was likely created with an older layout.");
      console.error("   Fix: close the old config and re-initialize it.");
      console.error("   Steps: yarn close-config -> yarn init-mainnet (using devnet env)");
      process.exit(1);
    }

    // Initialize provider (we don't need a wallet for reading)
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(Keypair.generate()), // Dummy wallet for reading
      { commitment: "confirmed" }
    );
    anchor.setProvider(provider);

    // Load the program
    const program = anchor.workspace.Depredict;

    // Check if config exists
    console.log("\n🔍 Checking if config account exists...");
    try {
      const configAccount = await program.account.config.fetch(configPda);
      
      console.log("✅ Config account found!");
      console.log("\n📊 Config Account Details:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`Authority:      ${configAccount.authority.toString()}`);
      console.log(`Fee Vault:      ${configAccount.feeVault.toString()}`);
      console.log(`Fee Amount:     ${formatFeeAmount(asNumber(configAccount.feeAmount))}`);
      console.log(`Version:        ${asNumber(configAccount.version)}`);
      console.log(`Next Market ID: ${asNumber(configAccount.nextMarketId)}`);
      console.log(`Global Markets: ${asNumber(configAccount.globalMarkets)}`);
      console.log(`Bump:           ${asNumber(configAccount.bump)}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Check account balances
      console.log("\n💰 Account Balances:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // Check authority balance
      const authorityBalance = await connection.getBalance(configAccount.authority);
      console.log(`Authority Balance:     ${formatSol(authorityBalance)} SOL`);
      
      // Check fee vault balance
      const feeVaultBalance = await connection.getBalance(configAccount.feeVault);
      console.log(`Fee Vault Balance:     ${formatSol(feeVaultBalance)} SOL`);
      
      // Check config account balance (rent)
      const configBalance = await connection.getBalance(configPda);
      console.log(`Config Account Balance: ${formatSol(configBalance)} SOL (rent)`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Calculate total fees collected (if any)
      if (asNumber(configAccount.globalMarkets) > 0) {
        const estimatedFees = asNumber(configAccount.globalMarkets) * asNumber(configAccount.feeAmount);
        console.log(`\n📈 Estimated Total Fees Collected: ${formatFeeAmount(estimatedFees)}`);
        console.log(`   (Based on ${asNumber(configAccount.globalMarkets)} markets)`);
      }

      // Check if accounts are funded
      console.log("\n🔍 Account Status:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      const minBalance = LAMPORTS_PER_SOL * 0.01; // 0.01 SOL minimum
      
      if (authorityBalance < minBalance) {
        console.log("⚠️  Authority account has low balance");
      } else {
        console.log("✅ Authority account is well funded");
      }
      
      if (feeVaultBalance > 0) {
        console.log("💰 Fee vault has collected fees");
      } else {
        console.log("📭 Fee vault is empty");
      }
      
      if (configBalance > 0) {
        console.log("✅ Config account has sufficient rent");
      } else {
        console.log("⚠️  Config account may need rent");
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    } catch (error) {
      if (error.message.includes("Account does not exist")) {
        console.log("❌ Config account does not exist on-chain");
        console.log("   Run the init script first: yarn init-mainnet");
      } else {
        console.error("❌ Error reading config account:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
      }
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ Error during config reading:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

export { main }; 