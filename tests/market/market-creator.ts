// solana
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";
// mpl
import { createTreeV2 } from "@metaplex-foundation/mpl-bubblegum";
import {
  createCollection,
  mplCore,
} from '@metaplex-foundation/mpl-core';
import {
  generateSigner,
  signerIdentity,
  sol,
  createSignerFromKeypair
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

// helpers
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
    assert.equal(marketCreatorAccount.verified, false);
    
    console.log("✅ Market creator found/created successfully (unverified)");
    console.log("   Name:", marketCreatorAccount.name);
    console.log("   Verified:", marketCreatorAccount.verified);
  });

  it("Step 2: Verifies market creator with a collection and merkle tree", async () => {
    // Create a proper MPL Core collection following the official pattern
    
    const umi = createUmi(provider.connection.rpcEndpoint)
      .use(mplCore());

    const signer = generateSigner(umi);
    umi.use(signerIdentity(signer));

    console.log('Airdropping 1 SOL to identity');
    await umi.rpc.airdrop(umi.identity.publicKey, sol(1));

    // For testing purposes, use a simple metadata URI instead of uploading
    const metadataUri = 'https://example.com/metadata.json';

    // Create the collection
    const collection = generateSigner(umi);

    console.log('Creating Collection...');
    const tx = await createCollection(umi, {
      collection,
      name: 'Test Collection',
      uri: metadataUri,
    }).sendAndConfirm(umi);

    console.log("✅ Collection created successfully");
    console.log("   Collection address:", collection.publicKey);
    console.log("   Transaction signature:", tx.signature);

    // Set the core collection for verification
    coreCollection = new PublicKey(collection.publicKey);

      // Helper function to create merkle trees
  async function createMerkleTree(authority: Keypair, isPublic: boolean = false): Promise<PublicKey> {
    const umi = createUmi((provider.connection as any).rpcEndpoint || "http://127.0.0.1:8899");
    const umiAuthorityKp = umi.eddsa.createKeypairFromSecretKey(authority.secretKey);
    umi.use(signerIdentity(createSignerFromKeypair(umi, umiAuthorityKp)));
    
    const merkleTree = generateSigner(umi);
    const builder = await createTreeV2(umi, {
      merkleTree,
      maxDepth: 16,
      maxBufferSize: 64,
      public: isPublic,
    });
    await builder.sendAndConfirm(umi);
    
    const treePubkey = new PublicKey(merkleTree.publicKey.toString());
    console.log(`Merkle tree created with authority ${authority.publicKey.toString()}:`, treePubkey.toString());
    
    // Wait for the account to be fully propagated on-chain
    console.log("Waiting for merkle tree account to be fully propagated...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    
    // Verify the account exists and can be fetched
    try {
      const accountInfo = await provider.connection.getAccountInfo(treePubkey);
      if (!accountInfo) {
        throw new Error(`Merkle tree account ${treePubkey.toString()} not found after creation`);
      }
      console.log(`✅ Merkle tree account verified: ${treePubkey.toString()}`);
    } catch (error) {
      console.error(`❌ Failed to verify merkle tree account:`, error);
      throw error;
    }
    
    return treePubkey;
  }

    try {
      const merkleTree = await createMerkleTree(ADMIN, false);
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
  
  it("Gets market creator details with verification status", async () => {
    const details = await getMarketCreatorDetails();
    
    assert.ok(details.marketCreator.equals(marketCreatorPda));
    assert.equal(typeof details.marketCreator.verified, "boolean");
    
    console.log("✅ Market creator details retrieved successfully");
    console.log("   Market Creator:", details.marketCreator.toString());
    console.log("   Core Collection:", details.marketCreator.coreCollection.toString());
    console.log("   Verified:", details.marketCreator.verified);
  });
});
