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
import { ADMIN, FEE_VAULT, getUsdcMint, MARKET_ID, USER } from "../helpers";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShortxContract as Program<ShortxContract>;
  
  // Load keypairs
  const admin = ADMIN;
  const feeVault = FEE_VAULT;
  const user = USER;

  let usdcMint: PublicKey;

  before(async () => {
    const { mint } = await getUsdcMint();
    usdcMint = mint;
  });

  describe("Order Payout", () => {
    it("Processes payout for a winning position", async () => {
      // Use the market ID where you have open positions
      const marketId = MARKET_ID; // Replace with your actual market ID
      const feeVault = FEE_VAULT;

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Get the position account PDA
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      // Fetch market state to check resolution
      const marketAccount = await program.account.marketState.fetch(marketPda);
      console.log("\n=== Market Resolution Status ===");
      console.log("Market State:", marketAccount.marketState);
      console.log("Winning Direction:", marketAccount.winningDirection);
      
      // Verify market is resolved
      assert.ok(
        Object.keys(marketAccount.marketState)[0] === "resolved",
        "Market must be resolved before payout"
      );

      // Get the winning direction
      const winningDirection = Object.keys(marketAccount.winningDirection)[0];
      console.log("Winning Direction:", winningDirection);

      // Fetch position account to find open positions
      const positionAccount = await program.account.positionAccount.fetch(positionAccountPda);
      
      // Find open positions
      const openPositions = positionAccount.positions.filter(p => 
        !p.isNft && 
        Object.keys(p.positionStatus)[0] === "open"
      );

      console.log("\n=== Open Positions Found ===");
      console.log("Number of open positions:", openPositions.length);
      
      for (const position of openPositions) {
        console.log("\nProcessing position:", {
          positionId: position.positionId.toString(),
          direction: Object.keys(position.direction)[0],
          amount: position.amount.toString()
        });

        // Get the market vault
        const marketVault = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          user, // payer
          usdcMint,
          marketPda,
          true // allowOwnerOffCurve
        );

        // Get user's USDC token account
        const userUsdcAta = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          user,
          usdcMint,
          user.publicKey
        );

        // Log balances before payout
        const userUsdcBalanceBefore = await provider.connection.getTokenAccountBalance(userUsdcAta.address);
        console.log("User USDC balance before payout:", userUsdcBalanceBefore.value.uiAmount);

        try {
          const tx = await program.methods
            .settlePosition(new anchor.BN(2))
            .accountsPartial({
              signer: user.publicKey,
              market: marketPda,
              marketPositionsAccount: positionAccountPda,
              userUsdcAta: userUsdcAta.address,
              marketUsdcVault: marketVault.address,
              feeVault: feeVault.publicKey,
              config: configPda,
              usdcMint: usdcMint,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([user])
            .rpc();

          console.log("Payout transaction signature:", tx);

          // Verify position status after payout
          const updatedPositionAccount = await program.account.positionAccount.fetch(positionAccountPda);
          const updatedPosition = updatedPositionAccount.positions.find(p => 
            p.positionId.eq(position.positionId)
          );

          assert.ok(
            Object.keys(updatedPosition!.positionStatus)[0] === "closed",
            "Position should be marked as closed after payout"
          );

          // Check USDC balance change
          const userUsdcBalanceAfter = await provider.connection.getTokenAccountBalance(userUsdcAta.address);
          console.log("User USDC balance after payout:", userUsdcBalanceAfter.value.uiAmount);
          console.log("USDC balance change:", 
            userUsdcBalanceAfter.value.uiAmount! - userUsdcBalanceBefore.value.uiAmount!
          );

        } catch (error) {
          console.error("Error processing payout for position", position.positionId.toString(), ":", error);
          if (error.logs) {
            console.error("Program logs:", error.logs);
          }
          throw error;
        }
      }
    });
  });
});
