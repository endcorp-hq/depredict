import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../../target/types/shortx_contract";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
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
      const marketId = new anchor.BN(579963);
      
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

      const [nftTokenAccountAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("token"),
          new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(),
          nftMintKeypair.publicKey.toBuffer(),
          user.publicKey.toBuffer(),
        ],
        new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      );
      console.log("NFT Token Account address:", nftTokenAccountAddress.toString());

      // Get the position ID from the position account
      const positionAccount = await program.account.positionAccount.fetch(positionAccountPda);
      const position = positionAccount.positions.find(p => Object.keys(p.positionStatus)[0] === 'open');
      if (!position) {
        throw new Error("No open position found");
      }
      const positionId = position.positionId;
      console.log("Position ID:", positionId.toString());

      // Create metadata URI for the NFT
      const metadataUri = "https://arweave.net/your-metadata-uri"; // Replace with your actual metadata URI

      try {
        const tx = await program.methods
          .mintPosition({
            positionId,
            metadataUri,
          })
          .accountsPartial({
            signer: user.publicKey,
            market: marketPda,
            marketPositionsAccount: positionAccountPda,
            nftMint: nftMintKeypair.publicKey,
            nftTokenAccount: nftTokenAccountAddress,
            metadataAccount: nftMetadataPda,
            masterEdition: nftMasterEditionPda,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user, nftMintKeypair])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
            maxRetries: 3,
            preflightCommitment: "confirmed"
          });

        console.log("NFT minting transaction signature:", tx);

        // Verify the position was updated to be an NFT
        const updatedPositionAccount = await program.account.positionAccount.fetch(positionAccountPda);
        const updatedPosition = updatedPositionAccount.positions.find(p => p.positionId === positionId);
        assert.ok(updatedPosition.isNft, "Position should be marked as NFT");
        assert.ok(updatedPosition.mint.equals(nftMintKeypair.publicKey), "Position should have the correct NFT mint");

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
