import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../target/types/shortx_contract";
import { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
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

    // Request airdrop for admin if needed
    const cluster = process.env.ANCHOR_WALLET_CLUSTER || "localnet";
    let connectionUrl = cluster === "localnet" ? "http://localhost:8899" : `https://${cluster}.solana.com`;
    const connection = new Connection(connectionUrl, "confirmed");
    const balance = await connection.getBalance(admin.publicKey);
    if (balance < LAMPORTS_PER_SOL) {
      console.log("Requesting airdrop for admin...");
      const signature = await connection.requestAirdrop(admin.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, "confirmed");
    }
  });

  describe("Config", () => {
    let newAuthority: Keypair;

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
            feeVault: feeVault.publicKey,
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
            signer: admin.publicKey,
            feeVault: wrongFeeVault.publicKey,
            config: configPda,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([admin])
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
          .updateConfig(newFeeAmount, null, feeVault.publicKey)
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
          .updateConfig(initialFeeAmount, admin.publicKey, feeVault.publicKey)
          .accountsPartial({
            signer: newAuthority.publicKey,
            feeVault: feeVault.publicKey,
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
      assert.ok(configAccount.authority.equals(admin.publicKey));
      assert.ok(configAccount.feeVault.equals(feeVault.publicKey));
      assert.ok(configAccount.feeAmount.eq(initialFeeAmount));
    });
  });
});
