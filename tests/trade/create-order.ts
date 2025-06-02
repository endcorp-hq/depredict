import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../../target/types/shortx_contract";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { assert } from "chai";
import * as fs from "fs";
import { getUsdcMint, getNetworkConfig } from "../helpers";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShortxContract as Program<ShortxContract>;
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("/Users/Andrew/.config/solana/wba-wallet.json", "utf-8")))
  );
  const feeVault = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./fee-vault.json", "utf-8")))
  );

  const user = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("/Users/Andrew/.config/solana/wba-wallet.json", "utf-8")))
  );

  let usdcMint: PublicKey;
  const marketId = new anchor.BN(374517); // Using market ID 
  
  before(async () => {
    // Get network configuration
    const { isDevnet, connectionUrl } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);

    // Devnet USDC mint address
    const { mint } = await getUsdcMint();
    usdcMint = mint;

    // Get the market PDA for mint authority
    global.marketId = marketId;
    const [marketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("market"),
        marketId.toArrayLike(Buffer, "le", 8),
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
        admin, // Payer
        usdcMint,
        user.publicKey
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
      const userBalance = await provider.connection.getBalance(user.publicKey);
      const requiredBalance = 2_000_000_000; // 2 SOL for fee and rent
      if (userBalance < requiredBalance) {
        console.log("Requesting airdrop for user...");
        const signature = await provider.connection.requestAirdrop(user.publicKey, requiredBalance);
        await provider.connection.confirmTransaction(signature);
        console.log("Airdrop successful");
      }

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
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

      // Get the user trade PDA
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      console.log("Using admin wallet:", admin.publicKey.toString());
      console.log("Position account PDA:", positionAccountPda.toString());

      // Ensure position account has enough SOL for rent
      const positionRentExemptAmount = await provider.connection.getMinimumBalanceForRentExemption(
        8 + // discriminator
        1 + // bump
        32 + // authority (Pubkey)
        8 + // version (u64)
        (10 * ( // positions array of 10 Position structs
          8 + // position_id (u64)
          8 + // market_id (u64)
          8 + // amount (u64)
          1 + // direction (enum)
          8 + // created_at (i64)
          8 + // ts (i64)
          1 + // is_nft (bool)
          33 + // mint (Option<Pubkey>)
          33 + // authority (Option<Pubkey>)
          1 + // position_status (enum)
          10 + // padding [u8; 10]
          8 // version (u64)
        )) +
        8 + // market_id (u64)
        4 + // nonce (u32)
        1 // is_sub_position (bool)
      );
      console.log("Position account size:", positionRentExemptAmount, "bytes");
      console.log("Required rent-exempt amount for position account:", positionRentExemptAmount, "lamports");

      const positionAccountInfo = await provider.connection.getAccountInfo(positionAccountPda);
      console.log("Position account exists:", !!positionAccountInfo);
      if (positionAccountInfo) {
        console.log("Position account current balance:", positionAccountInfo.lamports, "lamports");
        console.log("Position account owner:", positionAccountInfo.owner.toString());
        console.log("Position account executable:", positionAccountInfo.executable);
        console.log("Position account data length:", positionAccountInfo.data.length);
      }

      if (!positionAccountInfo || positionAccountInfo.lamports < positionRentExemptAmount) {
        console.log(`Funding position account with ${positionRentExemptAmount} lamports`);
        const transferTx = new anchor.web3.Transaction().add(
          anchor.web3.SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: positionAccountPda,
            lamports: positionRentExemptAmount + 1000000 // Add extra for safety
          })
        );
        const signature = await provider.sendAndConfirm(transferTx, [admin]);
        console.log("Position account funding transaction:", signature);
        
        // Verify the funding
        const updatedPositionInfo = await provider.connection.getAccountInfo(positionAccountPda);
        console.log("Position account balance after funding:", updatedPositionInfo?.lamports, "lamports");
      }

      // Create market vault with enough rent
      console.log("Creating market vault...");
      const marketVault = (await getOrCreateAssociatedTokenAccount(
        provider.connection,
        admin, // Use admin as payer
        usdcMint, // Use devnet USDC mint
        marketPda, // Owner
        true // Allow owner off curve
      )).address;
      console.log("Created market vault:", marketVault.toString());

      // Ensure the market vault has enough SOL for rent
      const vaultRentExemptAmount = await provider.connection.getMinimumBalanceForRentExemption(165); // Size of token account
      console.log("Required rent-exempt amount for market vault:", vaultRentExemptAmount, "lamports");
      
      const marketVaultInfo = await provider.connection.getAccountInfo(marketVault);
      console.log("Market vault exists:", !!marketVaultInfo);
      if (marketVaultInfo) {
        console.log("Market vault current balance:", marketVaultInfo.lamports, "lamports");
        console.log("Market vault owner:", marketVaultInfo.owner.toString());
        console.log("Market vault executable:", marketVaultInfo.executable);
        console.log("Market vault data length:", marketVaultInfo.data.length);
      }

      if (!marketVaultInfo || marketVaultInfo.lamports < vaultRentExemptAmount) {
        console.log(`Funding market vault with ${vaultRentExemptAmount} lamports`);
        const transferTx = new anchor.web3.Transaction().add(
          anchor.web3.SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: marketVault,
            lamports: vaultRentExemptAmount + 1000000 // Add extra for safety
          })
        );
        const signature = await provider.sendAndConfirm(transferTx, [admin]);
        console.log("Market vault funding transaction:", signature);
        
        // Verify the funding
        const updatedVaultInfo = await provider.connection.getAccountInfo(marketVault);
        console.log("Market vault balance after funding:", updatedVaultInfo?.lamports, "lamports");
      }

      // Create order parameters
      const amount = new anchor.BN(100); // 100 USDC (6 decimals)
      const direction = { yes: {} }; // Betting on "Yes"

      try {
        const tx = await program.methods
          .createOrder({
            amount,
            direction,
          })
          .accountsPartial({
            signer: user.publicKey,
            feeVault: feeVault.publicKey,
            positionAccount: positionAccountPda,
            market: marketPda,
            mint: usdcMint, // Use devnet USDC mint
            userAta: (await getOrCreateAssociatedTokenAccount(
              provider.connection,
              user,
              usdcMint,
              user.publicKey
            )).address,
            marketVault: marketVault,
            config: configPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user])
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
