import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Depredict } from "../target/types/depredict";
import * as path from "path";

// Load the local mint keypair that we'll use for testing
const LOCAL_MINT = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/local-mint.json", "utf-8")))
);

// Oracle Key
const ORACLE_KEY = new PublicKey("HX5YhqFV88zFhgPxEzmR1GFq8hPccuk2gKW58g1TLvbL");

const METAPLEX_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
// Initialize provider and program
// The provider will be set based on the Anchor.toml configuration
// or command line arguments when the tests are run
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.Depredict as Program<Depredict>;

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

// Export provider, program, and keypairs for use in tests
export { provider, program, ADMIN, FEE_VAULT, METAPLEX_ID, USER, LOCAL_MINT, ORACLE_KEY };

/**
 * Gets the current market ID for testing
 * This can be updated by the test runner after market creation
 * @returns {Promise<anchor.BN>} The current market ID
 */
export async function getCurrentMarketId(): Promise<anchor.BN> {
  try {
    // Try to read from a market ID file first
    const marketIdPath = path.join(__dirname, 'market-id.json');
    if (fs.existsSync(marketIdPath)) {
      const marketIdData = JSON.parse(fs.readFileSync(marketIdPath, "utf-8"));
      
      // Support both old and new format
      if (marketIdData.marketId) {
        // Old format - backward compatibility
        return new anchor.BN(marketIdData.marketId);
      } else if (marketIdData.currentActive) {
        // New format
        return new anchor.BN(marketIdData.currentActive);
      }
    }
  } catch (error) {
    console.log('Could not read market ID file, using default');
  }
  
  // Default to market ID 1 if no file exists
  return new anchor.BN(1);
}

/**
 * Gets a specific market ID by state
 * @param state The market state to get ('active', 'closed', 'resolved', 'manual')
 * @returns {Promise<anchor.BN>} The market ID for the specified state
 */
export async function getMarketIdByState(state: string): Promise<anchor.BN> {
  try {
    const marketIdPath = path.join(__dirname, 'market-id.json');
    if (fs.existsSync(marketIdPath)) {
      const marketIdData = JSON.parse(fs.readFileSync(marketIdPath, 'utf-8'));
      
      // Handle new format (markets object)
      if (marketIdData.markets && marketIdData.markets[state]) {
        return new anchor.BN(marketIdData.markets[state].id);
      }
      
      // Handle old format (single marketId)
      if (marketIdData.marketId) {
        console.log(`Using legacy market ID format: ${marketIdData.marketId}`);
        return new anchor.BN(marketIdData.marketId);
      }
    }
  } catch (error) {
    console.log(`Could not read market ID for state ${state}, using default`);
  }
  
  // Default to market ID 1 if no file exists or state not found
  console.log(`No market found for state '${state}', using default market ID 1`);
  return new anchor.BN(1);
}

/**
 * Updates the market ID file with new market information
 * @param markets Object containing market states and IDs
 * @param currentActive The currently active market ID
 */
export async function updateMarketIds(markets: any, currentActive?: string): Promise<void> {
  const marketIdPath = path.join(__dirname, 'market-id.json');
  const timestamp = new Date().toISOString();
  
  const marketData = {
    markets,
    currentActive: currentActive || markets.active?.id || "1",
    timestamp
  };
  
  fs.writeFileSync(marketIdPath, JSON.stringify(marketData, null, 2));
  console.log('Updated market IDs:', marketData);
}

// For backward compatibility, export a default MARKET_ID
export const MARKET_ID = new anchor.BN(1);

/**
 * Gets the network configuration based on Anchor.toml
 * @returns {Promise<{isDevnet: boolean}>} Network configuration
 */
export async function getNetworkConfig(): Promise<{ isDevnet: boolean }> {
  // Check the actual connection endpoint being used
  const endpoint = provider.connection.rpcEndpoint;
  const isDevnet = endpoint.includes("devnet") || endpoint.includes("api.devnet.solana.com");
  console.log(`Using ${isDevnet ? "devnet" : "localnet"} configuration`);
  console.log(`Connection URL: ${endpoint}`);
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

/**
 * Funds system programs and accounts that need SOL for rent on localnet
 * This is especially important for MPL Core program which creates accounts
 */
export async function fundSystemAccounts(): Promise<void> {
  const { isDevnet } = await getNetworkConfig();
  
  if (isDevnet) {
    console.log("Skipping system account funding on devnet");
    return;
  }

  console.log("Funding system accounts for localnet...");
  
  try {
    // Fund MPL Core program
    const mplCoreProgram = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
    const mplCoreBalance = await provider.connection.getBalance(mplCoreProgram);
    console.log(`MPL Core program balance: ${mplCoreBalance / LAMPORTS_PER_SOL} SOL`);
    
    if (mplCoreBalance < 10 * LAMPORTS_PER_SOL) {
      console.log("Funding MPL Core program with 10 SOL...");
      const signature = await provider.connection.requestAirdrop(mplCoreProgram, 10 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(signature, "confirmed");
      console.log("MPL Core program funded successfully");
    }

    // Fund Metaplex program
    const metaplexProgram = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    const metaplexBalance = await provider.connection.getBalance(metaplexProgram);
    console.log(`Metaplex program balance: ${metaplexBalance / LAMPORTS_PER_SOL} SOL`);
    
    if (metaplexBalance < 5 * LAMPORTS_PER_SOL) {
      console.log("Funding Metaplex program with 5 SOL...");
      const signature = await provider.connection.requestAirdrop(metaplexProgram, 5 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(signature, "confirmed");
      console.log("Metaplex program funded successfully");
    }

    // Fund Token program
    const tokenProgram = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const tokenBalance = await provider.connection.getBalance(tokenProgram);
    console.log(`Token program balance: ${tokenBalance / LAMPORTS_PER_SOL} SOL`);
    
    if (tokenBalance < 5 * LAMPORTS_PER_SOL) {
      console.log("Funding Token program with 5 SOL...");
      const signature = await provider.connection.requestAirdrop(tokenProgram, 5 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(signature, "confirmed");
      console.log("Token program funded successfully");
    }

    console.log("System account funding completed");
  } catch (error) {
    console.error("Error funding system accounts:", error);
    throw error;
  }
}

/**
 * Ensures all necessary accounts have sufficient SOL for testing
 * This includes user accounts and system programs
 */
export async function ensureAllAccountsFunded(): Promise<void> {
  console.log("Ensuring all accounts are funded...");
  
  // Fund system programs first
  await fundSystemAccounts();
  
  // Fund user accounts
  await ensureAccountBalance(ADMIN.publicKey, 2 * LAMPORTS_PER_SOL);
  await ensureAccountBalance(USER.publicKey, 2 * LAMPORTS_PER_SOL);
  await ensureAccountBalance(FEE_VAULT.publicKey, 1 * LAMPORTS_PER_SOL);
  
  console.log("All accounts funded successfully");
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