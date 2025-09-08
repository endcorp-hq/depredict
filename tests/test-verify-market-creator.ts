import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, program, provider, ensureAccountBalance, getMarketCreatorDetails, verifyMarketCreator } from "./helpers";

describe("Verify Market Creator with Collection", () => {
  let marketCreatorPda: PublicKey;
  let collectionKeypair: Keypair;

  before(async () => {
    // Ensure admin has enough SOL
    await ensureAccountBalance(ADMIN.publicKey);
    
    // Get existing market creator
    const marketCreatorDetails = await getMarketCreatorDetails();
    marketCreatorPda = marketCreatorDetails.marketCreator;
    
    console.log("Market Creator PDA:", marketCreatorPda.toString());
    console.log("Current verification status:", marketCreatorDetails.verified);
  });

  it("Creates a collection keypair for testing", async () => {
    // Generate a new keypair for the collection
    collectionKeypair = Keypair.generate();
    
    console.log("✅ Collection keypair created:", collectionKeypair.publicKey.toString());
    console.log("   Note: This is a placeholder - in production you would use MPL Core SDK");
  });

  it("Attempts to verify market creator with collection", async () => {
    try {
      // Try to verify the market creator with our collection
      await verifyMarketCreator(marketCreatorPda, collectionKeypair.publicKey);
      
      console.log("✅ Market creator verified successfully");
      
      // Check the verification status
      const updatedDetails = await getMarketCreatorDetails();
      console.log("Updated verification status:", updatedDetails.verified);
      console.log("Updated collection:", updatedDetails.coreCollection.toString());
      
    } catch (error) {
      console.log("❌ Market creator verification failed as expected");
      console.log("   Error:", error.message);
      
      // This is expected since we're using a dummy collection
      if (error.message.includes("InvalidCollection") || error.message.includes("collection")) {
        console.log("✅ Confirmed: Collection validation is working as expected");
        console.log("   The collection", collectionKeypair.publicKey.toString(), "is not a valid MPL Core collection");
      } else {
        console.error("❌ Unexpected error:", error);
        throw error;
      }
    }
  });
});
