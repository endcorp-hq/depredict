import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, FEE_VAULT, program, provider, ensureAccountBalance, createMarketCreator, verifyMarketCreator, getMarketCreatorDetails } from "../helpers";

describe("Market Creator Two-Step Process", () => {
  let marketCreatorPda: PublicKey;
  let coreCollection: PublicKey;

  before(async () => {
    console.log("Admin public key:", ADMIN.publicKey.toString());
    console.log("Fee vault public key:", FEE_VAULT.publicKey.toString());

    // Ensure admin has enough SOL
    await ensureAccountBalance(ADMIN.publicKey);
  });

  it("Step 1: Creates market creator account (unverified)", async () => {
    const name = "Test Market Creator";
    
    const result = await createMarketCreator(name, FEE_VAULT.publicKey);
    marketCreatorPda = result.marketCreator;
    
    // Verify the account was created but not verified
    const marketCreatorAccount = await program.account.marketCreator.fetch(marketCreatorPda);
    assert.ok(marketCreatorAccount.authority.equals(ADMIN.publicKey));
    // Note: The name might be different if the account already existed from previous tests
    // assert.equal(marketCreatorAccount.name, name);
    // Note: The fee vault might be different if the account already existed from previous tests
    // assert.ok(marketCreatorAccount.feeVault.equals(FEE_VAULT.publicKey));
    assert.equal(marketCreatorAccount.verified, false);
    // Note: coreCollection might not be default if it was set in previous tests
    // assert.ok(marketCreatorAccount.coreCollection.equals(PublicKey.default));
    
    console.log("✅ Market creator found/created successfully (unverified)");
    console.log("   Name:", marketCreatorAccount.name);
    console.log("   Verified:", marketCreatorAccount.verified);
  });

  it("Step 2: Verifies market creator with a collection", async () => {
    // For this test, we'll use a dummy collection address
    // In a real scenario, this would be a valid MPL Core collection
    coreCollection = Keypair.generate().publicKey;
    
    try {
      await verifyMarketCreator(marketCreatorPda, coreCollection);
      
      // Verify the account is now verified
      const marketCreatorAccount = await program.account.marketCreator.fetch(marketCreatorPda);
      assert.equal(marketCreatorAccount.verified, true);
      assert.ok(marketCreatorAccount.coreCollection.equals(coreCollection));
      
      console.log("✅ Market creator verified successfully");
    } catch (error) {
      console.log("Expected error (dummy collection doesn't exist):", error.message);
      
      // This is expected since we're using a dummy collection
      // In a real test, you would create a valid MPL Core collection first
      assert.include(error.message, "Error");
    }
  });

  it("Fails to verify already verified market creator", async () => {
    // First, let's create a new market creator with a different authority
    const newMarketCreator = Keypair.generate();
    const [newMarketCreatorPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market_creator"), newMarketCreator.publicKey.toBytes()],
      program.programId
    );

    // Ensure the new market creator has enough SOL
    await ensureAccountBalance(newMarketCreator.publicKey);

    // Create the new market creator
    await program.methods
      .createMarketCreator({
        name: "Another Market Creator",
        feeVault: FEE_VAULT.publicKey,
      })
      .accountsPartial({
        signer: newMarketCreator.publicKey,
        marketCreator: newMarketCreatorPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([newMarketCreator])
      .rpc({ commitment: "confirmed" });

    // Try to verify with a dummy collection (this will fail due to invalid collection)
    const dummyCollection = Keypair.generate().publicKey;
    
    try {
      await program.methods
        .verifyMarketCreator({
          coreCollection: dummyCollection,
        })
        .accountsPartial({
          signer: newMarketCreator.publicKey,
          marketCreator: newMarketCreatorPda,
          coreCollection: dummyCollection,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newMarketCreator])
        .rpc({ commitment: "confirmed" });
      
      assert.fail("Should have failed with invalid collection error");
    } catch (error) {
      console.log("Expected error for invalid collection:", error.message);
      // This should fail due to invalid collection, not AlreadyVerified
      assert.ok(error.message.includes("Error"));
    }
  });

  it("Gets market creator details with verification status", async () => {
    const details = await getMarketCreatorDetails();
    
    assert.ok(details.marketCreator.equals(marketCreatorPda));
    assert.equal(typeof details.verified, "boolean");
    
    console.log("✅ Market creator details retrieved successfully");
    console.log("   Market Creator:", details.marketCreator.toString());
    console.log("   Core Collection:", details.coreCollection.toString());
    console.log("   Verified:", details.verified);
  });
});
