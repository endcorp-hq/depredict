import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../target/types/shortx_contract";

// Load the local mint keypair that we'll use for testing
const LOCAL_MINT = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/local-mint.json", "utf-8")))
);

// Oracle Key
const ORACLE_KEY = new PublicKey("HX5YhqFV88zFhgPxEzmR1GFq8hPccuk2gKW58g1TLvbL");

const METAPLEX_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
// Initialize provider and program
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.ShortxContract as Program<ShortxContract>;

// Load keypairs
const ADMIN = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/keypair.json", "utf-8")))
);
const FEE_VAULT = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/fee-vault.json", "utf-8")))
);

const USER = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/user.json", "utf-8")))
);

const MARKET_ID = new anchor.BN(20);

// Export provider, program, and keypairs for use in tests
export { provider, program, ADMIN, FEE_VAULT, METAPLEX_ID, USER, LOCAL_MINT, ORACLE_KEY, MARKET_ID };

/**
 * Gets the network configuration based on Anchor.toml
 * @returns {Promise<{isDevnet: boolean}>} Network configuration
 */
export async function getNetworkConfig(): Promise<{ isDevnet: boolean }> {
  const isDevnet = provider.connection.rpcEndpoint.includes("devnet");
  console.log(`Using ${isDevnet ? "devnet" : "localnet"} configuration`);
  console.log(`Connection URL: ${provider.connection.rpcEndpoint}`);
  return { isDevnet };
}

/**
 * Ensures the given account has enough SOL for rent and fees
 * @param account The account to check
 * @param requiredBalance The minimum required balance in lamports
 * @param shouldAirdrop Whether to perform airdrop if balance is insufficient
 * @returns {Promise<boolean>} True if account has sufficient balance, false if insufficient and no airdrop was performed
 */
export async function ensureAccountBalance(
  account: PublicKey,
  requiredBalance: number = LAMPORTS_PER_SOL, // Default 1 SOL
  shouldAirdrop: boolean = true // Default to true for backward compatibility
): Promise<boolean> {
  const { isDevnet } = await getNetworkConfig();
  
  try {
    // Test connection
    await provider.connection.getVersion();
    console.log("Successfully connected to Solana network");
    
    // Get balance and request airdrop if needed
    const balance = await provider.connection.getBalance(account);
    console.log(`Current balance for ${account.toString()}:`, balance / LAMPORTS_PER_SOL, "SOL");
    
    if (balance < requiredBalance) {
      if (!shouldAirdrop) {
        console.log(`Insufficient balance for ${account.toString()} and airdrop disabled`);
        return false;
      }

      console.log(`Requesting airdrop for ${account.toString()}...`);
      const signature = await provider.connection.requestAirdrop(account, requiredBalance);
      console.log("Airdrop signature:", signature);
      await provider.connection.confirmTransaction(signature, "confirmed");
      
      // Verify new balance
      const newBalance = await provider.connection.getBalance(account);
      console.log(`New balance for ${account.toString()}:`, newBalance / LAMPORTS_PER_SOL, "SOL");
    }
    return true;
  } catch (error) {
    console.error("Connection error:", error);
    if (!isDevnet) {
      console.error("Make sure you have a local validator running with: solana-test-validator");
    }
    throw error;
  }
}

/**
 * Gets the USDC mint for testing
 * @returns {Promise<{mint: PublicKey}>} The USDC mint public key
 */
export async function getUsdcMint(): Promise<{ mint: PublicKey }> {
  console.log("Using local USDC mint for testing:", LOCAL_MINT.publicKey.toString());
  return { mint: LOCAL_MINT.publicKey };
}

// Helper to extract Anchor error code from error object/logs
export function extractErrorCode(error) {
  // Try Anchor error code
  if (error && error.code) return error.code;
  // Try Anchor error name
  if (error && error.error && error.error.errorCode) return error.error.errorCode;
  // Try logs
  if (error && error.logs) {
    for (const log of error.logs) {
      const match = log.match(/Error Code: ([A-Za-z0-9_]+)/);
      if (match) return match[1];
      // Anchor error format: 'Program log: AnchorError ... Custom error: <code>'
      const anchorMatch = log.match(/Program log: AnchorError.*?([A-Za-z0-9_]+)/);
      if (anchorMatch) return anchorMatch[1];
    }
  }
  // Try error string
  if (error && error.toString) {
    const match = error.toString().match(/Error Code: ([A-Za-z0-9_]+)/);
    if (match) return match[1];
    // Anchor error format: 'AnchorError ... Custom error: <code>'
    const anchorMatch = error.toString().match(/AnchorError.*?([A-Za-z0-9_]+)/);
    if (anchorMatch) return anchorMatch[1];
  }
  return null;
}