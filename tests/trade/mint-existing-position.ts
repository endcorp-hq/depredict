import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../../target/types/shortx_contract";
import { PublicKey, Keypair, Transaction, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { assert } from "chai";
import * as fs from "fs";
import { getNetworkConfig } from "../helpers";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShortxContract as Program<ShortxContract>;
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./keypair.json", "utf-8")))
  );
  const feeVault = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./fee-vault.json", "utf-8")))
  );

  const localMint = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./local_mint.json", "utf-8")))
  );

  const user = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./user.json", "utf-8")))
  );

  // Use the same admin keypair that created the market
  const marketAuthority = admin;

  before(async () => {
    // Get network configuration
    const { isDevnet, connectionUrl } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);

    // Request airdrop for admin and user if needed
    const balance = await provider.connection.getBalance(admin.publicKey);
    if (balance < 1_000_000_000) { // Less than 1 SOL
      console.log("Requesting airdrop for admin...");
      const signature = await provider.connection.requestAirdrop(admin.publicKey, 2_000_000_000); // 2 SOL
      await provider.connection.confirmTransaction(signature);
    }

    const userBalance = await provider.connection.getBalance(user.publicKey);
    if (userBalance < 1_000_000_000) {
      console.log("Requesting airdrop for user...");
      const signature = await provider.connection.requestAirdrop(user.publicKey, 2_000_000_000);
      await provider.connection.confirmTransaction(signature);
    }
  });

  describe("Trade", () => {
    it("Mints an NFT for an existing position", async () => {
      // Use the same market ID as in create-order.ts
      const marketId = new anchor.BN(605252); // Using market ID 
      
      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("Market PDA:", marketPda.toString());

      // Get the position account PDA
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      console.log("Position Account PDA:", positionAccountPda.toString());

      // Create a new keypair for the NFT mint
      const nftMintKeypair = Keypair.generate();
      
      console.log("NFT Mint:", nftMintKeypair.publicKey.toString());

      // Get the NFT metadata PDA
      const [nftMetadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
          nftMintKeypair.publicKey.toBuffer(),
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      );
      console.log("NFT Metadata PDA:", nftMetadataPda.toString());

      // Get the NFT master edition PDA
      const [nftMasterEditionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
          nftMintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      );
      console.log("NFT Master Edition PDA:", nftMasterEditionPda.toString());

      // Create the NFT token account using ATA program
      console.log("Creating NFT token account...");
      const nftTokenAccount = getAssociatedTokenAddressSync(
        nftMintKeypair.publicKey,
        user.publicKey,  // Create token account for admin since they own the position
        false, // allowOwnerOffCurve
        TOKEN_2022_PROGRAM_ID
        );
      console.log("NFT Token Account:", nftTokenAccount.toString());

      // Create the token account if it doesn't exist
      // try {
      //   await provider.connection.getAccountInfo(nftTokenAccount);
      // } catch (error) {
      //   const createAtaIx = createAssociatedTokenAccountInstruction(
      //     admin.publicKey, // payer - admin pays for the account creation
      //     nftTokenAccount, // ata
      //     admin.publicKey, // owner - admin owns the token account
      //     nftMintKeypair.publicKey, // mint
      //     TOKEN_2022_PROGRAM_ID
      //   );
        
      //   const tx = new Transaction().add(createAtaIx);
      //   await provider.sendAndConfirm(tx, [admin]);  // Admin signs for account creation
      //   console.log("Created new token account");
      // }

      // Get the position ID from the position account
      const positionAccount = await program.account.positionAccount.fetch(positionAccountPda);
      const position = positionAccount.positions.find(p => Object.keys(p.positionStatus)[0] === 'open');
      if (!position) {
        throw new Error("No open position found");
      }
      const positionId = position.positionId;
      console.log("Position ID:", positionId.toString());
      console.log("Position:", position);

      // Create metadata URI for the NFT
      const metadataUri = "https://arweave.net/your-metadata-uri"; // Replace with your actual metadata URI

      try {
        // Get the market account to access collection details
        const marketAccount = await program.account.marketState.fetch(marketPda);
        console.log("\n=== Market State Details ===");
        console.log("Market ID:", marketAccount.marketId.toString());
        console.log("Market Authority:", marketAccount.authority.toString());
        console.log("Market Authority Wallet:", marketAuthority.publicKey.toString());
        console.log("Collection Mint:", marketAccount.collectionMint?.toString());
        console.log("Collection Metadata:", marketAccount.collectionMetadata?.toString());
        console.log("Collection Master Edition:", marketAccount.collectionMasterEdition?.toString());
        console.log("Market Vault:", marketAccount.marketVault?.toString());
        console.log("=== End Market State Details ===\n");

        // Define account roles clearly
        const accounts = {
            // The position owner who is minting the NFT (using user since they own the position)
            signer: user.publicKey,  // This account will:
            // 1. Pay for the NFT creation
            // 2. Own the NFT
            
            // Market accounts
            market: marketPda,  // The market PDA that contains collection info
            marketPositionsAccount: positionAccountPda,  // The position account PDA for this market
            
            // NFT accounts
            nftMint: nftMintKeypair.publicKey,  // The new NFT mint being created
            nftTokenAccount: nftTokenAccount,  // The token account that will hold the NFT (owned by admin)
            metadataAccount: nftMetadataPda,  // The metadata account for the NFT
            masterEdition: nftMasterEditionPda,  // The master edition account for the NFT
            
            // Collection accounts
            collectionMint: marketAccount.collectionMint,
            collectionMetadata: marketAccount.collectionMetadata,
            collectionMasterEdition: marketAccount.collectionMasterEdition,
            collectionAuthority: admin.publicKey, //this will also be a signer for the minting instruction
            
            // Program accounts
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        };

        // Verify account relationships before transaction
        console.log("\n=== Verifying Account Relationships ===");
        console.log("1. Market Authority Check:");
        console.log("   Market Authority in State:", marketAccount.authority.toString());
        console.log("   Collection Authority:", accounts.collectionAuthority.toString());
        assert.ok(
            marketAccount.authority.equals(accounts.collectionAuthority),
            "Market authority must match collection authority"
        );

        console.log("\n2. Position Owner Check:");
        console.log("   Position Account Authority:", position.authority.toBase58());
        console.log("   Signer (Position Owner):", accounts.signer.toBase58());
        assert.ok(
            position.authority.equals(accounts.signer),
            "Position account authority must match signer"
        );

        console.log("\n3. Collection Accounts Check:");
        console.log("   Collection Mint:", accounts.collectionMint?.toString());
        console.log("   Collection Metadata:", accounts.collectionMetadata?.toString());
        console.log("   Collection Master Edition:", accounts.collectionMasterEdition?.toString());
        console.log("=== End Account Verification ===\n");
        
        const tx = await program.methods
          .mintPosition({
            positionId,
            metadataUri,
          })
          .accountsPartial(accounts)
          .preInstructions([
            anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 })
          ])
          .signers([user, admin, nftMintKeypair])  // Signers: market authority (position owner), NFT mint
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
            maxRetries: 3,
            preflightCommitment: "confirmed"
          });

        console.log("NFT minting transaction signature:", tx);

        // Wait for confirmation
        await provider.connection.confirmTransaction(tx);

        // Verify the position was updated to be an NFT
        const updatedPositionAccount = await program.account.positionAccount.fetch(positionAccountPda);
        console.log("Updated position account:", {
          positions: updatedPositionAccount.positions.map(p => ({
            positionId: p.positionId.toString(),
            isNft: p.isNft,
            mint: p.mint?.toString()
          }))
        });
        
        const updatedPosition = updatedPositionAccount.positions.find(p => 
          p.positionId.eq(positionId)
        );
        
        if (!updatedPosition) {
          throw new Error("Could not find updated position");
        }

        assert.ok(updatedPosition.isNft, "Position should be marked as NFT");
        assert.ok(updatedPosition.mint.equals(nftMintKeypair.publicKey), "Position should have the correct NFT mint");

        // Verify NFT collection status
        console.log("\n=== Verifying NFT Collection Status ===");
        const nftMetadata = await provider.connection.getAccountInfo(nftMetadataPda);
        if (!nftMetadata) {
          throw new Error("NFT metadata account not found");
        }

        // Get the collection details from the market
        const marketState = await program.account.marketState.fetch(marketPda);
        console.log("NFT Mint:", nftMintKeypair.publicKey.toString());
        console.log("Collection Mint:", marketState.collectionMint?.toString());
        console.log("Collection Metadata:", marketState.collectionMetadata?.toString());
        console.log("Collection Master Edition:", marketState.collectionMasterEdition?.toString());
        console.log("=== End NFT Collection Verification ===\n");

      } catch (error) {
        console.error("Error minting NFT:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }
    });
  });
});
