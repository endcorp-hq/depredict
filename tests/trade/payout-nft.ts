import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import { getCurrentMarketId, METAPLEX_ID, program, provider, USER, LOCAL_MINT } from "../helpers";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fetchAsset } from '@metaplex-foundation/mpl-core';

describe("depredict", () => {

  const user = USER;
  const usdcMint = LOCAL_MINT.publicKey;




  console.log("User:", user.publicKey.toString());

  describe("NFT Payout", () => {




    
    it("Checks market resolution and processes NFT payout", async () => {
      // Get the current market ID
      const marketId = await getCurrentMarketId();
      console.log("Using market ID for NFT payout:", marketId.toString());

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
        // Get the market vault - should be owned by market PDA
        const marketVault = getAssociatedTokenAddressSync(
          usdcMint,
          marketPda,
          true, // allowOwnerOffCurve since marketPda is a PDA
          TOKEN_PROGRAM_ID
        );

        console.log("Market Vault:", marketVault.toString());

        // Get user's USDC token account (payout goes to NFT owner)
        // Let the program create this if needed
        const userUsdcAta = getAssociatedTokenAddressSync(
          usdcMint,
          user.publicKey,
          false,
          TOKEN_PROGRAM_ID
        );
      // Get the initial market state
      let marketAccountBefore;
      try {
        marketAccountBefore = await program.account.marketState.fetch(
          marketPda
        );
        console.log("Market found for NFT payout:", marketAccountBefore.marketId.toString());
      } catch (error) {
        if (error.message.includes("Account does not exist")) {
          console.log("Market does not exist, skipping NFT payout test");
          return;
        }
        throw error;
      }

      console.log("Market USDC VAULT:", marketAccountBefore.marketVault.toString());

      // Get the position account PDA
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Fetch market state to check resolution
      let marketAccount;
      try {
        marketAccount = await program.account.marketState.fetch(marketPda);
      } catch (error) {
        if (error.message.includes("Account does not exist")) {
          console.log("Market does not exist, skipping NFT payout test");
          return;
        }
        throw error;
      }
      console.log("\n=== Market Resolution Status ===");
      console.log("Market State:", marketAccount.marketState);
      console.log("Winning Direction:", marketAccount.winningDirection);

      const collection = marketAccount.nftCollection;
      
      // Check if market is resolved
      if (Object.keys(marketAccount.marketState)[0] !== "resolved") {
        console.log("Market is not resolved yet, skipping NFT payout test");
        console.log("Market state:", marketAccount.marketState);
        return;
      }

      // Get the winning direction
      const winningDirection = Object.keys(marketAccount.winningDirection)[0];
      console.log("Winning Direction:", winningDirection);

      // Fetch position account to find NFT positions
      const positionAccount = await program.account.positionAccount.fetch(positionAccountPda);
      
      // Find NFT positions
      const nftPositions = positionAccount.positions.filter(p => 
        p.mint && 
        Object.keys(p.direction)[0] === "yes" &&
        Object.keys(p.positionStatus)[0] === "open"
      );

      console.log("\n=== NFT Positions Found ===");
      console.log("Number of NFT positions:", nftPositions.length);
      
      const position = nftPositions[0];
      if (!position) {
        throw new Error("No NFT positions found to settle.");
      }
      const umi = createUmi(provider.connection);

      // Derive the NFT PDA as you do in create-order.ts
      const [positionNftAccountPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("nft"),
          marketId.toArrayLike(Buffer, "le", 8),
          position.positionId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const asset = await fetchAsset(umi, positionNftAccountPda.toString(), {
        skipDerivePlugins: false,
      });

      console.log("NFT Asset:", asset)

      console.log("NFT Asset Owner:", asset.owner.toString());
      console.log("User Public Key:", user.publicKey.toString());
      console.log("Are they equal?", asset.owner.toString() === user.publicKey.toString() ? "YES" : "NO");

      // Assert ownership
      assert.equal(
        asset.owner.toString(),
        user.publicKey.toString(),
        "User must own the NFT asset to claim payout"
      );

      console.log("\nProcessing position:", {
        positionId: position.positionId.toString(),
        direction: Object.keys(position.direction)[0],
        amount: position.amount.toString(),
        mint: position.mint?.toString()
      });

      // Get the user's associated token account for the NFT mint
      const userNftAta = getAssociatedTokenAddressSync(
        position.mint,
        user.publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      // Log balances before payout
      const userUsdcBalanceBefore = await provider.connection.getTokenAccountBalance(userUsdcAta);
      console.log("User USDC balance before payout:", userUsdcBalanceBefore.value.uiAmount);

      // Additional debug info
      console.log("\n=== Additional Debug Info ===");
      console.log("Market PDA Authority:", marketPda.toString());
      console.log("Market Vault Authority:", marketPda.toString());
      console.log("User Public Key:", user.publicKey.toString());
      console.log("NFT Mint:", position.mint.toString());
      console.log("Token Program ID:", TOKEN_PROGRAM_ID.toString());
      console.log("Associated Token Program ID:", ASSOCIATED_TOKEN_PROGRAM_ID.toString());
      console.log("Token Metadata Program ID:", METAPLEX_ID.toString());

      try {
        console.log("\n=== Executing Payout Transaction ===");
        
        // Update the program call
        await program.methods
          .settlePosition()
          .accountsPartial({
            signer: USER.publicKey,
            market: marketPda,
            marketPositionsAccount: positionAccountPda,
            nftMint: asset.publicKey,
            userUsdcAta: userUsdcAta,
            marketVault: marketVault,
            usdcMint: usdcMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            collection: collection,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          }).signers([USER])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
            maxRetries: 3,
            preflightCommitment: "confirmed"
          });

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
        const userUsdcBalanceAfter = await provider.connection.getTokenAccountBalance(userUsdcAta);
        console.log("User USDC balance after payout:", userUsdcBalanceAfter.value.uiAmount);
        console.log("USDC balance change:", 
          userUsdcBalanceAfter.value.uiAmount! - userUsdcBalanceBefore.value.uiAmount!
        );



        console.log("NFT Asset Owner:", asset.owner.toString());
        console.log("User Public Key:", user.publicKey.toString());
        console.log("Are they equal?", asset.owner.toString() === user.publicKey.toString() ? "YES" : "NO");

        // Assert ownership
        assert.equal(
          asset.owner.toString(),
          user.publicKey.toString(),
          "User must own the NFT asset to claim payout"
        );

      } catch (error) {
        console.error("\n=== Error Details ===");
        console.error("Error processing payout for position", position.positionId.toString(), ":", error);
        if (error.logs) {
          console.error("\nProgram Logs:");
          error.logs.forEach((log: string, index: number) => {
            console.error(`${index + 1}. ${log}`);
          });
        }
        if (error.stack) {
          console.error("\nStack Trace:", error.stack);
        }
        throw error;
      }
    });
  });

});
