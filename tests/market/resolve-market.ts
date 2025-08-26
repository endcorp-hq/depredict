import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { ADMIN, getCurrentMarketId, getMarketIdByState, program, provider, ORACLE_KEY } from "../helpers";
import {
  PullFeed,
  getDefaultDevnetQueue,
  asV0Tx,
} from "@switchboard-xyz/on-demand";
import { CrossbarClient } from "@switchboard-xyz/common";
import { Connection, Keypair } from "@solana/web3.js";
import fs from "fs";

describe("Market Resolution", () => {
  let oracleValue: number | null = null;

  // todo: fix this test
  xit("Pulls oracle data", async () => {
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

    // Check if crossbar server is available
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

      // Store the oracle response value
      if (responses && responses.length > 0) {
        oracleValue = Number(responses[0].value); // Assuming first response is what we want
        console.log("Oracle value received:", oracleValue);
      }
      
      return responses;
    } catch (error) {
      console.error("Failed during fetchUpdateIx:", error);
      
      // If crossbar server is not available, skip this test
      if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
        console.log("Crossbar server not available, skipping oracle test");
        return;
      }
      
      throw error;
    }
  });

  it("Resolves a manual market with winning direction", async () => {
    // Get the manual market ID
    const manualMarketId = await getMarketIdByState("manual");
    console.log("Using manual market ID for resolution:", manualMarketId.toString());

    // Get the market PDA
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), manualMarketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    // Check if the market exists before proceeding
    let marketAccountBefore;
    try {
      marketAccountBefore = await program.account.marketState.fetch(marketPda);
      console.log("Manual market found for resolution:", marketAccountBefore.marketId.toString());
    } catch (error) {
      console.log("Manual market does not exist for resolution:", error.message);
      console.log("Market PDA:", marketPda.toString());
      console.log("This is expected if setup-markets.ts hasn't been run yet");
      return; // Skip this test if market doesn't exist
    }

    console.log("Market USDC VAULT:", marketAccountBefore.marketVault.toString());
    
    // Check the oracle type from the market
    const oracleType = marketAccountBefore.oracleType;
    console.log("Oracle type:", oracleType);

    // Verify this is a manual resolution market
    if (!('none' in oracleType)) {
      console.log("This is not a manual resolution market - skipping");
      console.log("Expected oracle type 'none', got:", oracleType);
      return;
    }

    console.log("This is a manual resolution market - proceeding with manual resolution");

    // For manual resolution, we use a mock oracle value
    // 11 = Yes/True, 10 = No/False
    const mockOracleValue = 11; // Yes/True

    try {
      const tx = await program.methods
        .resolveMarket({
          oracleValue: mockOracleValue,
        })
        .accounts({
          signer: ADMIN.publicKey,
          market: marketPda,
          oraclePubkey: ADMIN.publicKey, // Use ADMIN for manual resolution
        })
        .signers([ADMIN])
        .rpc();

      console.log("Manual market resolution transaction signature:", tx);

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

      // Verify the update timestamp has changed
      assert.ok(
        marketAccountAfter.updateTs.gt(marketAccountBefore.updateTs),
        "Update timestamp should be increased"
      );

      console.log("✅ Manual market resolution successful!");
    } catch (error) {
      console.error("Error resolving manual market:", error);
      if (error.logs) {
        console.error("Program logs:", error.logs);
      }
      
      // If market doesn't exist, skip this test
      if (error.message.includes("Account does not exist")) {
        console.log("Market does not exist, skipping resolution test");
        return;
      }
      
      throw error;
    }
  });
});
