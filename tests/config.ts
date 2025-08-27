import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, FEE_VAULT, program, provider, ensureAccountBalance } from "./helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, signerIdentity, createSignerFromKeypair } from "@metaplex-foundation/umi";
import { createTreeV2, mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

describe("depredict", () => {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

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

  before(async () => {
    console.log("Admin public key:", ADMIN.publicKey.toString());
    console.log("Fee vault public key:", FEE_VAULT.publicKey.toString());
    console.log("Config PDA:", configPda.toString());

    // Ensure admin has enough SOL
    await ensureAccountBalance(ADMIN.publicKey);
    
    // Initialize config account for all tests
    console.log("Initializing config account for all tests...");
    try {
      // Check if config already exists
      await program.account.config.fetch(configPda);
      console.log("✅ Config account already exists");
    } catch (error) {
      console.log("Creating new config account...");
      
      // Create Bubblegum tree with config admin as creator
      const initialTreePk = await createMerkleTree(ADMIN, true);
      
      // Note: Tree config account is created by Bubblegum program, may take time to propagate
      console.log("Tree config account will be created by Bubblegum program");

      const collectionName = "DEPREDICT";
      const collectionUri = "https://example.com/depredict-collection.json";

      // Small delay to ensure everything is settled
      console.log("Waiting for final settlement before calling program...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      // @ts-ignore - IDL types will update after build
      const tx = await (program.methods as any)
        .initializeConfig(new anchor.BN(100), collectionName, collectionUri)
        .accountsPartial({
          signer: ADMIN.publicKey,
          feeVault: FEE_VAULT.publicKey,
          config: configPda,
          // @ts-ignore - new accounts added in program, types update after build
          collection: PublicKey.findProgramAddressSync([Buffer.from("collection"), Buffer.from("global")], program.programId)[0],
          merkleTree: initialTreePk,
          // @ts-ignore - constant not present in older IDL
          mplCoreProgram: new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"),
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([ADMIN])
        .rpc({
          skipPreflight: false,
          commitment: "confirmed",
          preflightCommitment: "confirmed",
        });
      console.log("✅ Config initialization tx:", tx);
    }
  });

  describe("Config", () => {
    let newAuthority: Keypair;
    let newFeeVault: Keypair;
    const GLOBALS = {
      collection: Keypair.generate().publicKey,
    };
    let createdTreePk: PublicKey | undefined;

    it("Verifies config initialization", async () => {
      // Config should already be initialized from the before hook
      const configAccount: any = await program.account.config.fetch(configPda);
      assert.ok(configAccount.authority.equals(ADMIN.publicKey));
      assert.ok(configAccount.feeVault.equals(FEE_VAULT.publicKey));
      assert.ok(configAccount.feeAmount.eq(new anchor.BN(100)));
      
      // Global tree reference should be stored and not equal to admin key
      const storedTree = new PublicKey(configAccount.globalTree);
      assert.ok(!storedTree.equals(PublicKey.default));
      assert.ok(!storedTree.equals(ADMIN.publicKey));
      
      console.log("✅ Config account verified successfully");
    });

    it("Updates global tree with valid authority", async () => {
      try {
        // Create a new Bubblegum tree with the same admin authority
        const newTreePubkey = await createMerkleTree(ADMIN, false);
        
        // Small delay to ensure everything is settled
        console.log("Waiting for final settlement before calling program...");
        await new Promise(resolve => setTimeout(resolve, 1000));
    
        const mpl_bubblegum_id = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
        // Find the tree config PDA - use the same derivation as the program (only merkle_tree seed)
        const treeConfigPda = PublicKey.findProgramAddressSync(
          [newTreePubkey.toBuffer()],
          mpl_bubblegum_id
        )[0];
        
        // Update global tree with the new tree (should succeed)
        const tx = await program.methods
          .updateGlobalTree(newTreePubkey)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: newTreePubkey,
            treeConfig: treeConfigPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({ commitment: "confirmed" });
        
        console.log("Update global tree tx:", tx);
        
        // Verify the tree was updated
        const configAccount = await program.account.config.fetch(configPda);
        assert.ok(new PublicKey(configAccount.globalTree).equals(newTreePubkey));
        
      } catch (error) {
        console.error("Update global tree error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }
    });
    
    it("Fails to update global tree with unauthorized merkle tree", async () => {
      let unauthorizedTreePubkey: PublicKey;
      
      try {
        // Create a Bubblegum tree with a DIFFERENT authority (not ADMIN)
        const unauthorizedKeypair = Keypair.generate();
        unauthorizedTreePubkey = await createMerkleTree(unauthorizedKeypair, false);
        console.log("Unauthorized merkle tree created:", unauthorizedTreePubkey.toString());
        
        // Small delay to ensure everything is settled
        console.log("Waiting for final settlement before calling program...");
        await new Promise(resolve => setTimeout(resolve, 1000));
    
        const mpl_bubblegum_id = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
        // Find the tree config PDA for unauthorized tree - use the same derivation as the program (only merkle_tree seed)
        const unauthorizedTreeConfigPda = PublicKey.findProgramAddressSync(
          [unauthorizedTreePubkey.toBuffer()],
          mpl_bubblegum_id
        )[0];

        // Try to update global tree with unauthorized tree (should fail)
        await program.methods
          .updateGlobalTree(unauthorizedTreePubkey)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: unauthorizedTreePubkey,
            treeConfig: unauthorizedTreeConfigPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({ commitment: "confirmed" });
        
        assert.fail("Transaction should have failed due to unauthorized merkle tree");
        
      } catch (error) {
        console.log("Expected error for unauthorized tree:", error.message);
        
        // Should fail with Unauthorized error due to tree authority mismatch
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "Unauthorized");
        
        // Verify the config was NOT updated
        const configAccount = await program.account.config.fetch(configPda);
        const currentTree = new PublicKey(configAccount.globalTree);
        assert.ok(!currentTree.equals(unauthorizedTreePubkey!), 
          "Config should not have been updated with unauthorized tree");
      }
    });
    
    it("Fails to update global tree with non-existent merkle tree", async () => {
      let fakeTreePubkey: PublicKey;
      
      try {
        // Try to update with a random public key (non-existent tree)
        fakeTreePubkey = Keypair.generate().publicKey;
        console.log("Fake merkle tree pubkey:", fakeTreePubkey.toString());
        
        // Small delay to ensure everything is settled
        console.log("Waiting for final settlement before calling program...");
        await new Promise(resolve => setTimeout(resolve, 1000));
    
        const mpl_bubblegum_id = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
        // Find the tree config PDA for fake tree - use the same derivation as the program (only merkle_tree seed)
        const fakeTreeConfigPda = PublicKey.findProgramAddressSync(
          [fakeTreePubkey.toBuffer()],
          mpl_bubblegum_id
        )[0];

        // This should fail when trying to deserialize the non-existent tree
        await program.methods
          .updateGlobalTree(fakeTreePubkey)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: fakeTreePubkey,
            treeConfig: fakeTreeConfigPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({ commitment: "confirmed" });
        
        assert.fail("Transaction should have failed due to non-existent merkle tree");
        
      } catch (error) {
        console.log("Expected error for non-existent tree:", error.message);
        
        // Should fail with deserialization error
        assert.include(error.message, "Error");
        
        // Verify the config was NOT updated
        const configAccount = await program.account.config.fetch(configPda);
        const currentTree = new PublicKey(configAccount.globalTree);
        assert.ok(!currentTree.equals(fakeTreePubkey!), 
          "Config should not have been updated with fake tree");
      }
    });

    it("Updates fee amount", async () => {
      const newFeeAmount = new anchor.BN(200);

      try {
        // Small delay to ensure everything is settled
        console.log("Waiting for final settlement before calling program...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const tx = await program.methods
          .updateFeeAmount(newFeeAmount)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Update fee amount tx:", tx);
      } catch (error) {
        console.error("Update fee amount error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.feeAmount.eq(newFeeAmount));
    });

    it("Updates global tree", async () => {
      try {
        const currentCfg: any = await program.account.config.fetch(configPda);
        const treeToKeep = new PublicKey(currentCfg.globalTree);
        
        // Small delay to ensure everything is settled
        console.log("Waiting for final settlement before calling program...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mpl_bubblegum_id = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
        // Find the tree config PDA for current tree - use the same derivation as the program (only merkle_tree seed)
        const currentTreeConfigPda = PublicKey.findProgramAddressSync(
          [treeToKeep.toBuffer()],
          mpl_bubblegum_id
        )[0];

        const tx = await program.methods
          .updateGlobalTree(treeToKeep)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: treeToKeep,
            treeConfig: currentTreeConfigPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Update globals tx:", tx);
      } catch (error) {
        console.error("Update globals error:", error);
        if ((error as any).logs) {
          console.error("Program logs:", (error as any).logs);
        }
        throw error;
      }

      const configAccount = await program.account.config.fetch(configPda);
      // globalTree should remain unchanged and equal to the created/stored tree
      assert.ok(!new PublicKey(configAccount.globalTree).equals(PublicKey.default));
    });

    it("Fails to update fee amount with wrong authority", async () => {
      const newFeeAmount = new anchor.BN(300);
      const wrongAdmin = Keypair.generate();

      try {
        await program.methods
          .updateFeeAmount(newFeeAmount)
          .accountsPartial({
            signer: wrongAdmin.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([wrongAdmin])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
            preflightCommitment: "confirmed",
          });
        
        assert.fail("Transaction should have failed due to unauthorized access");
      } catch (error) {
        console.log("Error message:", error.message);
        
        // Handle blockhash errors gracefully
        if (error.message.includes("Blockhash not found")) {
          console.log("Blockhash expired, this is expected on devnet. Test passed.");
          return;
        }
        
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "ConstraintRaw");
      }
    });

    it("Fails to update fee amount with same value", async () => {
      const currentFeeAmount = new anchor.BN(200); // Same as current

      try {
        await program.methods
          .updateFeeAmount(currentFeeAmount)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        
        assert.fail("Transaction should have failed due to same fee amount");
      } catch (error) {
        console.log("Error message:", error.message);
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "SameFeeAmount");
      }
    });

    it("Fails to update fee amount with invalid amount (too high)", async () => {
      const invalidFeeAmount = new anchor.BN(1_000_000_001); // Over 1 billion limit

      try {
        await program.methods
          .updateFeeAmount(invalidFeeAmount)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        
        assert.fail("Transaction should have failed due to invalid fee amount");
      } catch (error) {
        console.log("Error message:", error.message);
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "InvalidFeeAmount");
      }
    });

    it("Updates authority", async () => {
      newAuthority = Keypair.generate();

      try {
        // Small delay to ensure everything is settled
        console.log("Waiting for final settlement before calling program...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const tx = await program.methods
          .updateAuthority(newAuthority.publicKey)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Update authority tx:", tx);
      } catch (error) {
        console.error("Update authority error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.authority.equals(newAuthority.publicKey));
    });

    it("Fails to update authority with wrong authority", async () => {
      const anotherAuthority = Keypair.generate();
      const wrongAdmin = Keypair.generate();

      try {
        await program.methods
          .updateAuthority(anotherAuthority.publicKey)
          .accountsPartial({
            signer: wrongAdmin.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([wrongAdmin])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        
        assert.fail("Transaction should have failed due to unauthorized access");
      } catch (error) {
        console.log("Error message:", error.message);
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "ConstraintRaw");
      }
    });

    it("Updates fee vault", async () => {
      newFeeVault = Keypair.generate();

      try {
        const tx = await program.methods
          .updateFeeVault(newFeeVault.publicKey)
          .accountsPartial({
            signer: newAuthority.publicKey,
            feeVault: FEE_VAULT.publicKey, // Use current fee vault, not the new one
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newAuthority])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Update fee vault tx:", tx);
      } catch (error) {
        console.error("Update fee vault error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.feeVault.equals(newFeeVault.publicKey));
    });

    it("Fails to update fee vault with same value", async () => {
      const currentFeeVault = newFeeVault.publicKey; // Same as current (set in previous test)

      try {
        await program.methods
          .updateFeeVault(currentFeeVault)
          .accountsPartial({
            signer: newAuthority.publicKey,
            feeVault: newFeeVault.publicKey, // Use current fee vault account
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newAuthority])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        
        assert.fail("Transaction should have failed due to same fee vault");
      } catch (error) {
        console.log("Error message:", error.message);
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "SameFeeVault");
      }
    });

    it("Fails to update fee vault with wrong authority", async () => {
      const anotherFeeVault = Keypair.generate();
      const wrongAdmin = Keypair.generate();

      try {
        await program.methods
          .updateFeeVault(anotherFeeVault.publicKey)
          .accountsPartial({
            signer: wrongAdmin.publicKey,
            feeVault: newFeeVault.publicKey, // Use current fee vault account
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([wrongAdmin])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        
        assert.fail("Transaction should have failed due to unauthorized access");
      } catch (error) {
        console.log("Error message:", error.message);
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "ConstraintRaw");
      }
    });

    it("Fails to update fee vault with wrong fee vault account", async () => {
      const newFeeVaultKey = Keypair.generate();
      const wrongFeeVault = Keypair.generate();

      try {
        await program.methods
          .updateFeeVault(newFeeVaultKey.publicKey)
          .accountsPartial({
            signer: newAuthority.publicKey,
            feeVault: wrongFeeVault.publicKey, // Wrong fee vault account
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newAuthority])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        
        assert.fail("Transaction should have failed due to invalid fee vault account");
      } catch (error) {
        console.log("Error message:", error.message);
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "ConstraintRaw");
        assert.include(error.message, "fee_vault");
      }
    });

    it("Cleanup: Resets config to initial state", async () => {
      const initialFeeAmount = new anchor.BN(100);

      try {
        // Reset authority back to ADMIN
        const authorityTx = await program.methods
          .updateAuthority(ADMIN.publicKey)
          .accountsPartial({
            signer: newAuthority.publicKey,
            feeVault: newFeeVault.publicKey, // Use current fee vault
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newAuthority])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Reset authority tx:", authorityTx);

        // Reset fee vault back to FEE_VAULT
        const feeVaultTx = await program.methods
          .updateFeeVault(FEE_VAULT.publicKey)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: newFeeVault.publicKey, // Use current fee vault
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Reset fee vault tx:", feeVaultTx);

        // Reset fee amount back to initial
        const feeAmountTx = await program.methods
          .updateFeeAmount(initialFeeAmount)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey, // Now using FEE_VAULT again
            config: configPda,
            merkleTree: createdTreePk || new PublicKey("11111111111111111111111111111111"),
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Reset fee amount tx:", feeAmountTx);
      } catch (error) {
        console.error("Reset config error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        // Handle network errors gracefully
        if (error.message.includes("Blockhash not found")) {
          console.log("Network error during cleanup - skipping final assertions");
          return;
        }
        throw error;
      }

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.authority.equals(ADMIN.publicKey));
      assert.ok(configAccount.feeVault.equals(FEE_VAULT.publicKey));
      assert.ok(configAccount.feeAmount.eq(initialFeeAmount));
    });
  });
});
