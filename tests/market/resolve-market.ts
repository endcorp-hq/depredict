import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, MARKET_ID, program, provider } from "../helpers";
import { PullFeed, asV0Tx } from "@switchboard-xyz/on-demand";
import { CrossbarClient } from "@switchboard-xyz/common";

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

      // print the oracle pubkey from the market: 
      const oraclePubkey = marketAccountBefore.oraclePubkey;
      console.log("Oracle pubkey:", oraclePubkey.toString());
      console.log(
        "Market state before resolution:",
        marketAccountBefore.marketState
      );

      try {

        // Initialize the pull feed
        const pullFeed = new PullFeed(
          program.provider as any,
          oraclePubkey
        );

        console.log("Pulling oracle data...");
        // Fetch and submit the oracle update
        const [pullIx, responses, _, luts] = await pullFeed.fetchUpdateIx({
          gateway: "https://api.switchboard.xyz/api",
          chain: "solana",
          network: "devnet",
        });

        if (!pullIx) {
          throw new Error("Failed to get pull instruction");
        }

        // Send the oracle update transaction
        const updateTx = await asV0Tx({
          connection: provider.connection,
          ixs: pullIx!,
          signers: [ADMIN],
          computeUnitPrice: 200_000,
          computeUnitLimitMultiple: 1.3,
          lookupTables: luts,
        });

        const sig = await provider.connection.sendTransaction(updateTx, {
          skipPreflight: true,
          maxRetries: 3,
        });
        console.log("Oracle update transaction:", sig);

        // Wait a bit for the oracle update to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Now resolve the market
        const tx = await program.methods
          .resolveMarket({
            marketId: MARKET_ID,
            winningDirection: { yes: {} }, // Can be { yes: {} } or { no: {} }
          })
          .accounts({
            signer: ADMIN.publicKey,
            market: marketPda,
            oraclePubkey: oraclePubkey,
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
