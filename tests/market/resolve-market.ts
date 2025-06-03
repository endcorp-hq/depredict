import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../../target/types/shortx_contract";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShortxContract as Program<ShortxContract>;

  // Load the admin keypair (market authority)
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./keypair.json", "utf-8")))
  );

  describe("Market Resolution", () => {
    it("Resolves a market with winning direction", async () => {
      // Use an existing market ID
      const marketId = new anchor.BN(605252); // Replace with your actual market ID

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Get the initial market state
      const marketAccountBefore = await program.account.marketState.fetch(
        marketPda
      );
      console.log(
        "Market state before resolution:",
        marketAccountBefore.marketState
      );

      try {
        // Resolve the market with a "Yes" outcome
        const tx = await program.methods
          .resolveMarket({
            marketId,
            winningDirection: { yes: {} }, // Can be { yes: {} } or { no: {} }
          })
          .accounts({
            signer: admin.publicKey,
            market: marketPda,
            oraclePubkey: marketAccountBefore.oraclePubkey,
          })
          .signers([admin])
          .rpc();

        console.log("Market resolution transaction signature:", tx);

        // Fetch the updated market account
        const marketAccountAfter = await program.account.marketState.fetch(
          marketPda
        );

        // Verify the market state has been updated
        console.log(
          "Market state after resolution:",
          marketAccountAfter.marketState
        );
        console.log("Winning direction:", marketAccountAfter.winningDirection);

        // Assert the market is now resolved
        assert.ok(
          Object.keys(marketAccountAfter.marketState)[0] === "resolved",
          "Market should be in resolved state"
        );

        // Assert the winning direction is set correctly
        assert.ok(
          Object.keys(marketAccountAfter.winningDirection)[0] === "yes",
          "Winning direction should be set to yes"
        );

        // Verify the update timestamp has changed
        assert.ok(
          marketAccountAfter.updateTs.gt(marketAccountBefore.updateTs),
          "Update timestamp should be increased"
        );
      } catch (error) {
        console.error("Error resolving market:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }
    });
  });
});
