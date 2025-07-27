import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createMint, getMint } from "@solana/spl-token";
import * as fs from "fs";
import { assert } from "chai";
import { provider, ADMIN, ensureAccountBalance } from "./helpers";

describe("USDC Mint Setup", () => {
  let mintKeypair: Keypair;
  let mintPubkey: PublicKey;

  before(async () => {
    // Ensure ADMIN has enough SOL for transactions
    await ensureAccountBalance(ADMIN.publicKey);
    
    // Load existing mint keypair or create new one
    const mintKeyPath = "./tests/keys/local-mint.json";
    
    if (fs.existsSync(mintKeyPath)) {
      console.log("Loading existing mint keypair from file...");
      const secretKey = JSON.parse(fs.readFileSync(mintKeyPath, "utf-8"));
      mintKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
      mintPubkey = mintKeypair.publicKey;
    } else {
      console.log("Creating new mint keypair...");
      mintKeypair = Keypair.generate();
      mintPubkey = mintKeypair.publicKey;
    }

    console.log("Mint public key:", mintPubkey.toString());
  });

  it("Creates or verifies USDC mint on localnet", async () => {
    try {
      // Try to get the mint to see if it already exists
      const existingMint = await getMint(provider.connection, mintPubkey);
      console.log("✅ USDC mint already exists on localnet");
      console.log("Mint decimals:", existingMint.decimals);
      console.log("Mint authority:", existingMint.mintAuthority?.toString());
      console.log("Freeze authority:", existingMint.freezeAuthority?.toString());
      
      // Verify it has the correct properties
      assert.equal(existingMint.decimals, 6, "Mint should have 6 decimals (USDC standard)");
      assert.ok(existingMint.mintAuthority, "Mint should have a mint authority");
      assert.ok(existingMint.freezeAuthority, "Mint should have a freeze authority");
      
    } catch (error) {
      // Mint doesn't exist, create it
      console.log("Creating new USDC mint on localnet...");
      
      const newMintPubkey = await createMint(
        provider.connection,
        ADMIN, // payer
        ADMIN.publicKey, // mint authority
        ADMIN.publicKey, // freeze authority
        6, // decimals (USDC standard)
        mintKeypair // mint keypair
      );

      console.log("✅ Created new USDC test mint:", newMintPubkey.toString());
      console.log("Mint authority:", ADMIN.publicKey.toString());
      console.log("Freeze authority:", ADMIN.publicKey.toString());

      // Save the mint secret key to file if it doesn't exist
      const mintKeyPath = "./tests/keys/local-mint.json";
      if (!fs.existsSync(mintKeyPath)) {
        fs.writeFileSync(
          mintKeyPath,
          JSON.stringify(Array.from(mintKeypair.secretKey)),
          { encoding: "utf-8" }
        );
        console.log("Secret key saved to ./tests/keys/local-mint.json");
      }

      // Verify the mint was created correctly
      const createdMint = await getMint(provider.connection, newMintPubkey);
      assert.equal(createdMint.decimals, 6, "Created mint should have 6 decimals");
      assert.ok(createdMint.mintAuthority, "Created mint should have a mint authority");
      assert.ok(createdMint.freezeAuthority, "Created mint should have a freeze authority");
    }
  });

  it("Verifies mint is usable for testing", async () => {
    // Additional verification that the mint is properly set up
    const mint = await getMint(provider.connection, mintPubkey);
    
    console.log("Mint verification:");
    console.log("- Address:", mint.address.toString());
    console.log("- Decimals:", mint.decimals);
    console.log("- Supply:", mint.supply.toString());
    console.log("- Mint Authority:", mint.mintAuthority?.toString());
    console.log("- Freeze Authority:", mint.freezeAuthority?.toString());
    console.log("- Is Initialized:", mint.isInitialized);
    
    assert.ok(mint.isInitialized, "Mint should be initialized");
    assert.equal(mint.decimals, 6, "Mint should have 6 decimals");
    assert.ok(mint.mintAuthority, "Mint should have a mint authority");
    
    console.log("✅ USDC mint is ready for testing");
  });
}); 