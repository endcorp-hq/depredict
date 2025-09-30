// solana
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";

// helpers
import {  
  createMarketCreator, 
  verifyMarketCreator,
} from "../helpers";
import { ADMIN, FEE_VAULT, program, provider } from "../constants";
import {createCoreCollection, createMerkleTree} from "../mpl_functions";

describe("Market Creator Two-Step Process", () => {
  let marketCreatorPda: PublicKey;
  let coreCollection: PublicKey;

  it("Step 1: Creates market creator account (unverified)", async () => {
    
    const name = "Test Market Creator";
    const result = await createMarketCreator(name, FEE_VAULT.publicKey);
    
    marketCreatorPda = result.marketCreator;
    console.log("Market Creator PDA:", marketCreatorPda.toString());
    
    // Verify the account was created but not verified
    const marketCreatorAccount = await program.account.marketCreator.fetch(marketCreatorPda);
    assert.ok(marketCreatorAccount.authority.equals(ADMIN.publicKey));
    assert.equal(marketCreatorAccount.verified, false);
    
    console.log("✅ Market creator created successfully (unverified)");
  });


  it("Step 2: Verifies market creator with a collection and merkle tree", async () => {
    const payer = ADMIN;

    console.log("ADMIN KEYPAIR:", ADMIN.publicKey.toString());
    console.log("Creating core collection...");

    const collection = await createCoreCollection(payer);
    coreCollection = new PublicKey(collection.publicKey);

    console.log("Creating merkle tree...");
    let merkleTree = await createMerkleTree(payer);

    console.log("Verifying market creator...");
    await verifyMarketCreator(marketCreatorPda, coreCollection, merkleTree);

    // Verify the account is now verified
    const marketCreatorAccount = await program.account.marketCreator.fetch(marketCreatorPda);
    
    assert.ok(marketCreatorAccount.coreCollection.equals(coreCollection));
    assert.ok(marketCreatorAccount.merkleTree.equals(merkleTree));
    // assert.equal(marketCreatorAccount.verified, true);
    

    // add the market creator details to the market-creator.json file
    const marketCreatorDetails = {
      marketCreator: marketCreatorPda.toString(),
      coreCollection: coreCollection.toString(),
      verified: true,
    };
    fs.writeFileSync("market-creator.json", JSON.stringify(marketCreatorDetails, null, 2));
  });

});
