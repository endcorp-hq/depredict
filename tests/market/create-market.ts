import * as anchor from "@coral-xyz/anchor";  
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { getUsdcMint, getNetworkConfig, ADMIN, FEE_VAULT, program, provider, METAPLEX_ID } from "../helpers";

describe("shortx-contract", () => {
  let usdcMint: PublicKey;
  let collectionMintKeypair: Keypair;

  before(async () => {
    // Get network configuration
    const { isDevnet } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);

    const { mint } = await getUsdcMint();
    usdcMint = mint;
    console.log("USDC Mint:", usdcMint.toString());
    collectionMintKeypair = Keypair.generate();
  });

  before(async () => {
    // Request airdrop for admin if needed
    const balance = await provider.connection.getBalance(ADMIN.publicKey);
    if (balance < 1_000_000_000) { // Less than 1 SOL
      console.log("Requesting airdrop for admin...");
      const signature = await provider.connection.requestAirdrop(ADMIN.publicKey, 2_000_000_000); // 2 SOL
      const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
    }

    try {
      await createMint(
        provider.connection,
        ADMIN, // Payer
        ADMIN.publicKey, // Mint Authority
        ADMIN.publicKey, // Freeze Authority (optional)
        0, // Decimals
        collectionMintKeypair // Mint Keypair
      );
      console.log(
        `Initialized mint account ${usdcMint.toString()} on-chain.`
      );
    } catch (error) {
      // Log error if mint already exists (might happen in specific test setups, though unlikely with anchor test)
      if (error.message.includes("already in use")) {
        console.log(
          `Mint account ${usdcMint.toString()} already exists.`
        );
      } else {
        throw error; // Re-throw other errors
      }
    }
    try {
      const adminTokenAccount = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          ADMIN, // Payer
          usdcMint,
          ADMIN.publicKey
        )
      ).address;
      console.log(
        `Admin ATA (${usdcMint.toString()}): ${adminTokenAccount.toString()}`
      );

      // Mint USDC to admin if needed
      const adminUsdcBalance = await provider.connection.getTokenAccountBalance(adminTokenAccount);
      if (Number(adminUsdcBalance.value.amount) < 1000) {
        console.log("Minting USDC to admin...");
        const { keypair: usdcMintKeypair } = await getUsdcMint();
        await mintTo(
          provider.connection,
          ADMIN,
          usdcMint,
          adminTokenAccount,
          usdcMintKeypair, // Use USDC mint keypair as mint authority
          1000_000_000 // 1000 USDC with 6 decimals
        );
      }

      const mintAmount = new anchor.BN(1_000_000 * 10 ** 6); // 1 Million tokens with 6 decimals
      await mintTo(
        provider.connection,
        ADMIN, // Payer
        usdcMint,
        adminTokenAccount,
        ADMIN.publicKey, // Mint Authority
        mintAmount.toNumber() 
      );
      console.log(`Minted ${mintAmount.toString()} tokens to admin ATA`);
    } catch (error) {
      console.error("Error minting tokens:", error);
    }
  });

  describe("Market", () => {
    
    it("Creates market", async () => {
      // --- Get validator time ---
      console.log("\n--- Fetching Validator Time ---");
      const currentSlot = await provider.connection.getSlot();
      const validatorTime = await provider.connection.getBlockTime(currentSlot);
      if (!validatorTime) {
        assert.fail("Could not fetch validator block time.");
      }
      console.log(`Current Slot: ${currentSlot}`);
      console.log(
        `Validator Time (getBlockTime): ${validatorTime} (${new Date(
          validatorTime * 1000
        ).toISOString()})`
      );
      console.log("--- End Fetching Validator Time ---");
      // ---

      // Set market times relative to validator time
      const marketStart = new anchor.BN(validatorTime - 60); // Start 60 seconds BEFORE validator time
      const marketEnd = new anchor.BN(validatorTime + 86400); // End 24 hours AFTER validator time
      console.log(
        `Calculated Market Start: ${marketStart.toString()} (${new Date(
          marketStart.toNumber() * 1000
        ).toISOString()})`
      );
      // Generate a random market ID
      const marketId = new anchor.BN(Math.floor(Math.random() * 1000000));
      console.log("Using market ID:", marketId.toString());
      const question = Array.from(Buffer.from("Will BTC reach $100k in 2024?"));

      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("Market PDA:", marketPda.toString());

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      console.log("Config PDA:", configPda.toString());

      // Use devnet oracle for testing
      const oraclePubkey = new PublicKey("CYkBEhDgvVHutGKXafAg1gki92SGWDT4MnCxX8KLed6i");

      const [collectionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection")],
        program.programId
      );
      console.log("Collection PDA:", collectionPda.toString());

      // Create a new keypair for the collection mint
      const collectionMintKeypair = Keypair.generate();
      console.log("Collection Mint:", collectionMintKeypair.publicKey.toString());

      // Initialize the collection mint using SPL Token program
      await createMint(
        provider.connection,
        ADMIN, // Payer
        ADMIN.publicKey, // Mint Authority
        ADMIN.publicKey, // Freeze Authority (optional)
        0, // Decimals (NFTs have 0 decimals)
        collectionMintKeypair // Mint Keypair
      );
      console.log("Created collection mint account");

      const [collectionMetadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METAPLEX_ID.toBuffer(),
          collectionMintKeypair.publicKey.toBuffer(),
        ],
        METAPLEX_ID
      );
      console.log("Collection Metadata PDA:", collectionMetadataPda.toString());

      const [collectionMasterEditionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METAPLEX_ID.toBuffer(),
          collectionMintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        METAPLEX_ID
      );
      console.log("Collection Master Edition PDA:", collectionMasterEditionPda.toString());

      // Create metadata URI for the collection
      const metadataUri = "https://arweave.net/your-metadata-uri"; // Replace with your actual metadata URI

      try {
        const tx = await program.methods
          .createMarket({
            marketId,
            question,
            marketStart,
            marketEnd,
            metadataUri
          })
          .accountsPartial({
            signer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            market: marketPda,
            oraclePubkey: oraclePubkey,
            usdcMint: usdcMint,
            collectionMint: collectionMintKeypair.publicKey,
            collectionMetadata: collectionMetadataPda,
            collectionMasterEdition: collectionMasterEditionPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            config: configPda,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenMetadataProgram: METAPLEX_ID,
          })
          .signers([ADMIN])
          .rpc({
            skipPreflight: false,
            commitment: "confirmed",
            maxRetries: 3,
            preflightCommitment: "confirmed"
          });
        console.log("Transaction signature:", tx);
      } catch (error) {
        console.error("Full error:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }

      const marketAccount = await program.account.marketState.fetch(marketPda);
      console.log("\n=== Market State Details ===");
      console.log("Market ID:", marketAccount.marketId.toString());
      console.log("Authority:", marketAccount.authority.toString());
      console.log("Market Start:", new Date(marketAccount.marketStart.toNumber() * 1000).toISOString());
      console.log("Market End:", new Date(marketAccount.marketEnd.toNumber() * 1000).toISOString());
      console.log("Question:", Buffer.from(marketAccount.question).toString());
      console.log("Update Timestamp:", new Date(marketAccount.updateTs.toNumber() * 1000).toISOString());
      console.log("Oracle Pubkey:", marketAccount.oraclePubkey?.toString() || "None");
      console.log("Collection Mint:", marketAccount.collectionMint?.toString() || "None");
      console.log("Collection Metadata:", marketAccount.collectionMetadata?.toString() || "None");
      console.log("Collection Master Edition:", marketAccount.collectionMasterEdition?.toString() || "None");
      console.log("Market State:", marketAccount.marketState);
      console.log("Winning Direction:", marketAccount.winningDirection);
      console.log("=== End Market State Details ===\n");
      
      assert.ok(marketAccount.marketId.eq(marketId));
      assert.ok(marketAccount.authority.equals(ADMIN.publicKey));
    });
  });
});
