
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, MARKET_ID, program } from "../helpers";

describe("shortx-contract", () => {

  describe("Market Resolution", () => {
    it("Resolves a market with winning direction", async () => {
      // Use an existing market ID

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), MARKET_ID.toArrayLike(Buffer, "le", 8)],
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
            marketId: MARKET_ID,
            winningDirection: { yes: {} }, // Can be { yes: {} } or { no: {} }
          })
          .accounts({
            signer: ADMIN.publicKey,
            market: marketPda,
            oraclePubkey: marketAccountBefore.oraclePubkey,
          })
          .signers([ADMIN])
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
