import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import { getUsdcMint, admin, program, user, marketId } from "../helpers";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  let usdcMint: PublicKey;

  before(async () => {
    const { mint } = await getUsdcMint();
    usdcMint = mint;
  });

  describe("NFT Payout", () => {
    it("Checks market resolution and processes NFT payout", async () => {

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

        // Get the NFT token account for admin (since admin owns the NFT)
        const nftTokenAccount = getAssociatedTokenAddressSync(
            position.mint,
            admin.publicKey,  // Create token account for admin since they own the position
            true, // allowOwnerOffCurve
            TOKEN_2022_PROGRAM_ID
          );

        console.log("NFT Token Account:", nftTokenAccount.toString());

        // Get the market vault
        const marketVault = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          admin, // payer
          usdcMint,
          marketPda,
          true // allowOwnerOffCurve
        );

        console.log("Market Vault:", marketVault.address.toString());

        // Get admin's USDC token account (payout goes to NFT owner)
        const adminUsdcAta = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          admin,
          usdcMint,
          admin.publicKey
        );

        console.log("Admin USDC Token Account:", adminUsdcAta.address.toString());

        const [nftMetadataPda] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("metadata"),
              new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
              position.mint.toBuffer(),
            ],
            new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
          );
          console.log("NFT Metadata PDA:", nftMetadataPda.toString());

        // Log balances before payout
        const adminUsdcBalanceBefore = await provider.connection.getTokenAccountBalance(adminUsdcAta.address);
        console.log("Admin USDC balance before payout:", adminUsdcBalanceBefore.value.uiAmount);

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

        console.log("\n3. Master Edition Account:");
        const masterEditionInfo = await provider.connection.getAccountInfo(marketAccount.collectionMasterEdition);
        console.log("   Owner:", masterEditionInfo?.owner.toString());
        console.log("   Data length:", masterEditionInfo?.data.length);
        console.log("   Executable:", masterEditionInfo?.executable);

        // Verify NFT ownership
        const tokenBalance = await provider.connection.getTokenAccountBalance(nftTokenAccount);
        console.log("\nNFT Token Account Balance:", tokenBalance.value.uiAmount);

        try {
          const tx = await program.methods
            .payoutNft({
              positionId: position.positionId,
              marketId: marketId,
              amount: position.amount,
              direction: { yes: {} },
            })
            .accountsPartial({
              signer: admin.publicKey,
              market: marketPda,
              positionAccount: positionAccountPda,
              nftMint: position.mint,
              nftTokenAccount: nftTokenAccount,
              userAta: adminUsdcAta.address,
              marketVault: marketVault.address,
              mint: usdcMint,
              masterEdition: marketAccount.collectionMasterEdition,
              collectionMetadataAccount: marketAccount.collectionMetadata,
              metadataAccount: nftMetadataPda,
              tokenProgram: TOKEN_PROGRAM_ID,
              tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([admin])
            .rpc({
              skipPreflight: true  // Add this to get more detailed error messages
            });

          console.log("Payout transaction signature:", tx);

          // Verify position status after payout
          const updatedPositionAccount = await program.account.positionAccount.fetch(positionAccountPda);
          const updatedPosition = updatedPositionAccount.positions.find(p => 
            p.positionId.eq(position.positionId)
          );

          assert.ok(
            Object.keys(updatedPosition!.positionStatus)[0] === "settled",
            "Position should be marked as settled after payout"
          );

          // Check USDC balance change
          const adminUsdcBalanceAfter = await provider.connection.getTokenAccountBalance(adminUsdcAta.address);
          console.log("Admin USDC balance after payout:", adminUsdcBalanceAfter.value.uiAmount);
          console.log("USDC balance change:", 
            adminUsdcBalanceAfter.value.uiAmount! - adminUsdcBalanceBefore.value.uiAmount!
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
