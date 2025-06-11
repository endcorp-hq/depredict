import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../target/types/shortx_contract";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, FEE_VAULT } from "./helpers";

describe("close-config", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShortxContract as Program<ShortxContract>;
  const admin = ADMIN;
  const feeVault = FEE_VAULT;

  it("Closes the config account", async () => {
    // Get the config PDA
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    // Close the config account
    const tx = await program.methods
      .closeConfig()
      .accountsPartial({
        signer: admin.publicKey,
        config: configPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    console.log("Close config transaction signature:", tx);

    // Verify config account is closed
    const configAccountInfo = await provider.connection.getAccountInfo(configPda);
    assert.isNull(configAccountInfo, "Config account should be closed");
  });
});
