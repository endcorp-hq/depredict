import { PublicKey, Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../target/types/shortx_contract";

// Devnet USDC mint address
const DEVNET_USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

export const program = anchor.workspace.ShortxContract as Program<ShortxContract>;
export const admin = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/admin.json", "utf-8")))
);
export const feeVault = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/fee-vault.json", "utf-8")))
);

export const localMint = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/local-mint.json", "utf-8")))
);

export const user = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("./tests/keys/user.json", "utf-8")))
);

export const marketId = new anchor.BN(235867);


/**
 * Gets the network configuration and connection URL based on Anchor.toml
 * @returns {Promise<{isDevnet: boolean, connectionUrl: string}>} Network configuration
 */
export async function getNetworkConfig(): Promise<{ isDevnet: boolean; connectionUrl: string }> {
  const provider = anchor.AnchorProvider.env();
  const isDevnet = provider.connection.rpcEndpoint.includes("devnet");
  const connectionUrl = isDevnet 
    ? "https://api.devnet.solana.com"
    : "http://localhost:8899";

  console.log(`Using ${isDevnet ? "devnet" : "localnet"} configuration`);
  console.log(`Connection URL: ${connectionUrl}`);

  return { isDevnet, connectionUrl };
}

/**
 * Gets the appropriate USDC mint based on the environment
 * @returns {Promise<{mint: PublicKey, keypair?: Keypair}>} The USDC mint public key and optional keypair for local testing
 */
export async function getUsdcMint(): Promise<{ mint: PublicKey; keypair?: Keypair }> {
  // Check if we're on devnet by looking at the cluster URL
  const provider = anchor.AnchorProvider.env();
  const isDevnet = provider.connection.rpcEndpoint.includes("devnet");

  if (isDevnet) {
    console.log("Using devnet USDC mint");
    return { mint: DEVNET_USDC_MINT };
  } else {
    console.log("Using local USDC mint");
    const localMint = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync("./local_mint.json", "utf-8")))
    );
    return { mint: localMint.publicKey, keypair: localMint };
  }
}

/**
 * Ensures the given account has enough SOL for rent and fees
 * @param provider The anchor provider
 * @param account The account to check
 * @param requiredBalance The minimum required balance in lamports
 */

export async function ensureAccountBalance(
  provider: anchor.AnchorProvider,
  account: PublicKey,
  requiredBalance: number = 2_000_000_000 // Default 2 SOL
): Promise<void> {
  const balance = await provider.connection.getBalance(account);
  if (balance < requiredBalance) {
    console.log(`Requesting airdrop for account ${account.toString()}...`);
    const signature = await provider.connection.requestAirdrop(account, requiredBalance);
    await provider.connection.confirmTransaction(signature);
    console.log("Airdrop successful");
  }
}