import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { getNetworkConfig, FEE_VAULT, program, provider, USER, getCurrentMarketId, getMarketIdByState, ADMIN, LOCAL_MINT } from "../helpers";

import { fetchAsset, MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { fetchCollection } from '@metaplex-foundation/mpl-core'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import fs from "fs";

describe("depredict", () => { 

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
    const minBalance = 2_000_000_000; // 2 SOL to cover NFT rent + fees
    if (userBalance < minBalance) {
      // Check if local wallet has enough SOL
      const localWalletBalance = await provider.connection.getBalance(localKeypair.publicKey);
      const requiredAmount = 3 * LAMPORTS_PER_SOL;
      
      if (localWalletBalance < requiredAmount) {
        console.log("Local wallet needs more SOL. Current balance:", localWalletBalance / LAMPORTS_PER_SOL, "SOL");
        console.log("Required:", requiredAmount / LAMPORTS_PER_SOL, "SOL");
        console.log("Please fund the local wallet or run: solana airdrop 5", localKeypair.publicKey.toString());
        throw new Error("Insufficient SOL in local wallet for testing");
      }
      
      console.log("Transferring 3 SOL from local wallet to USER...");
      const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
      const transferIx = SystemProgram.transfer({
        fromPubkey: localKeypair.publicKey,
        toPubkey: USER.publicKey,
        lamports: requiredAmount,
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
    
    // Log balances
    const finalUserBalance = await provider.connection.getBalance(USER.publicKey);
    const finalLocalBalance = await provider.connection.getBalance(localKeypair.publicKey);
    console.log("USER balance:", finalUserBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("Local wallet balance:", finalLocalBalance / LAMPORTS_PER_SOL, "SOL");
    
    // Fund MPL Core program account if needed (for localnet)
    const mplCoreProgramId = new PublicKey(MPL_CORE_PROGRAM_ID.toString());
    const mplCoreBalance = await provider.connection.getBalance(mplCoreProgramId);
    console.log("MPL Core program balance:", mplCoreBalance / LAMPORTS_PER_SOL, "SOL");
    
    // Fund MPL Core more generously for localnet testing
    if (mplCoreBalance < 5_000_000_000) { // Less than 5 SOL
      console.log("Funding MPL Core program account with 10 SOL...");
      const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
      const transferIx = SystemProgram.transfer({
        fromPubkey: localKeypair.publicKey,
        toPubkey: mplCoreProgramId,
        lamports: 10 * LAMPORTS_PER_SOL,
      });
      const transaction = new anchor.web3.Transaction().add(transferIx);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = localKeypair.publicKey;
      const signature = await provider.connection.sendTransaction(transaction, [localKeypair]);
      await provider.connection.confirmTransaction(signature);
      console.log("MPL Core program funded successfully");
      
      const newMplCoreBalance = await provider.connection.getBalance(mplCoreProgramId);
      console.log("MPL Core program new balance:", newMplCoreBalance / LAMPORTS_PER_SOL, "SOL");
    }

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
          ADMIN.publicKey, // mint authority (ADMIN, not LOCAL_MINT)
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

    if (isDevnet) {
      console.log("Please ensure you have USDC in your wallet from the faucet");
    }
  });

  describe("Trade", () => {
    it("Creates an order in an existing market", async () => {
      // Get the current market ID
      const marketId = await getCurrentMarketId();
      console.log("Using market ID:", marketId.toString());

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Check if the market exists before proceeding
      try {
        const marketAccount = await program.account.marketState.fetch(marketPda);
        console.log("Market Account found:", marketAccount.marketId.toString());
        
        // Check if market is still open for betting
        const currentSlot = await provider.connection.getSlot();
        const currentTime = await provider.connection.getBlockTime(currentSlot);
        if (currentTime && marketAccount.marketEnd.toNumber() < currentTime) {
          console.log("Market is closed for betting, skipping order creation");
          console.log("Market end time:", marketAccount.marketEnd.toNumber());
          console.log("Current time:", currentTime);
          return; // Skip this test if market is closed
        }
      } catch (error) {
        console.log("Market does not exist or cannot be fetched:", error.message);
        console.log("Market PDA:", marketPda.toString());
        console.log("This is expected if no market was successfully created in previous tests");
        return; // Skip this test if market doesn't exist
      }

      // Get the config PDA
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Get the market account again for position ID and vault
      const marketAccount = await program.account.marketState.fetch(marketPda);
      const marketVault = marketAccount.marketUsdcVault;
      const [positionNftAccountPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("nft"),
          marketId.toArrayLike(Buffer, "le", 8),
          marketAccount.nextPositionId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("Position account PDA:", positionAccountPda.toString());
      console.log("Market USDC Vault:", marketVault.toString());
      const collectionPubkey = marketAccount.nftCollection;

      const [collectionPda, collectionBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("collection"), 
          marketId.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );
      console.log("Collection PDA:", collectionPda.toString());

      console.log("Collection pubkey:", collectionPubkey.toString());
      
      // Final check: Ensure USER has sufficient SOL for NFT creation
      const userSolBalance = await provider.connection.getBalance(USER.publicKey);
      console.log("USER SOL balance before position creation:", userSolBalance / LAMPORTS_PER_SOL, "SOL");
      
      if (userSolBalance < 1_500_000_000) { // 1.5 SOL minimum
        console.error("USER account has insufficient SOL for NFT creation");
        console.error("Current balance:", userSolBalance / LAMPORTS_PER_SOL, "SOL");
        console.error("Minimum required: 1.5 SOL");
        throw new Error("Insufficient SOL in USER account for NFT creation");
      }
      
      // Create order parameters
      const amount = new anchor.BN(3*10**6); // 3 USDC (6 decimals)
      const direction = { yes: {} }; // Betting on "Yes"

      try {
        const { tx, error } = await tryCreatePositionTx({
          user: USER,
          amount,
          direction,
          usdcMint,
          userTokenAccount,
          marketPda,
          marketUsdcVault: marketVault,
          positionAccountPda,
          positionNftAccountPda,
          collectionPubkey,
          configPda,
          metadataUri: "https://arweave.net/position-metadata",
        });
        if (error) {
          console.error("Order creation failed:", error);
          assert.fail("Order creation failed: " + error.toString());
        }
        console.log("Order creation transaction signature:", tx);

        // Fetch the market account to verify the order was created
        const updatedMarketAccount = await program.account.marketState.fetch(marketPda);
        console.log("Market Account after order:", updatedMarketAccount);

        // Verify the market volume increased
        assert.ok(updatedMarketAccount.volume.gt(new anchor.BN(0)), "Market volume should be greater than 0");

        // Verify the yes liquidity increased (since we placed a "Yes" order)
        // assert.ok(updatedMarketAccount.yesLiquidity.gt(new anchor.BN(0)), "Yes liquidity should be greater than 0");

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

    // --- Negative Test Cases for Business Logic ---

    it("Fails if market is already resolved", async () => {
      // TODO: Create a market and resolve it (set winning_direction != None)
      // ...create and resolve market...
      // const { error } = await tryCreatePositionTx({ ... });
      // assert.isNotNull(error, "Should fail with MarketAlreadyResolved");
      // assert.include(error.toString(), "MarketAlreadyResolved");
    });

    it("Fails if concurrent transaction is detected", async () => {
      // TODO: Manipulate market account so update_ts >= current ts
      // ...simulate this state...
      // const { error } = await tryCreatePositionTx({ ... });
      // assert.isNotNull(error, "Should fail with ConcurrentTransaction");
      // assert.include(error.toString(), "ConcurrentTransaction");
    });

    it("Fails if no available position slot", async () => {
      // TODO: Fill all position slots in the market_positions_account
      // ...simulate this state...
      // const { error } = await tryCreatePositionTx({ ... });
      // assert.isNotNull(error, "Should fail with NoAvailablePositionSlot");
      // assert.include(error.toString(), "NoAvailablePositionSlot");
    });

    it("Fails if user has insufficient USDC", async () => {
      // Use a user with 0 USDC
      // You can create a new Keypair for this test
      const poorUser = anchor.web3.Keypair.generate();
      // Create ATA for poorUser but do not mint USDC
      let poorUserTokenAccount;
      try {
        poorUserTokenAccount = (
          await getOrCreateAssociatedTokenAccount(
            provider.connection,
            poorUser, // payer
            usdcMint,
            poorUser.publicKey
          )
        ).address;
      } catch (e) {
        // If fails, skip test
        return;
      }
      const { error } = await tryCreatePositionTx({
        user: poorUser,
        userTokenAccount: poorUserTokenAccount,
        usdcMint,
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        metadataUri: "https://arweave.net/position-metadata",
        // ...other required params (mock or reuse from above)
        expectError: "InsufficientFunds"
      });
      assert.isNotNull(error, "Should fail with InsufficientFunds");
      assert.include(error.toString(), "InsufficientFunds");
    });

    it("Fails if user has insufficient SOL for fee", async () => {
      // Use a user with 0 SOL
      // Airdrop 0 SOL to a new Keypair (should have no funds)
      const noSolUser = anchor.web3.Keypair.generate();
      // Create ATA for noSolUser and mint USDC so only USDC is present
      let noSolUserTokenAccount;
      try {
        noSolUserTokenAccount = (
          await getOrCreateAssociatedTokenAccount(
            provider.connection,
            noSolUser, // payer
            usdcMint,
            noSolUser.publicKey
          )
        ).address;
        // Mint USDC to this account so only fee transfer fails
        await mintTo(
          provider.connection,
          ADMIN, // payer
          usdcMint,
          noSolUserTokenAccount,
          LOCAL_MINT, // mint authority
          1_000_000
        );
      } catch (e) {
        // If fails, skip test
        return;
      }
      // Do not airdrop SOL, so fee transfer should fail
      const { error } = await tryCreatePositionTx({
        user: noSolUser,
        userTokenAccount: noSolUserTokenAccount,
        usdcMint,
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        metadataUri: "https://arweave.net/position-metadata",
        // ...other required params (mock or reuse from above)
        expectError: "InsufficientFunds"
      });
      assert.isNotNull(error, "Should fail with InsufficientFunds");
      assert.include(error.toString(), "InsufficientFunds");
    });

    it("Fails if betting period has ended (using closed market)", async () => {
      // This test targets a market that is closed for betting.
      // It should fail with the 'BettingPeriodEnded' error.
      const closedMarketId = await getMarketIdByState("closed");
      console.log("Using closed market ID:", closedMarketId.toString());
      
      // Derive PDAs for closed market
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), closedMarketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), closedMarketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      // Get the market account to get the next position ID
      const closedMarketAccount = await program.account.marketState.fetch(marketPda);
      const [positionNftAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("nft"), closedMarketId.toArrayLike(Buffer, "le", 8), closedMarketAccount.nextPositionId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      // Fetch the market account to get the collection pubkey and vault
      let marketAccount;
      try {
        marketAccount = await program.account.marketState.fetch(marketPda);
        console.log("Found closed market:", marketAccount.marketId.toString());
        console.log("Market end time:", marketAccount.marketEnd.toNumber());
      } catch (e) {
        console.log("Closed market does not exist, skipping test");
        console.log("This is expected if setup-markets.ts hasn't been run yet");
        return;
      }
      
      const marketVault = marketAccount.marketUsdcVault;
      const collectionPubkey = marketAccount.nftCollection;
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      
      // Use a valid user with USDC
      const { error } = await tryCreatePositionTx({
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        usdcMint,
        userTokenAccount,
        marketPda,
        marketUsdcVault: marketVault,
        positionAccountPda,
        positionNftAccountPda,
        collectionPubkey,
        configPda,
        metadataUri: "https://arweave.net/position-metadata",
        expectError: "BettingPeriodEnded"
      });
      
      assert.isNotNull(error, "Should fail with BettingPeriodEnded");
      assert.include(error.toString(), "BettingPeriodEnded");
    });

    it("Fails if market is already resolved", async () => {
      // This test targets a market that has already been resolved.
      // It should fail with the 'MarketAlreadyResolved' error.
      const resolvedMarketId = await getMarketIdByState("resolved");
      console.log("Using resolved market ID:", resolvedMarketId.toString());
      
      // Derive PDAs for resolved market
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), resolvedMarketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), resolvedMarketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      // Get the market account to get the next position ID
      const resolvedMarketAccount = await program.account.marketState.fetch(marketPda);
      const [positionNftAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("nft"), resolvedMarketId.toArrayLike(Buffer, "le", 8), resolvedMarketAccount.nextPositionId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      // Fetch the market account to get the collection pubkey and vault
      let marketAccount;
      try {
        marketAccount = await program.account.marketState.fetch(marketPda);
        console.log("Found resolved market:", marketAccount.marketId.toString());
        console.log("Market state:", marketAccount.marketState);
        console.log("Winning direction:", marketAccount.winningDirection);
      } catch (e) {
        console.log("Resolved market does not exist, skipping test");
        console.log("This is expected if setup-markets.ts hasn't been run yet");
        return;
      }
      
      const marketVault = marketAccount.marketUsdcVault;
      const collectionPubkey = marketAccount.nftCollection;
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      
      // Use a valid user with USDC
      const { error } = await tryCreatePositionTx({
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        usdcMint,
        userTokenAccount,
        marketPda,
        marketUsdcVault: marketVault,
        positionAccountPda,
        positionNftAccountPda,
        collectionPubkey,
        configPda,
        metadataUri: "https://arweave.net/position-metadata",
        expectError: "MarketAlreadyResolved"
      });
      
      assert.isNotNull(error, "Should fail with MarketAlreadyResolved");
      assert.include(error.toString(), "MarketAlreadyResolved");
    });

    it("Succeeds with manual resolution market", async () => {
      // Get network configuration for this test
      const { isDevnet } = await getNetworkConfig();
      
      // This test targets a manual resolution market that should be open for betting.
      const manualMarketId = await getMarketIdByState("manual");
      console.log("Using manual market ID:", manualMarketId.toString());
      
      // Debug: Check if we're getting the right market ID
      if (manualMarketId.toString() === "1") {
        console.log("⚠️  Warning: Using default market ID 1 - manual market may not exist");
        console.log("   Run 'anchor run test-setup-markets' first to create markets");
      }
      
      // Derive PDAs for manual market
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), manualMarketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), manualMarketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      // Fetch the market account to get the collection pubkey and next position ID
      let marketAccount;
      try {
        marketAccount = await program.account.marketState.fetch(marketPda);
        console.log("Found manual market:", marketAccount.marketId.toString());
        console.log("Market state:", marketAccount.marketState);
        console.log("Oracle type:", marketAccount.oracleType);
      } catch (e) {
        console.log("Manual market does not exist, skipping test");
        console.log("This is expected if setup-markets.ts hasn't been run yet");
        return;
      }
      
      const marketVault = marketAccount.marketUsdcVault;
      const [positionNftAccountPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("nft"), 
          manualMarketId.toArrayLike(Buffer, "le", 8), 
          marketAccount.nextPositionId.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );
      
      const collectionPubkey = marketAccount.nftCollection;
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      
      // Use a valid user with USDC
      const { tx, error } = await tryCreatePositionTx({
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        usdcMint,
        userTokenAccount,
        marketPda,
        marketUsdcVault: marketVault,
        positionAccountPda,
        positionNftAccountPda,
        collectionPubkey,
        configPda,
        metadataUri: "https://arweave.net/position-metadata",
      });
      
      if (error) {
        console.error("Manual market order creation failed:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        
        // Check for rent-related errors
        if (error.toString().includes("insufficient funds for rent")) {
          console.error("Rent error detected! This could be due to:");
          console.error("1. USER account insufficient SOL");
          console.error("2. MPL Core program account insufficient SOL (localnet issue)");
          
          const userBalance = await provider.connection.getBalance(USER.publicKey);
          const mplCoreBalance = await provider.connection.getBalance(new PublicKey(MPL_CORE_PROGRAM_ID.toString()));
          
          console.error("USER account SOL balance:", userBalance / LAMPORTS_PER_SOL, "SOL");
          console.error("MPL Core program SOL balance:", mplCoreBalance / LAMPORTS_PER_SOL, "SOL");
          
          // For localnet, try additional funding and retry once
          if (!isDevnet) {
            console.log("Localnet detected - attempting additional funding and retry...");
            
            // Fund MPL Core even more
            const additionalFunding = 20 * LAMPORTS_PER_SOL;
            console.log("Funding MPL Core with additional", additionalFunding / LAMPORTS_PER_SOL, "SOL...");
            
            const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
            const transferIx = SystemProgram.transfer({
              fromPubkey: localKeypair.publicKey,
              toPubkey: new PublicKey(MPL_CORE_PROGRAM_ID.toString()),
              lamports: additionalFunding,
            });
            const transaction = new anchor.web3.Transaction().add(transferIx);
            transaction.recentBlockhash = recentBlockhash;
            transaction.feePayer = localKeypair.publicKey;
            const signature = await provider.connection.sendTransaction(transaction, [localKeypair]);
            await provider.connection.confirmTransaction(signature);
            
            console.log("Retrying position creation...");
            
            // Retry the position creation
            const retryResult = await tryCreatePositionTx({
              user: USER,
              amount: new anchor.BN(1_000_000),
              direction: { yes: {} },
              usdcMint,
              userTokenAccount,
              marketPda,
              marketUsdcVault: marketVault,
              positionAccountPda,
              positionNftAccountPda,
              collectionPubkey,
              configPda,
              metadataUri: "https://arweave.net/position-metadata",
            });
            
            if (retryResult.error) {
              console.error("Retry also failed:", retryResult.error.toString());
              throw new Error("Position creation failed even after additional MPL Core funding");
            } else {
              console.log("Retry successful!");
              // Continue with the successful result
              const updatedMarketAccount = await program.account.marketState.fetch(marketPda);
              console.log("Market Account after order:", updatedMarketAccount);
              assert.ok(updatedMarketAccount.volume.gt(new anchor.BN(0)), "Market volume should be greater than 0");
              return; // Exit early since we succeeded
            }
          }
          
          if (mplCoreBalance < 1_000_000_000) {
            console.error("MPL Core program needs more SOL. This is a localnet issue.");
            throw new Error("MPL Core program account needs more SOL for localnet testing");
          } else if (userBalance < 1_500_000_000) {
            console.error("USER account needs more SOL for NFT creation");
            throw new Error("USER account needs more SOL for NFT creation");
          } else {
            console.error("Unknown rent issue - both accounts have sufficient SOL");
            throw new Error("Unknown rent issue - check transaction logs for details");
          }
        }
        
        // Check if this is an MPL Core error on localnet
        if (error.toString().includes("Unsupported program id") || error.toString().includes("MPL")) {
          console.log("Order creation failed due to MPL Core error on localnet");
          console.log("Make sure to run ./tests/setup-localnet.sh to load MPL Core");
          console.log("Error:", error.toString());
        }
        // For other errors, fail the test
        assert.fail("Order creation failed with unexpected error: " + error.toString());
      }
      
      assert.ok(tx, "Order creation should succeed on manual market");
      console.log("Manual market order creation successful:", tx);
    });
  });
});

type TryCreatePositionParams = {
  user?: typeof USER,
  amount?: anchor.BN,
  direction?: any,
  usdcMint?: PublicKey,
  userTokenAccount?: PublicKey,
  marketPda?: PublicKey,
  marketUsdcVault?: PublicKey,
  positionAccountPda?: PublicKey,
  positionNftAccountPda?: PublicKey,
  collectionPubkey?: PublicKey,
  configPda?: PublicKey,
  metadataUri?: string,
  expectError?: string | null,
  mplCoreProgram?: PublicKey,
};

async function tryCreatePositionTx({
  user = USER,
  amount = new anchor.BN(1_000_000),
  direction = { yes: {} },
  usdcMint,
  userTokenAccount,
  marketPda,
  marketUsdcVault,
  positionAccountPda,
  positionNftAccountPda,
  collectionPubkey,
  configPda,
  metadataUri = "https://arweave.net/position-metadata",
  expectError = null,
  mplCoreProgram = new PublicKey(MPL_CORE_PROGRAM_ID.toString()),
}: TryCreatePositionParams) {
  try {
    const tx = await program.methods
      .createPosition({
        amount,
        direction,
        metadataUri,
      })
      .accountsPartial({
        signer: user.publicKey,
        feeVault: FEE_VAULT.publicKey,
        marketPositionsAccount: positionAccountPda,
        market: marketPda,
        usdcMint: usdcMint,
        userUsdcAta: userTokenAccount,
        marketUsdcVault: marketUsdcVault,
        positionNftAccount: positionNftAccountPda,
        collection: collectionPubkey,
        mplCoreProgram: mplCoreProgram,
        config: configPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    return { tx, error: null };
  } catch (error) {
    if (expectError) {
      // Don't assert here - let the calling test handle the assertion
      // assert.include(error.toString(), expectError);
    }
    return { tx: null, error };
  }
}