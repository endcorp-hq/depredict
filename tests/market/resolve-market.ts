import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { admin, marketId, program } from "../helpers";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);



  describe("Market Resolution", () => {
    it("Resolves a market with winning direction", async () => {
      // Use an existing market ID

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Get the initial market state
      const marketAccountBefore = await program.account.marketState.fetch(marketPda);
      console.log("Market state before resolution:", marketAccountBefore.marketState);

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
        const marketAccountAfter = await program.account.marketState.fetch(marketPda);
        
        // Verify the market state has been updated
        console.log("Market state after resolution:", marketAccountAfter.marketState);
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

    it("Fails to resolve an already resolved market", async () => {

      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        // Attempt to resolve the market again
        await program.methods
          .resolveMarket({
            marketId,
            winningDirection: { no: {} },
          })
          .accounts({
            signer: admin.publicKey,
            market: marketPda,
            oraclePubkey: PublicKey.default, // Using default since oracle check is skipped
          })
          .signers([admin])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        // Verify it's the correct error
        assert.include(
          error.message,
          "MarketAlreadyResolved",
          "Should fail with MarketAlreadyResolved error"
        );
      }
    });

    it("Fails when non-authority tries to resolve market", async () => {  
      const nonAuthority = Keypair.generate();

      // Airdrop some SOL to non-authority for transaction fee
      const signature = await provider.connection.requestAirdrop(
        nonAuthority.publicKey,
        1000000000 // 1 SOL
      );
      await provider.connection.confirmTransaction(signature);

      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .resolveMarket({
            marketId,
            winningDirection: { yes: {} },
          })
          .accounts({
            signer: nonAuthority.publicKey,
            market: marketPda,
            oraclePubkey: PublicKey.default,
          })
          .signers([nonAuthority])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(
          error.message,
          "Unauthorized",
          "Should fail with Unauthorized error"
        );
      }
    });
  });
});
