import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { assert } from "chai";
import { getUsdcMint, getNetworkConfig, FEE_VAULT, program, provider, USER, MARKET_ID } from "../helpers";

describe("shortx-contract", () => { 

  let usdcMint: PublicKey;

  before(async () => {
    // Get network configuration
    const { isDevnet } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);

    // Devnet USDC mint address
    const { mint } = await getUsdcMint();
    usdcMint = mint;

    // Get the market PDA for mint authority
    global.MARKET_ID = MARKET_ID;
    const [marketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("market"),
        MARKET_ID.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Check market PDA balance
    const marketBalance = await provider.connection.getBalance(marketPda);
    console.log("Market PDA balance:", marketBalance, "lamports");

    // Calculate required rent-exempt amount for market state (467 bytes)
    const marketRentExempt = await provider.connection.getMinimumBalanceForRentExemption(467);
    console.log("Required rent-exempt amount for market state:", marketRentExempt, "lamports");

    // Calculate required rent-exempt amount for token account (165 bytes)
    const tokenAccountRentExempt = await provider.connection.getMinimumBalanceForRentExemption(165);
    console.log("Required rent-exempt amount for token account:", tokenAccountRentExempt, "lamports");

    // Create user's USDC token account
    const userTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        USER, // Payer
        usdcMint,
        USER.publicKey
      )
    ).address;
    console.log(
      `User USDC ATA: ${userTokenAccount.toString()}`
    );

    // Note: You'll need to get USDC from the faucet: https://spl-token-faucet.com/?token-name=USDC
    if (isDevnet) {
      console.log("Please ensure you have USDC in your wallet from the faucet");
    }
  });

  describe("Trade", () => {
    it("Creates an order in an existing market", async () => {

      // Ensure user has enough SOL for fee and rent
      const userBalance = await provider.connection.getBalance(USER.publicKey);
      const requiredBalance = 2_000_000_000; // 2 SOL for fee and rent
      if (userBalance < requiredBalance) {
        console.log("Requesting airdrop for user...");
        const signature = await provider.connection.requestAirdrop(USER.publicKey, requiredBalance);
        await provider.connection.confirmTransaction(signature);
        console.log("Airdrop successful");
      }

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          MARKET_ID.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Get the market account to verify it exists
      const marketAccount = await program.account.marketState.fetch(marketPda);
      console.log("Market Account:", marketAccount);

      // Get the config PDA
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      // Get the position account PDA
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), MARKET_ID.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      console.log("Position account PDA:", positionAccountPda.toString());

      // Create order parameters
      const amount = new anchor.BN(100); // 100 USDC (6 decimals)
      const direction = { yes: {} }; // Betting on "Yes"

      const marketVault = (await getOrCreateAssociatedTokenAccount(
        provider.connection,
        USER,
        usdcMint,
        marketPda,
        true
      )).address;

      try {
        const tx = await program.methods
          .createPosition({
            amount,
            direction,
          })
          .accountsPartial({
            signer: USER.publicKey,
            feeVault: FEE_VAULT.publicKey,
            marketPositionsAccount: positionAccountPda,
            market: marketPda,
            usdcMint: usdcMint, // Use devnet USDC mint
            userUsdcAta: (await getOrCreateAssociatedTokenAccount(
              provider.connection,
              USER,
              usdcMint,
              USER.publicKey
            )).address,
            marketUsdcVault: marketVault,
            config: configPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([USER])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
            maxRetries: 3,
            preflightCommitment: "confirmed"
          });

        console.log("Order creation transaction signature:", tx);

        // Fetch the market account to verify the order was created
        const marketAccount = await program.account.marketState.fetch(marketPda);
        console.log("Market Account after order:", marketAccount);

        // Verify the market volume increased
        assert.ok(marketAccount.volume.gt(new anchor.BN(0)), "Market volume should be greater than 0");

        // Verify the yes liquidity increased (since we placed a "Yes" order)
        assert.ok(marketAccount.yesLiquidity.gt(new anchor.BN(0)), "Yes liquidity should be greater than 0");

      } catch (error) {
        console.error("Error creating order:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }
    });
  });
});
