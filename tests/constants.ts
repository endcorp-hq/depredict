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

// Bubblegum + MPL program IDs
const BUBBLEGUM_PROGRAM_ID = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
const MPL_CORE_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const MPL_NOOP_ID = new PublicKey("mnoopTCrg4p8ry25e4bcWA9XZjbNjMTfgYVGGEdRsf3");
const ACCOUNT_COMPRESSION_ID = new PublicKey("mcmt6YrQEMKw8Mw43FmpRLmf7BqRnFMKmAcbxE3xkAW");

// Export provider, program, and keypairs for use in tests
export { provider, program, ADMIN, FEE_VAULT, METAPLEX_ID, USER, LOCAL_MINT, ORACLE_KEY, BUBBLEGUM_PROGRAM_ID, MPL_CORE_ID, MPL_NOOP_ID, ACCOUNT_COMPRESSION_ID };
