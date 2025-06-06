import { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import * as fs from "fs";
import { provider, ADMIN } from "./helpers";

async function main() {
  // Create a new Keypair for the mint
  const mintKeypair = Keypair.generate();

  // Create the mint on chain
  const mintPubkey = await createMint(
    provider.connection,
    ADMIN, // payer
    ADMIN.publicKey, // mint authority
    ADMIN.publicKey, // freeze authority
    6, // decimals (USDC standard)
    mintKeypair // mint keypair
  );

  // Save the mint secret key to file
  fs.writeFileSync(
    "./tests/keys/local-mint.json",
    JSON.stringify(Array.from(mintKeypair.secretKey)),
    { encoding: "utf-8" }
  );

  console.log("Created new USDC test mint:", mintPubkey.toBase58());
  console.log("Save this public key to the constants.rs file and rebuild the program.")
  console.log("Mint authority:", mintKeypair.publicKey.toBase58());
  console.log("Secret key saved to ./tests/keys/local-mint.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 