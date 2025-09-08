import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Depredict } from "../target/types/depredict";
import * as path from "path";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";

// Load the local mint keypair that we'll use for testing
const LOCAL_MINT = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/local-mint.json", "utf-8")))
);

// Oracle Key
const ORACLE_KEY = new PublicKey("HX5YhqFV88zFhgPxEzmR1GFq8hPccuk2gKW58g1TLvbL");

const METAPLEX_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
// Set default environment variables if not already set
if (!process.env.ANCHOR_PROVIDER_URL) {
  process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
  console.log("Set ANCHOR_PROVIDER_URL to localnet:", process.env.ANCHOR_PROVIDER_URL);
}

if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = require('os').homedir() + "/.config/solana/id.json";
  console.log("Set ANCHOR_WALLET to:", process.env.ANCHOR_WALLET);
}

// Initialize provider and program
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
    const marketIdPath = path.join(process.cwd(), 'tests', 'market-id.json');
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
 * Returns a current unix timestamp in seconds using validator block time when available,
 * otherwise falls back to wall-clock time. This supports Surfpool or RPCs that don't implement getBlockTime.
 */
export async function getCurrentUnixTime(): Promise<number> {
  try {
    const currentSlot = await provider.connection.getSlot();
    const blockTime = await provider.connection.getBlockTime(currentSlot);
    if (blockTime) return blockTime;
  } catch (_) {}
  return Math.floor(Date.now() / 1000);
}

/**
 * Gets a specific market ID by state
 * @param state The market state to get ('active', 'closed', 'resolved', 'manual')
 * @returns {Promise<anchor.BN>} The market ID for the specified state
 */
export async function getMarketIdByState(state: string): Promise<anchor.BN> {
  try {
    const marketIdPath = path.join(process.cwd(), 'tests', 'market-id.json');
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

/**
 * Gets the market creator details for testing
 * @returns {Promise<{marketCreator: PublicKey; coreCollection: PublicKey; verified: boolean}>} Market creator details
 */
export async function getMarketCreatorDetails(): Promise<{
  marketCreator: PublicKey;
  coreCollection: PublicKey;
  verified: boolean;
}> {
  // Create the market creator account PDA
  const [marketCreatorPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_creator"), ADMIN.publicKey.toBytes()],
    program.programId
  );

  try {
    // Try to fetch existing market creator
    const marketCreatorAccount = await program.account.marketCreator.fetch(marketCreatorPda);
    console.log("✅ Market creator found:", marketCreatorPda.toString());
    console.log("   Verified:", marketCreatorAccount.verified);
    return {
      marketCreator: marketCreatorPda,
      coreCollection: marketCreatorAccount.coreCollection,
      verified: marketCreatorAccount.verified,
    };
  } catch (error) {
    console.log("❌ Market creator not found:", marketCreatorPda.toString());
    console.log("   Error:", error.message);
    console.log("   Please run setup-market-creator.ts first to create the market creator account");
    throw new Error("Market creator not found. Run setup-market-creator.ts first.");
  }
}

/**
 * Creates a market creator account if it doesn't exist
 * @returns {Promise<{marketCreator: PublicKey; coreCollection: PublicKey}>} Market creator details
 */
export async function ensureMarketCreatorExists(): Promise<{
  marketCreator: PublicKey;
  coreCollection: PublicKey;
}> {
  try {
    return await getMarketCreatorDetails();
  } catch (error) {
    console.log("Market creator doesn't exist, creating it now...");
    
    // Import the setup function dynamically to avoid circular dependencies
    const { execSync } = require('child_process');
    try {
      // Try the simple test first
      console.log("Trying simple market creator setup...");
      execSync('yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/test-market-creator-simple.ts', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      // Try to fetch again
      return await getMarketCreatorDetails();
    } catch (simpleSetupError) {
      console.log("Simple setup failed, trying full setup...");
      try {
        execSync('yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/setup-market-creator.ts', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        // Try to fetch again
        return await getMarketCreatorDetails();
      } catch (fullSetupError) {
        console.error("Both simple and full setup failed:", fullSetupError);
        throw new Error("Could not create market creator automatically. Please run setup-market-creator.ts manually.");
      }
    }
  }
}

/**
 * Creates a market creator account (step 1 of 2)
 * @param name The name of the market creator
 * @param feeVault The fee vault public key
 * @returns {Promise<{marketCreator: PublicKey}>} Market creator details
 */
export async function createMarketCreator(name: string, feeVault: PublicKey): Promise<{
  marketCreator: PublicKey;
}> {
  // Create the market creator account PDA
  const [marketCreatorPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_creator"), ADMIN.publicKey.toBytes()],
    program.programId
  );

  try {
    // Check if already exists
    await program.account.marketCreator.fetch(marketCreatorPda);
    console.log("✅ Market creator already exists:", marketCreatorPda.toString());
    return { marketCreator: marketCreatorPda };
  } catch (error) {
    // Create the market creator account
    console.log("Creating market creator account...");
    
    const tx = await program.methods
      .createMarketCreator({
        name: name,
        feeVault: feeVault,
      })
      .accountsPartial({
        signer: ADMIN.publicKey,
        marketCreator: marketCreatorPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ADMIN])
      .rpc({ commitment: "confirmed" });

    console.log("✅ Market creator created (unverified):", marketCreatorPda.toString());
    console.log("   Transaction:", tx);
    
    return { marketCreator: marketCreatorPda };
  }
}

/**
 * Verifies a market creator with a collection (step 2 of 2)
 * @param marketCreator The market creator PDA
 * @param coreCollection The core collection public key
 * @returns {Promise<void>}
 */
export async function verifyMarketCreator(marketCreator: PublicKey, coreCollection: PublicKey, merkleTree: PublicKey, treeConfig: PublicKey): Promise<void> {
  console.log("Verifying market creator with collection...");
  
  const tx = await program.methods
    .verifyMarketCreator({
      coreCollection: coreCollection,
      merkleTree: merkleTree,
    })
    .accountsPartial({
      signer: ADMIN.publicKey,
      marketCreator: marketCreator,
      coreCollection: coreCollection,
      merkleTree: merkleTree,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([ADMIN])
    .rpc({ commitment: "confirmed" });

  console.log("✅ Market creator verified with collection:", coreCollection.toString());
  console.log("   Transaction:", tx);
}

export async function getConfigPda(): Promise<PublicKey> {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  return configPda;
}

/**
 * Gets the collection information from market-id.json
 * @returns {Promise<{address: PublicKey; keypair?: Buffer; owner: PublicKey}>} Collection details
 */
export async function getCollectionDetails(): Promise<{
  address: PublicKey;
  keypair?: Buffer;
  owner: PublicKey;
}> {
  try {
    const marketIdPath = path.join(process.cwd(), 'tests', 'market-id.json');
    if (fs.existsSync(marketIdPath)) {
      const marketData = JSON.parse(fs.readFileSync(marketIdPath, 'utf8'));
      
      if (marketData.collection) {
        console.log("✅ Collection details found in market-id.json");
        console.log("   Collection:", marketData.collection.address);
        console.log("   Owner:", marketData.collection.owner);
        
        return {
          address: new PublicKey(marketData.collection.address),
          keypair: marketData.collection.keypair ? Buffer.from(Object.values(marketData.collection.keypair)) : undefined,
          owner: new PublicKey(marketData.collection.owner)
        };
      }
    }
  } catch (error) {
    console.log("Could not read collection details from market-id.json:", error.message);
  }
  
  // Fallback to default collection (this will cause constraint errors)
  console.log("⚠️  Using default collection - this may cause constraint errors");
  return {
    address: new PublicKey("11111111111111111111111111111111"),
    owner: new PublicKey("11111111111111111111111111111111")
  };
}

/**
 * Loads market creator details from the JSON file created by the market creator test
 * @returns {Promise<{marketCreator: PublicKey; coreCollection: PublicKey; verified: boolean}>} Market creator details
 */
export async function getVerifiedMarketCreatorDetails(): Promise<{
  marketCreator: PublicKey;
  coreCollection: PublicKey;
  verified: boolean;
}> {
  try {
    // Try to load from the JSON file first
    const jsonPath = path.join(process.cwd(), "market-creator.json");
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      console.log("✅ Loaded market creator details from JSON file");
      console.log("   Market Creator:", data.marketCreator);
      console.log("   Core Collection:", data.coreCollection);
      console.log("   Verified:", data.verified);
      
      return {
        marketCreator: new PublicKey(data.marketCreator),
        coreCollection: new PublicKey(data.coreCollection),
        verified: data.verified
      };
    }
  } catch (error) {
    console.log("⚠️  Could not load from JSON file, falling back to on-chain data:", error.message);
  }
  
  // Fallback to on-chain data if JSON file doesn't exist or is invalid
  return await getMarketCreatorDetails();
}