import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, MARKET_ID, program, provider, ORACLE_KEY } from "../helpers";
import {
  PullFeed,
  getDefaultDevnetQueue,
  asV0Tx,
} from "@switchboard-xyz/on-demand";
import { CrossbarClient } from "@switchboard-xyz/common";
import { Connection, Keypair } from "@solana/web3.js";
import fs from "fs";

  describe("Market Resolution", () => {

    it("Pulls oracle data", async () => {

      const oracleOwner = Keypair.fromSecretKey(
        new Uint8Array(
            JSON.parse(fs.readFileSync("/Users/Andrew/.config/solana/id.json", "utf-8"))
          )
        );
      console.log("Using Payer:", oracleOwner.publicKey.toBase58(), "\n");

      const queue = await getDefaultDevnetQueue("https://api.devnet.solana.com");
      const connection = new Connection("https://api.devnet.solana.com");
      const pullFeed = new PullFeed(queue.program, ORACLE_KEY);
      const connectionEnhanced = pullFeed.program.provider.connection;

      console.log("Pull Feed:", pullFeed.pubkey.toBase58(), "\n");

      // Use the local crossbar server
      const crossbarClient = new CrossbarClient("http://localhost:8080");
      console.log("Using local crossbar server\n");

      try {
        const [pullIx, responses, _, luts] = await pullFeed.fetchUpdateIx({
          gateway: "https://switchboard-oracle.everstake.one/devnet",
          numSignatures: 3,
          crossbarClient: crossbarClient,
          chain: "solana",
          network: "devnet",
          
        }, false, oracleOwner.publicKey);

        if (!pullIx || pullIx.length === 0) {
          throw new Error("Failed to fetch update from local crossbar server.");
        }

        const tx = await asV0Tx({
          connection,
          ixs: pullIx!, // after the pullIx you can add whatever transactions you'd like
          signers: [oracleOwner],
          computeUnitPrice: 200_000,
          computeUnitLimitMultiple: 1.3,
          lookupTables: luts,
        });

        // simulate and send
        const sim = await connectionEnhanced.simulateTransaction(tx, {
          commitment: "processed",
        });
        const sig = await connectionEnhanced.sendTransaction(tx, {
          preflightCommitment: "processed",
          skipPreflight: true,
        });

        console.log("Transaction sent:", sig);
        await connectionEnhanced.confirmTransaction(sig, "processed");

        for (let simulation of responses) {
          console.log(`Feed Public Key ${simulation.value} job outputs: ${simulation.value}`);
        }
        return responses;
      
      } catch (error) {
        console.error(
          "Failed during fetchUpdateIx or transaction submission:", error
        );
      }
  });

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

      console.log("Market USDC VAULT:", marketAccountBefore.marketUsdcVault.toString());
      

      // print the oracle pubkey from the market: 
      const oraclePubkey = marketAccountBefore.oraclePubkey;
      console.log("Oracle pubkey from market:", oraclePubkey.toString());
      console.log("ORACLE_KEY passed in:", ORACLE_KEY.toString());
      console.log(
        "Are they equal?",
        oraclePubkey.toString() === ORACLE_KEY.toString() ? "YES" : "NO"
      );
      console.log(
        "Market state before resolution:",
        marketAccountBefore.marketState
      );

      try {

        console.log("Oracle account:", ORACLE_KEY);
        
        // Now resolve the market
        const tx = await program.methods
          .resolveMarket()
          .accounts({
            signer: ADMIN.publicKey, // must be market authority
            market: marketPda,  // must be market account
            oraclePubkey: ORACLE_KEY, // must be oracle account that matches market oracle
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
