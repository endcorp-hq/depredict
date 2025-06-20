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
import { getNetworkConfig, ADMIN, FEE_VAULT, program, provider, METAPLEX_ID, LOCAL_MINT } from "../helpers";
import { getMint } from "@solana/spl-token";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { fetchCollection } from '@metaplex-foundation/mpl-core'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

const umi = createUmi(provider.connection)

// At the top of your file:
let numMarkets: anchor.BN;
let configPda: PublicKey;


describe("shortx-contract", () => {
  let usdcMint: PublicKey;
  let collectionMintKeypair: Keypair;

  before(async () => {
    // Get network configuration
    const { isDevnet } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);

    // Use local mint for testing
    // usdcMint = LOCAL_MINT.publicKey;
    usdcMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
    console.log("USDC Mint:", usdcMint.toString());
    collectionMintKeypair = Keypair.generate();
  });

  before(async () => {
    // // Request airdrop for admin if needed
    // const balance = await provider.connection.getBalance(ADMIN.publicKey);
    // if (balance < 1_000_000_000) { // Less than 1 SOL
    //   console.log("Requesting airdrop for admin...");
    //   const signature = await provider.connection.requestAirdrop(ADMIN.publicKey, 2_000_000_000); // 2 SOL
    //   const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
    //   await provider.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
    // }

    // try {
    //   await createMint(
    //     provider.connection,
    //     ADMIN, // Payer
    //     ADMIN.publicKey, // Mint Authority
    //     ADMIN.publicKey, // Freeze Authority (optional)
    //     0, // Decimals
    //     collectionMintKeypair // Mint Keypair
    //   );
    //   console.log(
    //     `Initialized mint account ${usdcMint.toString()} on-chain.`
    //   );
    // } catch (error) {
    //   // Log error if mint already exists (might happen in specific test setups, though unlikely with anchor test)
    //   if (error.message.includes("already in use")) {
    //     console.log(
    //       `Mint account ${usdcMint.toString()} already exists.`
    //     );
    //   } else {
    //     throw error; // Re-throw other errors
    //   }
    // }
    // try {
    //   const adminTokenAccount = (
    //     await getOrCreateAssociatedTokenAccount(
    //       provider.connection,
    //       ADMIN, // Payer
    //       usdcMint,
    //       ADMIN.publicKey
    //     )
    //   ).address;
    //   console.log(
    //     `Admin ATA (${usdcMint.toString()}): ${adminTokenAccount.toString()}`
    //   );
      
    //   const mintInfo = await getMint(provider.connection, usdcMint);
    //   console.log("Mint authority:", mintInfo.mintAuthority?.toBase58());



    //   // Mint USDC to admin if needed
    //   const adminUsdcBalance = await provider.connection.getTokenAccountBalance(adminTokenAccount);
    //   if (Number(adminUsdcBalance.value.amount) < 1000_000_000) { // Less than 1000 USDC
    //     console.log("Minting USDC to admin...");
    //     await mintTo(
    //       provider.connection,
    //       ADMIN, // Payer
    //       usdcMint,
    //       adminTokenAccount,
    //       LOCAL_MINT, // Use LOCAL_MINT as mint authority
    //       1000_000_000 // 1000 USDC with 6 decimals
    //     );
    //     console.log("Minted 1000 USDC to admin");
    //   } else {
    //     console.log(`Admin already has sufficient USDC: ${adminUsdcBalance.value.amount}`);
    //   }
    // } catch (error) {
    //   console.error("Error minting tokens:", error);
    // }

    // Assign to file-level configPda
    configPda = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    )[0];

    console.log("Config PDA:", configPda.toString());

    // load the config account to get the num_markets
    const configAccount = await program.account.config.fetch(configPda);
    numMarkets = configAccount.nextMarketId; // assign to file-level variable
    console.log("Num Markets:", numMarkets);




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
      console.log("Number of existing markets:", numMarkets);
      // Generate a market ID based on the number of existing markets
      // const marketId = numMarkets.add(new anchor.BN(1));
      // console.log("Using market ID:", marketId.toNumber());
      const question = Array.from(Buffer.from("Will BTC reach $100k in 2024?"));
      // const configAccountBefore = await program.account.config.fetch(configPda);
      const marketId = numMarkets;
      console.log("Market ID:", marketId.toNumber());

      const [marketPda, marketBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("Market PDA:", marketPda.toString());

      const [marketPositionsPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("Market Positions PDA:", marketPositionsPda.toString());


      // Use devnet oracle for testing
      const oraclePubkey = new PublicKey("HX5YhqFV88zFhgPxEzmR1GFq8hPccuk2gKW58g1TLvbL");

      const [collectionPda, collectionBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("collection"), 
          marketId.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );
      console.log("Collection PDA:", collectionPda.toString());

      // Create a new keypair for the collection mint
      const collectionMintKeypair = Keypair.generate();
      console.log("Collection Mint:", collectionMintKeypair.publicKey.toString());

      // Initialize the collection mint using SPL Token program
      const mintId = await createMint(
        provider.connection,
        ADMIN, // Payer
        ADMIN.publicKey, // Mint Authority
        ADMIN.publicKey, // Freeze Authority (optional)
        0, // Decimals (NFTs have 0 decimals)
        collectionMintKeypair // Mint Keypair
      );
      console.log("Created collection mint account", mintId.toString());

      // Create metadata URI for the collection
      const metadataUri = "https://arweave.net/your-metadata-uri"; // Replace with your actual metadata URI

      try {
        const tx = await program.methods
          .createMarket({
            question,
            marketStart,
            marketEnd,
            metadataUri
          })
          .accountsPartial({
            payer: ADMIN.publicKey,
            feeVault: FEE_VAULT.publicKey,
            market: marketPda,
            collection: collectionPda,
            marketPositionsAccount: marketPositionsPda,
            oraclePubkey: oraclePubkey,
            usdcMint: usdcMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            config: configPda,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
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
      console.log("Market State:", marketAccount.marketState);
      console.log("Winning Direction:", marketAccount.winningDirection);
      console.log("Collection Mint:", marketAccount.nftCollection?.toString() || "None");
      console.log("=== End Market State Details ===\n");
      
      const configAccount = await program.account.config.fetch(configPda);
      console.log("\n=== Config State Details ===");
      console.log("Number of markets:", configAccount.nextMarketId.toNumber());
      console.log("Authority:", configAccount.authority.toString());
      console.log("Fee Vault:", configAccount.feeVault.toString());
      console.log("Fee Amount:", configAccount.feeAmount);
      console.log("Version:", configAccount.version.toString());
      console.log("=== End Config State Details ===\n");



      assert.ok(marketAccount.marketId.eq(marketId));
      assert.ok(marketAccount.authority.equals(ADMIN.publicKey));

      console.log("Fetching collection...");
      const asset = await fetchCollection(umi, collectionPda.toString())
      console.log(asset)
      let attributes = asset.attributes
      // map the attributes as key value pairs and console log: 
      let attributesMap = attributes.attributeList.map((attribute: any) => {
        return {
          [attribute.key]: attribute.value
        }
      })
      console.log("Attributes:", attributesMap)
      console.log("Collection fetched");
    });
  });
});
