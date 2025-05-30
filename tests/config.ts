import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../target/types/shortx_contract";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShortxContract as Program<ShortxContract>;
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./keypair.json", "utf-8")))
  );
  const feeVault = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./fee-vault.json", "utf-8")))
  );

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  before(async () => {
    console.log("Admin public key:", admin.publicKey.toString());
    console.log("Fee vault public key:", feeVault.publicKey.toString());
    console.log("Config PDA:", configPda.toString());
  });

  describe("Config", () => {
    it("Initializes config", async () => {
      const feeAmount = new anchor.BN(100);

      try {
        const tx = await program.methods
          .initializeConfig(feeAmount)
          .accountsPartial({
            signer: admin.publicKey,
            feeVault: feeVault.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([admin])
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
      assert.ok(configAccount.authority.equals(admin.publicKey));
      assert.ok(configAccount.feeVault.equals(feeVault.publicKey));
      assert.ok(configAccount.feeAmount.eq(feeAmount));
    });

    it("Updates config", async () => {
      const newFeeAmount = new anchor.BN(200);

      try {
        const tx = await program.methods
          .updateConfig(newFeeAmount, null, null)
          .accountsPartial({
            signer: admin.publicKey,
            feeVault: feeVault.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([admin])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
            preflightCommitment: "confirmed",
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

    it("Tried to update config with wrong authority", async () => {
      const newFeeAmount = new anchor.BN(200);
      const wrongAdmin = Keypair.generate();

      try {
        await program.methods
          .updateConfig(newFeeAmount, null, null)
          .accountsPartial({
            signer: wrongAdmin.publicKey,
            feeVault: feeVault.publicKey,
            config: configPda,
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
        // Log the full error details for debugging
        console.log("Full error:", error);
        console.log("Error message:", error.message);
        if (error.logs) {
          console.log("Program logs:", error.logs);
        }

        // Check for Anchor error format
        assert.include(error.message, "AnchorError");
        assert.include(error.message, "config");
        
        // Verify the program logs contain the expected error message
        if (error.logs) {
          const logsString = error.logs.join(" ");
          assert.include(logsString, "Error");
        }
      }

      // Verify the config hasn't changed
      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.feeAmount.eq(newFeeAmount));
    });
  });
});
