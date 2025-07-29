import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

// Configuration for mainnet deployment
const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";
const PROGRAM_ID = "DePrXVZYoWZkUwayZkp9sxJDUavCPai1Xexv1mmFzXYG"; // Update this with your actual mainnet program ID

// Initialize connection and provider
const connection = new Connection(MAINNET_RPC_URL, "confirmed");

// Load the admin keypair from environment or file
function loadAdminKeypair(): Keypair {
  // Try to load from environment variable first
  const adminKeyString = process.env.ADMIN_PRIVATE_KEY;
  if (adminKeyString) {
    try {
      const adminKeyArray = JSON.parse(adminKeyString);
      return Keypair.fromSecretKey(new Uint8Array(adminKeyArray));
    } catch (error) {
      console.error("Failed to parse ADMIN_PRIVATE_KEY from environment:", error);
    }
  }

  // Try to load from file
  const adminKeyPath = process.env.ADMIN_KEY_PATH || "./admin-keypair.json";
  try {
    if (fs.existsSync(adminKeyPath)) {
      const adminKeyData = JSON.parse(fs.readFileSync(adminKeyPath, "utf-8"));
      return Keypair.fromSecretKey(new Uint8Array(adminKeyData));
    }
  } catch (error) {
    console.error("Failed to load admin keypair from file:", error);
  }

  throw new Error("Admin keypair not found. Please set ADMIN_PRIVATE_KEY environment variable or provide ADMIN_KEY_PATH.");
}

// Load the fee vault keypair
function loadFeeVaultKeypair(): Keypair {
  // Try to load from environment variable first
  const feeVaultKeyString = process.env.FEE_VAULT_PRIVATE_KEY;
  if (feeVaultKeyString) {
    try {
      const feeVaultKeyArray = JSON.parse(feeVaultKeyString);
      return Keypair.fromSecretKey(new Uint8Array(feeVaultKeyArray));
    } catch (error) {
      console.error("Failed to parse FEE_VAULT_PRIVATE_KEY from environment:", error);
    }
  }

  // Try to load from file
  const feeVaultKeyPath = process.env.FEE_VAULT_KEY_PATH || "./fee-vault-keypair.json";
  try {
    if (fs.existsSync(feeVaultKeyPath)) {
      const feeVaultKeyData = JSON.parse(fs.readFileSync(feeVaultKeyPath, "utf-8"));
      return Keypair.fromSecretKey(new Uint8Array(feeVaultKeyData));
    }
  } catch (error) {
    console.error("Failed to load fee vault keypair from file:", error);
  }

  throw new Error("Fee vault keypair not found. Please set FEE_VAULT_PRIVATE_KEY environment variable or provide FEE_VAULT_KEY_PATH.");
}

// Ensure account has sufficient balance
async function ensureAccountBalance(
  account: PublicKey,
  requiredBalance: number = LAMPORTS_PER_SOL * 0.1 // 0.1 SOL for mainnet
): Promise<boolean> {
  try {
    const balance = await connection.getBalance(account);
    if (balance < requiredBalance) {
      console.error(`Insufficient balance for account ${account.toString()}`);
      console.error(`Required: ${requiredBalance / LAMPORTS_PER_SOL} SOL`);
      console.error(`Current: ${balance / LAMPORTS_PER_SOL} SOL`);
      return false;
    }
    console.log(`Account ${account.toString()} has sufficient balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    return true;
  } catch (error) {
    console.error("Error checking account balance:", error);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting mainnet config initialization...");
  console.log("Program ID:", PROGRAM_ID);
  console.log("RPC URL:", MAINNET_RPC_URL);

  try {
    // Load keypairs
    const admin = loadAdminKeypair();
    const feeVault = loadFeeVaultKeypair();

    console.log("Admin public key:", admin.publicKey.toString());
    console.log("Fee vault public key:", feeVault.publicKey.toString());

    // Check account balances
    console.log("\n📊 Checking account balances...");
    const adminHasBalance = await ensureAccountBalance(admin.publicKey);
    if (!adminHasBalance) {
      console.error("❌ Admin account has insufficient balance. Please fund the account.");
      process.exit(1);
    }

    // Initialize provider
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(admin),
      { commitment: "confirmed" }
    );
    anchor.setProvider(provider);

    // Load the program
    const program = anchor.workspace.Depredict;

    // Calculate config PDA
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      new PublicKey(PROGRAM_ID)
    );
    console.log("Config PDA:", configPda.toString());

    // Check if config already exists
    console.log("\n🔍 Checking if config already exists...");
    try {
      const existingConfig = await program.account.config.fetch(configPda);
      console.log("⚠️  Config already exists!");
      console.log("Current authority:", existingConfig.authority.toString());
      console.log("Current fee vault:", existingConfig.feeVault.toString());
      console.log("Current fee amount:", existingConfig.feeAmount.toString());
      console.log("Current version:", existingConfig.version.toString());
      console.log("Next market ID:", existingConfig.nextMarketId.toString());
      console.log("Number of markets:", existingConfig.numMarkets.toString());
      
      console.log("\n❌ Config already initialized. Exiting...");
      process.exit(0);
    } catch (error) {
      console.log("✅ Config does not exist, proceeding with initialization...");
    }

    // Initialize config
    console.log("\n🔧 Initializing config...");
    const feeAmount = new anchor.BN(100); // Initial fee amount in lamports (0.0000001 SOL)

    console.log("Fee amount:", feeAmount.toString(), "lamports");

    const tx = await program.methods
      .initializeConfig(feeAmount)
      .accounts({
        signer: admin.publicKey,
        feeVault: feeVault.publicKey,
        config: configPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc({
        skipPreflight: false,
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });

    console.log("✅ Config initialization successful!");
    console.log("Transaction signature:", tx);

    // Verify the config was created correctly
    console.log("\n🔍 Verifying config...");
    const configAccount = await program.account.config.fetch(configPda);
    console.log("✅ Config verification successful!");
    console.log("Authority:", configAccount.authority.toString());
    console.log("Fee vault:", configAccount.feeVault.toString());
    console.log("Fee amount:", configAccount.feeAmount.toString());
    console.log("Version:", configAccount.version.toString());
    console.log("Next market ID:", configAccount.nextMarketId.toString());
    console.log("Number of markets:", configAccount.numMarkets.toString());

    // Save config info to file
    const configInfo = {
      programId: PROGRAM_ID,
      configPda: configPda.toString(),
      authority: admin.publicKey.toString(),
      feeVault: feeVault.publicKey.toString(),
      feeAmount: feeAmount.toString(),
      version: configAccount.version.toString(),
      nextMarketId: configAccount.nextMarketId.toString(),
      numMarkets: configAccount.numMarkets.toString(),
      transactionSignature: tx,
      initializedAt: new Date().toISOString(),
    };

    const configFilePath = path.join(__dirname, "../config-info.json");
    fs.writeFileSync(configFilePath, JSON.stringify(configInfo, null, 2));
    console.log(`\n💾 Config info saved to: ${configFilePath}`);

    console.log("\n🎉 Mainnet config initialization completed successfully!");

  } catch (error) {
    console.error("❌ Error during config initialization:", error);
    
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
    
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

export { main }; 