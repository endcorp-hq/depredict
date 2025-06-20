import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { getNetworkConfig, FEE_VAULT, program, provider, USER, MARKET_ID, ADMIN, LOCAL_MINT } from "../helpers";

import { fetchAsset, MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { fetchCollection } from '@metaplex-foundation/mpl-core'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import fs from "fs";

describe("shortx-contract", () => { 

  let usdcMint: PublicKey;
  let userTokenAccount: PublicKey;
  let marketVault: PublicKey; 

  // Load local wallet from ~/.config/solana/id.json
  const localKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8")))
  );

  before(async () => {
    // Get network configuration
    const { isDevnet } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);
    console.log("USER:", USER.publicKey.toString());

    // Ensure USER has enough SOL for rent and fees by transferring from local wallet if needed
    const userBalance = await provider.connection.getBalance(USER.publicKey);
    const minBalance = 1_000_000_000; // 1 SOL
    if (userBalance < minBalance) {
      console.log("Transferring 2 SOL from local wallet to USER...");
      const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
      const transferIx = SystemProgram.transfer({
        fromPubkey: localKeypair.publicKey,
        toPubkey: USER.publicKey,
        lamports: 2 * LAMPORTS_PER_SOL,
      });
      const transaction = new anchor.web3.Transaction().add(transferIx);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = localKeypair.publicKey;
      const signature = await provider.connection.sendTransaction(transaction, [localKeypair]);
      await provider.connection.confirmTransaction(signature);
      console.log("Transfer to USER successful");
    }

    // Get the USDC mint
    usdcMint = LOCAL_MINT.publicKey;
    console.log("USDC Mint:", usdcMint.toString());

    // Print out account information for comparison
    console.log("\nAccount Information:");
    console.log("ADMIN public key:", ADMIN.publicKey.toString());
    console.log("USER public key:", USER.publicKey.toString());
    console.log("Local wallet public key:", localKeypair.publicKey.toString());
    console.log("USDC mint authority (LOCAL_MINT):", LOCAL_MINT.publicKey.toString());

    // Get the market PDA for mint authority
    global.MARKET_ID = MARKET_ID;
    console.log("MARKET_ID:", MARKET_ID.toNumber());
    
    const [marketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("market"),
        MARKET_ID.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Check market PDA balance
    // const marketBalance = await provider.connection.getBalance(marketPda);
    // console.log("Market PDA balance:", marketBalance, "lamports");

    // Calculate required rent-exempt amount for market state (467 bytes)
    // const marketRentExempt = await provider.connection.getMinimumBalanceForRentExemption(467);
    // console.log("Required rent-exempt amount for market state:", marketRentExempt, "lamports");

    // // Calculate required rent-exempt amount for token account (165 bytes)
    // const tokenAccountRentExempt = await provider.connection.getMinimumBalanceForRentExemption(165);
    // console.log("Required rent-exempt amount for token account:", tokenAccountRentExempt, "lamports");

    // Defensive check: Create user's USDC token account
    try {
      userTokenAccount = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          USER, // Payer
          usdcMint,
          USER.publicKey
        )
      ).address;
      console.log(`User USDC ATA: ${userTokenAccount.toString()}`);

      // Mint USDC to USER's ATA if needed
      const userUsdcBalance = await provider.connection.getTokenAccountBalance(userTokenAccount);
      const minUsdc = 1_000_000_000; // 1,000 USDC (6 decimals)
      if (Number(userUsdcBalance.value.amount) < minUsdc) {
        console.log(`Minting 1,000 USDC to USER (current balance: ${userUsdcBalance.value.amount})...`);
        await mintTo(
          provider.connection,
          ADMIN, // payer
          usdcMint,
          userTokenAccount,
          LOCAL_MINT, // mint authority
          minUsdc
        );
        console.log("Minted 1,000 USDC to USER's ATA");
      } else {
        console.log(`User already has sufficient USDC: ${userUsdcBalance.value.amount}`);
      }
    } catch (e) {
      console.error("Failed to get or create user USDC ATA:", e);
      throw e;
    }

    // Defensive check: Create market's USDC vault (ATA for market PDA)
    // try {
    //   marketVault = (
    //     await getOrCreateAssociatedTokenAccount(
    //       provider.connection,
    //       USER, // Payer
    //       usdcMint,
    //       marketPda,
    //       true // allowOwnerOffCurve for PDA
    //     )
    //   ).address;
    //   console.log(`Market USDC Vault: ${marketVault.toString()}`);
    // } catch (e) {
    //   console.error("Failed to get or create market USDC vault:", e);
    //   throw e;
    // }

    // Note: You'll need to get USDC from the faucet: https://spl-token-faucet.com/?token-name=USDC
    if (isDevnet) {
      console.log("Please ensure you have USDC in your wallet from the faucet");
    }
  });

  describe("Trade", () => {
    it("Creates an order in an existing market", async () => {



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
      const positionId = marketAccount.nextPositionId; // This should be a BN
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), MARKET_ID.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [positionNftAccountPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("nft"),
          MARKET_ID.toArrayLike(Buffer, "le", 8),
          marketAccount.nextPositionId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("Position account PDA:", positionAccountPda.toString());
      const collectionPubkey = marketAccount.nftCollection;

      const [collectionPda, collectionBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("collection"), 
          MARKET_ID.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );
      console.log("Collection PDA:", collectionPda.toString());


      console.log("Collection PDA:", collectionPubkey.toString());
      // Create order parameters
      const amount = new anchor.BN(3*10**6); // 2 USDC (6 decimals)
      const direction = { yes: {} }; // Betting on "Yes"

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
            userUsdcAta: userTokenAccount,
            marketUsdcVault: marketVault,
            positionNftAccount: positionNftAccountPda,
            collection: collectionPubkey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
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
        // assert.ok(marketAccount.yesLiquidity.gt(new anchor.BN(0)), "Yes liquidity should be greater than 0");

      } catch (error) {
        console.error("Error creating order:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }


      const umi = createUmi(provider.connection)

      const asset = await fetchAsset(umi, positionNftAccountPda.toString(), {
        skipDerivePlugins: false,
      })
      
      console.log("Asset:", asset)
      let attributes = asset.attributes
      // map the attributes as key value pairs and console log: 
      let attributesMap = attributes.attributeList.map((attribute: any) => {
        return {
          [attribute.key]: attribute.value
        }
      })
      console.log("Attributes:", attributesMap)

      console.log("Fetching collection...");
      const collection = await fetchCollection(umi, collectionPda.toString())
      console.log(collection)
      let collection_attributes = collection.attributes
      // map the attributes as key value pairs and console log: 
      let collection_attributesMap = collection_attributes.attributeList.map((attribute: any) => {
        return {
          [attribute.key]: attribute.value
        }
      })
      console.log("Collection Attributes:", collection_attributesMap)
      console.log("Collection fetched");




    });
  });
});
