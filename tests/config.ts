import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, FEE_VAULT, program, ensureAccountBalance } from "./helpers";

describe("depredict", () => {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  before(async () => {
    console.log("Admin public key:", ADMIN.publicKey.toString());
    console.log("Fee vault public key:", FEE_VAULT.publicKey.toString());
    console.log("Config PDA:", configPda.toString());

    // Ensure admin has enough SOL
    await ensureAccountBalance(ADMIN.publicKey);
  });

  describe("Config", () => {
    let newAuthority: Keypair;

    it("Initializes config", async () => {
      const feeAmount = new anchor.BN(100);

      try {
        const tx = await program.methods
          .initializeConfig(feeAmount)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Initialize config tx:", tx);
      } catch (error) {
        console.error("Initialize config error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.authority.equals(ADMIN.publicKey));
      assert.ok(configAccount.feeVault.equals(FEE_VAULT.publicKey));
      assert.ok(configAccount.feeAmount.eq(feeAmount));
    });

    it("Updates config", async () => {
      const newFeeAmount = new anchor.BN(200);

      try {
        const tx = await program.methods
          .updateConfig(newFeeAmount, null, null)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Update config tx:", tx);
      } catch (error) {
        console.error("Update config error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.feeAmount.eq(newFeeAmount));
    });

    it("Fails to update config with wrong authority", async () => {
      const newFeeAmount = new anchor.BN(200);
      const wrongAdmin = Keypair.generate();

      try {
        await program.methods
          .updateConfig(newFeeAmount, null, null)
          .accountsPartial({
            signer: wrongAdmin.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
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

    it("Fails to update config with wrong fee vault", async () => {
      const newFeeAmount = new anchor.BN(300);
      const wrongFeeVault = Keypair.generate();

      try {
        await program.methods
          .updateConfig(newFeeAmount, null, wrongFeeVault.publicKey)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: wrongFeeVault.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        
        assert.fail("Transaction should have failed due to invalid fee vault");
      } catch (error) {
        console.log("Error message:", error.message);
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "ConstraintRaw");
        assert.include(error.message, "fee_vault");
      }
    });

    it("Successfully updates config with correct fee vault", async () => {
      const newFeeAmount = new anchor.BN(400);

      try {
        const tx = await program.methods
          .updateConfig(newFeeAmount, null, FEE_VAULT.publicKey)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Update config with correct fee vault tx:", tx);
      } catch (error) {
        console.error("Update config error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.feeAmount.eq(newFeeAmount));
    });

    it("Updates config authority", async () => {
      newAuthority = Keypair.generate();

      try {
        const tx = await program.methods
          .updateConfig(null, newAuthority.publicKey, null)
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Update config authority tx:", tx);
      } catch (error) {
        console.error("Update config authority error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.authority.equals(newAuthority.publicKey));
    });

    it("Cleanup: Resets config to initial state", async () => {
      const initialFeeAmount = new anchor.BN(100);

      try {
        const tx = await program.methods
          .updateConfig(initialFeeAmount, ADMIN.publicKey, FEE_VAULT.publicKey)
          .accountsPartial({
            signer: newAuthority.publicKey,
            feeVault: FEE_VAULT.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([newAuthority])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
          });
        console.log("Reset config tx:", tx);
      } catch (error) {
        console.error("Reset config error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
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
