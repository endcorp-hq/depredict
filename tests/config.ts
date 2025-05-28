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

      await program.methods
        .initializeConfig(feeAmount)
        .accountsPartial({
          signer: admin.publicKey,
          feeVault: feeVault.publicKey,
          config: configPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc({
          skipPreflight: true,
          commitment: "confirmed",
        });

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.authority.equals(admin.publicKey));
      assert.ok(configAccount.feeVault.equals(feeVault.publicKey));
      assert.ok(configAccount.feeAmount.eq(feeAmount));
    });

    it("Updates config", async () => {
      const newFeeAmount = new anchor.BN(200);

      await program.methods
        .updateConfig(newFeeAmount, null, null)
        .accountsPartial({
          signer: admin.publicKey,
          feeVault: feeVault.publicKey,
          config: configPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc(
          {
            skipPreflight: true,
            commitment: "confirmed",
          }
        );

      const configAccount = await program.account.config.fetch(configPda);
      assert.ok(configAccount.feeAmount.eq(newFeeAmount));
    });
  });
});
