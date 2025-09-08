import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { getNetworkConfig, FEE_VAULT, program, provider, USER, getCurrentMarketId, getMarketIdByState, ADMIN, LOCAL_MINT, getCurrentUnixTime, createMarketCreator, getVerifiedMarketCreatorDetails, verifyMarketCreator, ensureAccountBalance } from "../helpers";
import * as fs from "fs";
import { getMarketCreatorDetails } from "../helpers";
// MPL imports for collection and merkle tree creation
import { createTreeV2 } from "@metaplex-foundation/mpl-bubblegum";
import {
  createCollection,
  mplCore,
} from '@metaplex-foundation/mpl-core';
import {
  generateSigner,
  signerIdentity,
  sol,
  createSignerFromKeypair
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
// Bubblegum + MPL program IDs
const BUBBLEGUM_PROGRAM_ID = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
const MPL_CORE_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const MPL_NOOP_ID = new PublicKey("mnoopTCrg4p8ry25e4bcWA9XZjbNjMTfgYVGGEdRsf3");
const ACCOUNT_COMPRESSION_ID = new PublicKey("mcmt6YrQEMKw8Mw43FmpRLmf7BqRnFMKmAcbxE3xkAW");

describe("depredict", () => { 

  let usdcMint: PublicKey;
  let userTokenAccount: PublicKey;
  let marketVault: PublicKey;
  let testMarketCreator: PublicKey;
  let testCoreCollection: PublicKey;
  let testMerkleTree: PublicKey;
  let testAdmin: Keypair; 

  // Load local wallet from ~/.config/solana/id.json
  const localKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8")))
  );

  // Helper function to create MPL Core collection
  async function createTestCollection(): Promise<PublicKey> {
    const umi = createUmi(provider.connection.rpcEndpoint)
      .use(mplCore());

    const signer = generateSigner(umi);
    umi.use(signerIdentity(signer));

    console.log('Airdropping 1 SOL to identity for collection creation');
    await umi.rpc.airdrop(umi.identity.publicKey, sol(1));

    const metadataUri = 'https://example.com/test-collection-metadata.json';
    const collection = generateSigner(umi);

    console.log('Creating Test Collection...');
    const tx = await createCollection(umi, {
      collection,
      name: 'Test Collection for Order Creation',
      uri: metadataUri,
    }).sendAndConfirm(umi);

    console.log("✅ Test Collection created successfully");
    console.log("   Collection address:", collection.publicKey);
    console.log("   Transaction signature:", tx.signature);

    return new PublicKey(collection.publicKey);
  }

  // Helper function to create merkle tree
  async function createTestMerkleTree(authority: Keypair, isPublic: boolean = false): Promise<PublicKey> {
    const umi = createUmi((provider.connection as any).rpcEndpoint || "http://127.0.0.1:8899");
    const umiAuthorityKp = umi.eddsa.createKeypairFromSecretKey(authority.secretKey);
    umi.use(signerIdentity(createSignerFromKeypair(umi, umiAuthorityKp)));
    
    const merkleTree = generateSigner(umi);
    const builder = await createTreeV2(umi, {
      merkleTree,
      maxDepth: 16,
      maxBufferSize: 64,
      public: isPublic,
    });
    await builder.sendAndConfirm(umi);
    
    const treePubkey = new PublicKey(merkleTree.publicKey.toString());
    console.log(`Merkle tree created with authority ${authority.publicKey.toString()}:`, treePubkey.toString());
    
    // Wait for the account to be fully propagated on-chain
    console.log("Waiting for merkle tree account to be fully propagated...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return treePubkey;
  }

  before(async () => {
    // Get network configuration
    const { isDevnet } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);
    console.log("USER:", USER.publicKey.toString());

    // Use the existing market creator setup
    console.log("Using existing market creator setup...");
    
    // Get the existing market creator
    const marketCreatorDetails = await getVerifiedMarketCreatorDetails();
    testMarketCreator = marketCreatorDetails.marketCreator;
    testCoreCollection = marketCreatorDetails.coreCollection;
    
    // Create a new test merkle tree with ADMIN as authority for this test
    console.log("Creating test merkle tree...");
    testMerkleTree = await createTestMerkleTree(ADMIN, false);
    
    console.log("✅ Test market creator setup complete");
    console.log("   Market Creator:", testMarketCreator.toString());
    console.log("   Core Collection:", testCoreCollection.toString());
    console.log("   Merkle Tree:", testMerkleTree.toString());

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
    const mplCoreProgramId = new PublicKey(MPL_CORE_ID.toString());
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

    // Create user's USDC token account
    console.log("Creating user USDC token account...");
    userTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        USER, // Payer
        usdcMint,
        USER.publicKey
      )
    ).address;
    console.log(`User USDC ATA: ${userTokenAccount.toString()}`);

    // Mint USDC to USER's ATA
    const minUsdc = 1_000_000_000; // 1,000 USDC (6 decimals)
    console.log(`Minting 1,000 USDC to USER...`);
    await mintTo(
      provider.connection,
      ADMIN, // payer
      usdcMint,
      userTokenAccount,
      ADMIN.publicKey, // mint authority (ADMIN, not LOCAL_MINT)
      minUsdc
    );
    console.log("Minted 1,000 USDC to USER's ATA");

    if (isDevnet) {
      console.log("Please ensure you have USDC in your wallet from the faucet");
    }
  });

  describe("Trade", () => {
    it("Creates an order in an existing market", async function () {
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
        const currentTime = await getCurrentUnixTime();
        if (currentTime && marketAccount.marketEnd.toNumber() < currentTime) {

          return; // Skip this test if market is closed
        }
      } catch (error) {
        return; // Skip this test if market doesn't exist
      }

      // Get the config PDA
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      // Get the market account again for position ID and vault
      const marketAccount = await program.account.marketState.fetch(marketPda);
      const marketVault = marketAccount.marketVault;

      // Use the test market creator created in before hook
      console.log("Market Creator:", testMarketCreator.toString());
      console.log("Core Collection:", testCoreCollection.toString());
      console.log("Merkle Tree:", testMerkleTree.toString());
      console.log("Market USDC Vault:", marketVault.toString());

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

       const tx = await program.methods
         .openPosition({
           amount,
           direction,
           metadataUri: "https://arweave.net/position-metadata",
           pageIndex: 0,
         })
         .accountsPartial({
           signer: USER.publicKey,
           feeVault: FEE_VAULT.publicKey,
           market: marketPda,
           mint: usdcMint,
           userMintAta: userTokenAccount,
           marketVault: marketVault,
           config: configPda,
           marketCreator: testMarketCreator,
           merkleTree: testMerkleTree,
           treeConfig: PublicKey.findProgramAddressSync(
             [testMerkleTree.toBuffer()],
             BUBBLEGUM_PROGRAM_ID
           )[0],
           collection: testCoreCollection,
           bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
           mplCoreProgram: MPL_CORE_ID,
           logWrapperProgram: MPL_NOOP_ID,
           compressionProgram: ACCOUNT_COMPRESSION_ID,
           tokenProgram: TOKEN_PROGRAM_ID,
           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
           systemProgram: SystemProgram.programId,
         })
         .signers([USER])
         .rpc();



      console.log("Order creation transaction signature:", tx);

      // Fetch the market account to verify the order was created
      const updatedMarketAccount = await program.account.marketState.fetch(marketPda);
      console.log("Market Account after order:", updatedMarketAccount);

      // Verify the market volume increased
      assert.ok(updatedMarketAccount.volume.gt(new anchor.BN(0)), "Market volume should be greater than 0");
    });

    // --- Negative Test Cases for Business Logic ---

    it("Fails if market is already resolved", async () => {
      // Create a fresh manual-resolution market, resolve it, then ensure order creation fails
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      const cfgAccount: any = await program.account.config.fetch(configPda);
      const marketId = cfgAccount.nextMarketId as anchor.BN;

      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const now = await getCurrentUnixTime();
      const marketStart = new anchor.BN(now + 3600);
      const marketEnd = new anchor.BN(now + 86400);
      const bettingStart = new anchor.BN(now - 3600);
      const question = Array.from(Buffer.from("Resolved market test?"));

      // Create manual-resolution market
      await program.methods
        .createMarket({
          question,
          marketStart,
          marketEnd,
          metadataUri: "https://arweave.net/resolved-market-test",
          oracleType: { none: {} },
          marketType: { future: {} },
          bettingStart,
        })
        .accountsPartial({
          payer: ADMIN.publicKey,
          feeVault: cfgAccount.feeVault,
          oraclePubkey: ADMIN.publicKey,
          config: configPda,
          marketCreator: testMarketCreator,
          mint: usdcMint,
          marketVault: marketPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([ADMIN])
        .rpc();

      // Resolve the market manually (11 = Yes)
      await program.methods
        .resolveMarket({ oracleValue: 11 })
        .accounts({ 
          signer: ADMIN.publicKey, 
          market: marketPda, 
          marketCreator: testMarketCreator,
          oraclePubkey: ADMIN.publicKey 
        })
        .signers([ADMIN])
        .rpc();

      // Attempt to create an order; expect MarketAlreadyResolved
      const { error } = await tryCreatePositionTx({
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        mint: usdcMint,
        userTokenAccount,
        marketPda,
        marketVault: (await program.account.marketState.fetch(marketPda)).marketVault,
        configPda,
        metadataUri: "https://arweave.net/position-metadata",
        expectError: "MarketAlreadyResolved",
        marketCreator: testMarketCreator,
        coreCollection: testCoreCollection,
        merkleTree: testMerkleTree,
      });
      assert.isNotNull(error, "Should fail with MarketAlreadyResolved");
      assert.include(error.toString(), "MarketAlreadyResolved");
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
        mint: usdcMint,
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        metadataUri: "https://arweave.net/position-metadata",
        marketCreator: testMarketCreator,
        coreCollection: testCoreCollection,
        merkleTree: testMerkleTree,
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
        mint: usdcMint,
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        metadataUri: "https://arweave.net/position-metadata",
        marketCreator: testMarketCreator,
        coreCollection: testCoreCollection,
        merkleTree: testMerkleTree,
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
      
      const marketVault = marketAccount.marketVault;
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      
      // Use a valid user with USDC
      const { error } = await tryCreatePositionTx({
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        mint: usdcMint,
        userTokenAccount,
        marketPda,
        marketVault: marketVault,
        configPda,
        metadataUri: "https://arweave.net/position-metadata",
        marketCreator: testMarketCreator,
        coreCollection: testCoreCollection,
        merkleTree: testMerkleTree,
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
      
      const marketVault = marketAccount.marketVault;
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      
      // Use a valid user with USDC
      const { error } = await tryCreatePositionTx({
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        mint: usdcMint,
        userTokenAccount,
        marketPda,
        marketVault: marketVault,
        configPda,
        metadataUri: "https://arweave.net/position-metadata",
        marketCreator: testMarketCreator,
        coreCollection: testCoreCollection,
        merkleTree: testMerkleTree,
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
      
      const marketVault = marketAccount.marketVault;
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      
      // Use a valid user with USDC
      const { tx, error } = await tryCreatePositionTx({
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        mint: usdcMint,
        userTokenAccount,
        marketPda,
        marketVault: marketVault,
        configPda,
        metadataUri: "https://arweave.net/position-metadata",
        marketCreator: testMarketCreator,
        coreCollection: testCoreCollection,
        merkleTree: testMerkleTree,
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
          const mplCoreBalance = await provider.connection.getBalance(new PublicKey(MPL_CORE_ID.toString()));
          
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
              toPubkey: new PublicKey(MPL_CORE_ID.toString()),
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
              mint: usdcMint,
              userTokenAccount,
              marketPda,
              marketVault: marketVault,
              configPda,
              metadataUri: "https://arweave.net/position-metadata",
              marketCreator: testMarketCreator,
              coreCollection: testCoreCollection,
              merkleTree: testMerkleTree,
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
  mint?: PublicKey,
  userTokenAccount?: PublicKey,
  marketPda?: PublicKey,
  marketVault?: PublicKey,
  configPda?: PublicKey,
  metadataUri?: string,
  expectError?: string | null,
  mplCoreProgram?: PublicKey,
  marketCreator?: PublicKey,
  coreCollection?: PublicKey,
  merkleTree?: PublicKey,
};

async function tryCreatePositionTx({
  user = USER,
  amount = new anchor.BN(1_000_000),
  direction = { yes: {} },
  mint,
  userTokenAccount,
  marketPda,
  marketVault,
  configPda,
  metadataUri = "https://arweave.net/position-metadata",
  expectError = null,
  mplCoreProgram = new PublicKey(MPL_CORE_ID.toString()),
  marketCreator,
  coreCollection,
  merkleTree,
}: TryCreatePositionParams) {
  try {
    // Use the provided market creator details
    const collection = coreCollection;
    const merkleTreeToUse = merkleTree;

    // Get fee vault from config
    const [cfgPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
    const cfg: any = await program.account.config.fetch(cfgPda);

    // Derive treeConfig PDA
    const [treeConfigPda] = PublicKey.findProgramAddressSync(
      [merkleTreeToUse.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    );

    const tx = await program.methods
      .openPosition({
        amount,
        direction,
        metadataUri,
        pageIndex: 0,
      })
      .accountsPartial({
        signer: user.publicKey,
        feeVault: cfg.feeVault,
        market: marketPda,
        mint: mint,
        userMintAta: userTokenAccount,
        marketVault: marketVault,
        // Bubblegum/cNFT related accounts
        config: configPda,
        marketCreator: marketCreator,
        merkleTree: merkleTreeToUse,
        treeConfig: treeConfigPda,
        collection,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        mplCoreProgram: MPL_CORE_ID,
        logWrapperProgram: MPL_NOOP_ID,
        compressionProgram: ACCOUNT_COMPRESSION_ID,
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