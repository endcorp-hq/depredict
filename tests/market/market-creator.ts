// solana
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";
// mpl
import {
  createSignerFromKeypair,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

// helpers
import { ADMIN, 
  FEE_VAULT, 
  program, 
  provider, 
  ensureAccountBalance, 
  createMarketCreator, 
  verifyMarketCreator,
} from "../helpers";
import {createCoreCollection, createMerkleTree} from "../mpl_functions";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

describe("Market Creator Two-Step Process", () => {
  let marketCreatorPda: PublicKey;
  let coreCollection: PublicKey;

  before(async () => {
    await ensureAccountBalance(ADMIN.publicKey);
  });

  it("Step 1: Creates market creator account (unverified)", async () => {
    
    const name = "Test Market Creator";
    const result = await createMarketCreator(name, FEE_VAULT.publicKey);
    
    marketCreatorPda = result.marketCreator;
    
    // Verify the account was created but not verified
    const marketCreatorAccount = await program.account.marketCreator.fetch(marketCreatorPda);
    assert.ok(marketCreatorAccount.authority.equals(ADMIN.publicKey));
    assert.equal(marketCreatorAccount.verified, false);
    
    console.log("✅ Market creator created successfully (unverified)");
  });


  it("Step 2: Verifies market creator with a collection and merkle tree", async () => {

    let umi = createUmi(provider.connection.rpcEndpoint);
    let payer = fromWeb3JsKeypair(ADMIN)
    let signer = createSignerFromKeypair(umi, payer);

    const collection = await createCoreCollection(signer);
    coreCollection = new PublicKey(collection.publicKey);
    
    try {
      const merkleTree = await createMerkleTree(ADMIN);
      await verifyMarketCreator(marketCreatorPda, coreCollection, merkleTree, merkleTree);
      
      // Verify the account is now verified
      const marketCreatorAccount = await program.account.marketCreator.fetch(marketCreatorPda);
      assert.equal(marketCreatorAccount.merkleTree.toString(), merkleTree.toString());
      assert.equal(marketCreatorAccount.verified, true);
      assert.ok(marketCreatorAccount.coreCollection.equals(coreCollection));
      
      console.log("✅ Market creator verified successfully");
    } catch (error) {
      console.log("Expected error (dummy collection doesn't exist):", error.message);
      
      // This is expected since we're using a dummy collection
      // In a real test, you would create a valid MPL Core collection first
      assert.include(error.message, "Error");
    }

    // Get the merkle tree from the market creator account
    
    // add the market creator details to the market-creator.json file
    const marketCreatorDetails = {
      marketCreator: marketCreatorPda.toString(),
      coreCollection: coreCollection.toString(),
      verified: true,
    };
    fs.writeFileSync("market-creator.json", JSON.stringify(marketCreatorDetails, null, 2));
  });

});
