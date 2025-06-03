import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  METADATA_POINTER_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import * as fs from "fs";
import { getUsdcMint, MARKET_ID, METAPLEX_ID, program, provider, USER } from "../helpers";

describe("shortx-contract", () => {
  
  // Load keypairs
  // const admin = Keypair.fromSecretKey(
  //   Buffer.from(JSON.parse(fs.readFileSync("./keypair.json", "utf-8")))
  // );

  const user = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./user.json", "utf-8")))
  );

  console.log("User:", user.publicKey.toString());

  let usdcMint: PublicKey;

  before(async () => {
    const { mint } = await getUsdcMint();
    usdcMint = mint;
  });

  describe("NFT Payout", () => {
    it("Checks market resolution and processes NFT payout", async () => {


      // Get the market PDA
      const [marketPda, marketBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          MARKET_ID.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Get the position account PDA
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), MARKET_ID.toArrayLike(Buffer, "le", 8)],
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

      // Fetch position account to find NFT positions
      const positionAccount = await program.account.positionAccount.fetch(positionAccountPda);
      
      // Find NFT positions
      const nftPositions = positionAccount.positions.filter(p => 
        p.isNft && 
        p.mint && 
        Object.keys(p.positionStatus)[0] === "open"
      );

      console.log("\n=== NFT Positions Found ===");
      console.log("Number of NFT positions:", nftPositions.length);
      
      for (const position of nftPositions) {
        console.log("\nProcessing position:", {
          positionId: position.positionId.toString(),
          direction: Object.keys(position.direction)[0],
          amount: position.amount.toString(),
          mint: position.mint?.toString()
        });

        // Get the NFT token account for user
        const nftTokenAccount = getAssociatedTokenAddressSync(
            position.mint,
            user.publicKey,  // Create token account for user since they own the position
            false, // allowOwnerOffCurve
            TOKEN_2022_PROGRAM_ID
          );

        console.log("NFT Token Account:", nftTokenAccount.toString());

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



        const [nftMetadataPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            METAPLEX_ID.toBuffer(),
            position.mint.toBuffer(),
          ],
          METAPLEX_ID
        );
        console.log("NFT Metadata PDA:", nftMetadataPda.toString());

        // Verify the market vault exists
        const marketVaultInfo = await provider.connection.getAccountInfo(marketVault);
        if (!marketVaultInfo) {
          throw new Error("Market vault does not exist. Please ensure it was created during market initialization.");
        }

        // Verify the market vault is owned by the market PDA
        if (marketVaultInfo.owner.toString() !== TOKEN_PROGRAM_ID.toString()) {
          throw new Error("Market vault is not a token account");
        }

        // Log balances before payout
        const userUsdcBalanceBefore = await provider.connection.getTokenAccountBalance(userUsdcAta);
        console.log("User USDC balance before payout:", userUsdcBalanceBefore.value.uiAmount);

        // Debug checks
        console.log("\nVerifying accounts before transaction:");
        console.log("1. NFT Token Account:");
        const nftTokenAccountInfo = await provider.connection.getAccountInfo(nftTokenAccount);
        console.log("   Owner:", nftTokenAccountInfo?.owner.toString());
        console.log("   Data length:", nftTokenAccountInfo?.data.length);
        console.log("   Executable:", nftTokenAccountInfo?.executable);

        console.log("\n2. NFT Metadata Account:");
        const metadataAccountInfo = await provider.connection.getAccountInfo(nftMetadataPda);
        console.log("   Owner:", metadataAccountInfo?.owner.toString());
        console.log("   Data length:", metadataAccountInfo?.data.length);
        console.log("   Executable:", metadataAccountInfo?.executable);

        const [nftMasterEditionPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            METAPLEX_ID.toBuffer(),
            position.mint.toBuffer(),
            Buffer.from("edition"),
          ],
          METAPLEX_ID
        );

        // Add edition PDA derivation
        const [nftEditionPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            METAPLEX_ID.toBuffer(),
            position.mint.toBuffer(),
          ],
          METAPLEX_ID
        );

        console.log("NFT Master Edition PDA:", nftMasterEditionPda.toString());
        console.log("NFT Edition PDA:", nftEditionPda.toString());

        // Verify NFT ownership
        const tokenBalance = await provider.connection.getTokenAccountBalance(nftTokenAccount);
        console.log("\nNFT Token Account Balance:", tokenBalance.value.uiAmount);

        // Additional debug info
        console.log("\n=== Additional Debug Info ===");
        console.log("Market PDA Authority:", marketPda.toString());
        console.log("Market Vault Authority:", marketPda.toString());
        console.log("User Public Key:", user.publicKey.toString());
        console.log("NFT Mint:", position.mint.toString());
        console.log("Token Program ID:", TOKEN_PROGRAM_ID.toString());
        console.log("Token 2022 Program ID:", TOKEN_2022_PROGRAM_ID.toString());
        console.log("Associated Token Program ID:", ASSOCIATED_TOKEN_PROGRAM_ID.toString());
        console.log("Token Metadata Program ID:", METAPLEX_ID.toString());

        // Add token record PDA derivation
        const [tokenRecordPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            METAPLEX_ID.toBuffer(),
            position.mint.toBuffer(),
            Buffer.from("token_record"),
            nftTokenAccount.toBuffer(),
          ],
          METAPLEX_ID
        );

        console.log("Token Record PDA:", tokenRecordPda.toString());

        try {
          console.log("\n=== Executing Payout Transaction ===");
          
          // Log the instruction data we're about to send
          console.log("Payout Arguments:", {
            positionId: position.positionId.toString(),
            marketId: MARKET_ID.toString(),
            amount: position.amount.toString(),
            direction: "yes"
          });

          // Update the program call
          await program.methods
            .payoutNft({
              positionId: position.positionId,
              marketId: MARKET_ID,
              amount: position.amount,
              direction: { yes: {} },
            })
            .accountsPartial({
              signer: USER.publicKey,
              market: marketPda,
              positionAccount: positionAccountPda,
              nftMint: position.mint,
              nftTokenAccount: nftTokenAccount,
              userAta: userUsdcAta,
              marketVault: marketVault,
              mint: usdcMint,
              masterEdition: nftMasterEditionPda,
              metadataAccount: nftMetadataPda,
              tokenProgram: TOKEN_PROGRAM_ID,
              token2022Program: TOKEN_2022_PROGRAM_ID,
              tokenMetadataProgram: METAPLEX_ID,
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
      }
    });
  });
});
