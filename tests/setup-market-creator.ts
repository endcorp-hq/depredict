import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, program, provider, createMarketCreator } from "./helpers";

describe("Market Creator Setup", () => {
  let marketCreatorPda: PublicKey;
  let coreCollection: PublicKey;
  let collectionAuthority: PublicKey;

  it("Creates market creator account for testing", async () => {
    // TODO: IMPLEMENT PROPER MPL CORE COLLECTION CREATION IN TEST SETUP
    // Current test setup uses placeholder collection addresses that will fail in the program
    // 
    // REQUIRED IMPLEMENTATION:
    // 1. Fix MPL Core dependency compatibility issues
    // 2. Use the program's create_mpl_core_collection instruction to create real collections
    // 3. Ensure collections have BubblegumV2 plugin enabled for cNFT support
    // 4. Handle proper collection metadata and authority setup
    // 5. Validate that collections are created correctly before creating market creator
    //
    // REFERENCE: https://developers.metaplex.com/core/collections
    // REFERENCE: https://docs.rs/mpl-core/0.10.1/mpl_core/struct.BubblegumV2Plugin.html
    
    console.log("Setting up Market Creator account for all tests...");
    
    // Create the market creator account PDA
    [marketCreatorPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market_creator"), ADMIN.publicKey.toBytes()],
      program.programId
    );

    // Create a real MPL Core collection with BubblegumV2 plugin
    console.log("Creating MPL Core collection...");
    const marketCreatorDetails = await createMarketCreator(ADMIN, "Test Market Creator");
    coreCollection = marketCreatorDetails.coreCollection;
    collectionAuthority = marketCreatorDetails.collectionAuthority;

    console.log(`Market Creator PDA: ${marketCreatorPda.toString()}`);
    console.log(`Core Collection: ${coreCollection.toString()}`);
    console.log(`Collection Authority: ${collectionAuthority.toString()}`);

    // Try to create the market creator account
    try {
      await program.methods
        .createMarketCreator({
          name: "Test Market Creator",
          coreCollection,
          collectionAuthority,
        })
        .accountsPartial({
          signer: ADMIN.publicKey,
          config: await getConfigPda(),
          coreCollectionMint: coreCollection,
          coreCollectionAsset: coreCollection,
          marketCreator: marketCreatorPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([ADMIN])
        .rpc({ commitment: "confirmed" });

      console.log("✅ Market creator account created successfully");
    } catch (error) {
      if (error.toString().includes("already in use") || 
          error.toString().includes("already initialized")) {
        console.log("✅ Market creator account already exists");
        
        // If account exists but has old collection, we need to update it
        const existingAccount = await program.account.marketCreator.fetch(marketCreatorPda);
        if (existingAccount.coreCollection.toString() === "11111111111111111111111111111112") {
          console.log("⚠️  Updating existing account with new collection...");
          // TODO: Add update instruction if available, or recreate the account
        }
      } else {
        console.error("❌ Failed to create market creator:", error);
        throw error;
      }
    }

    // Verify the account exists
    try {
      const marketCreatorAccount = await program.account.marketCreator.fetch(marketCreatorPda);
      console.log("✅ Market creator account verified");
      console.log(`   Authority: ${marketCreatorAccount.authority.toString()}`);
      console.log(`   Core Collection: ${marketCreatorAccount.coreCollection.toString()}`);
      console.log(`   Collection Authority: ${marketCreatorAccount.collectionAuthority.toString()}`);
      console.log(`   Name: ${marketCreatorAccount.name}`);
      console.log(`   Num Markets: ${marketCreatorAccount.numMarkets}`);
      console.log(`   Is Active: ${marketCreatorAccount.isActive}`);
    } catch (error) {
      console.error("❌ Failed to fetch market creator account:", error);
      throw error;
    }
  });
});

// Helper function to get config PDA
async function getConfigPda(): Promise<PublicKey> {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  return configPda;
}
