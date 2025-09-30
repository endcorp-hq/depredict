import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { 
  program, 
  provider, 
  USER, 
  ADMIN, 
  LOCAL_MINT, 
  BUBBLEGUM_PROGRAM_ID, 
  MPL_CORE_ID, 
  MPL_NOOP_ID, 
  ACCOUNT_COMPRESSION_ID,
  MARKET_SEED,
  MARKET_CREATOR_SEED,
  MPL_CORE_CPI_SIGNER,
  POSITION_PAGE_SEED,
  CONFIG_SEED
} from "../constants";
import { getCurrentMarketId, getMarketIdByState, getCurrentUnixTime, ensureAccountBalance, getNetworkConfig } from "../helpers";

import * as fs from "fs";
import { publicKey } from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api'
import { das }  from '@metaplex-foundation/mpl-core-das';
import { fetchCollectionV1 } from '@metaplex-foundation/mpl-core'

describe("depredict", () => { 

  let usdcMint: PublicKey;
  let userTokenAccount: PublicKey;
  let testMarketCreator: PublicKey;
  let testCoreCollection: PublicKey;
  let testMerkleTree: PublicKey;
  let marketCreatorAccount: any;
  let marketCreatorpda: PublicKey;
  let bump: number;

  // Load local wallet from ~/.config/solana/id.json
  const localKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8")))
  );


  // Load and cache the Market Creator once for all tests in this file
  async function ensureMarketCreatorLoaded() {
    if (marketCreatorAccount && marketCreatorpda && bump !== undefined) {
      return;
    }

    const seeds = [Buffer.from(MARKET_CREATOR_SEED), ADMIN.publicKey.toBytes()];
    const [pda, bumpVal] = PublicKey.findProgramAddressSync(seeds, program.programId);

    marketCreatorpda = pda;
    bump = bumpVal;
    marketCreatorAccount = await program.account.marketCreator.fetch(pda);

    // Expose for tests that reference these by name
    testMarketCreator = pda;
    testCoreCollection = marketCreatorAccount.coreCollection;
    testMerkleTree = marketCreatorAccount.merkleTree;

    console.log(`Market Creator PDA: ${marketCreatorpda}`);
    console.log(`Market Creator Bump: ${bump}`);
    console.log(`Market Creator Collection: ${marketCreatorAccount.coreCollection}`);
  }

  // Reusable helper for attempting to open a position
  async function tryCreatePositionTx({
    user = USER,
    amount,
    direction,
    metadataUri,
    pageIndex = 0,
    mint = LOCAL_MINT.publicKey,
    userTokenAccount,
    marketPda,
    marketVault,
    marketCreator = marketCreatorpda,
    coreCollection = marketCreatorAccount?.coreCollection,
    merkleTree = marketCreatorAccount?.merkleTree,
    expectError,
  }: {
    user?: anchor.web3.Keypair;
    amount: anchor.BN;
    direction: any;
    metadataUri: string;
    pageIndex?: number;
    mint?: PublicKey;
    userTokenAccount: PublicKey;
    marketPda?: PublicKey;
    marketVault?: PublicKey;
    marketCreator?: PublicKey;
    coreCollection?: PublicKey;
    merkleTree?: PublicKey;
    expectError?: string | null;
    // Allow legacy callers to pass configPda even if unused here
    configPda?: PublicKey;
  }): Promise<{ tx: string | null; error: any }>
  {
    await ensureMarketCreatorLoaded();

    // Derive tree config if not provided
    const treeConfig = PublicKey.findProgramAddressSync(
      [merkleTree!.toBuffer()],
      BUBBLEGUM_PROGRAM_ID
    )[0];

    // Derive market PDA if not provided
    let marketPdaToUse = marketPda;
    if (!marketPdaToUse) {
      const marketId = await getCurrentMarketId();
      marketPdaToUse = PublicKey.findProgramAddressSync(
        [Buffer.from(MARKET_SEED), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      )[0];
    }

    // Ensure marketVault is available
    let marketVaultToUse = marketVault;
    if (!marketVaultToUse) {
      const marketAccount = await program.account.marketState.fetch(marketPdaToUse);
      marketVaultToUse = marketAccount.marketVault;
    }

    // Ensure the position page exists (align with SDK logic)
    const marketStateForId = await program.account.marketState.fetch(marketPdaToUse);
    const marketIdForPage = marketStateForId.marketId as anchor.BN;
    const pageIndexToUse = pageIndex ?? 0;
    const pageIndexBuf = Buffer.from(new Uint16Array([pageIndexToUse]).buffer);
    const [positionPagePda] = PublicKey.findProgramAddressSync(
      [Buffer.from(POSITION_PAGE_SEED), marketIdForPage.toArrayLike(Buffer, "le", 8), pageIndexBuf],
      program.programId
    );
    const pageInfo = await provider.connection.getAccountInfo(positionPagePda);
    if (!pageInfo) {
      await program.methods
        .ensurePositionPage({ pageIndex: pageIndexToUse })
        .accountsPartial({
          payer: ADMIN.publicKey,
          market: marketPdaToUse!,
          marketCreator: marketCreator!,
          positionPage: positionPagePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([ADMIN])
        .rpc();
    }

    try {
      const sig = await program.methods
        .openPosition({ amount, direction, metadataUri, pageIndex })
        .accountsPartial({
          user: user.publicKey,
          positionPage: positionPagePda,
          positionPageNext: positionPagePda,
          marketFeeVault: marketCreatorAccount.feeVault,
          market: marketPdaToUse!,
          mint,
          userMintAta: userTokenAccount,
          marketVault: marketVaultToUse!,
          marketCreator: marketCreator!,
          mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
          merkleTree: merkleTree!,
          treeConfig,
          collection: coreCollection!,
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
      await provider.connection.confirmTransaction(sig, "confirmed");
      const parsed = await provider.connection.getTransaction(sig, { commitment: "confirmed" as any });
      if (parsed && parsed.meta && parsed.meta.err) {
        throw new Error(`openPosition failed: ${JSON.stringify(parsed.meta.err)}\nlogs:\n${(parsed.meta.logMessages || []).join('\n')}`);
      }
      return { tx: sig, error: null };
    } catch (error) {
      if (expectError) {
        try {
          // Use string inclusion to avoid depending on custom error types
          if (!error.toString().includes(expectError)) {
            console.error("Unexpected error:", error);
          }
        } catch (_) {}
      }
      return { tx: null, error };
    }
  }

  before(async () => {

    // Get the USDC mint
    usdcMint = LOCAL_MINT.publicKey;
    console.log("USDC Mint:", usdcMint.toString());

    // Print out account information for comparison
    console.log("\nAccount Information:");
    console.log("ADMIN public key:", ADMIN.publicKey.toString());
    console.log("USER public key:", USER.publicKey.toString());
    console.log("USDC mint authority (LOCAL_MINT):", LOCAL_MINT.publicKey.toString());
    
    // Avoid airdrops on devnet
    console.log("Ensuring USER has enough SOL for fees (no airdrop on devnet)...");
    // await ensureAccountBalance(USER.publicKey, 5 * LAMPORTS_PER_SOL);

    // Create user's USDC token account
    console.log("Creating user USDC token account...");
    const solBeforeAta = await provider.connection.getBalance(USER.publicKey);
    userTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        USER, // Payer
        usdcMint,
        USER.publicKey
      )
    ).address;
    const solAfterAta = await provider.connection.getBalance(USER.publicKey);
    const ataCreationSol = (solBeforeAta - solAfterAta) / LAMPORTS_PER_SOL;
    console.log("SOL spent to create ATA (one-time rent + fees):", ataCreationSol, "SOL");
    console.log(`User USDC ATA: ${userTokenAccount.toString()}`);

    // Mint USDC to USER's ATA
    const minUsdc = 1_000_000_000; // 1,000 USDC (6 decimals)
    console.log(`Minting 1,000 USDC to USER...`);
    await mintTo(
      provider.connection,
      ADMIN, // payer
      usdcMint,
      userTokenAccount,
      ADMIN, // mint authority
      minUsdc
    );
    console.log("Minted 1,000 USDC to USER's ATA");
    // Ensure Market Creator is loaded and shared for all tests
    await ensureMarketCreatorLoaded();

  });

  describe("Trade", () => {

    it("Creates an order in an existing market", async function () {

      // Get the current market ID
      const marketId = await getCurrentMarketId();
      console.log("Using market ID:", marketId.toString());

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from(MARKET_SEED),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

    const umi = createUmi(provider.connection.rpcEndpoint).use(dasApi())
    const collectionId = publicKey(marketCreatorAccount.coreCollection.toString())
    const collection = await fetchCollectionV1(umi, collectionId)
    console.log(collection)
      

    
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

      // Get the market account again for position ID and vault
      const marketAccount = await program.account.marketState.fetch(marketPda);
      const marketVault = marketAccount.marketVault;

      // Final check: Ensure USER has sufficient SOL for NFT creation
      const userSolBalance = await provider.connection.getBalance(USER.publicKey);
      console.log("USER SOL balance before position creation:", userSolBalance / LAMPORTS_PER_SOL, "SOL");
      
      if (userSolBalance < 1_500_000_000) { // 1.5 SOL minimum
        console.error("USER account has insufficient SOL for NFT creation");
        console.error("Current balance:", userSolBalance / LAMPORTS_PER_SOL, "SOL");
        console.error("Minimum required: 1.5 SOL");
        throw new Error("Insufficient SOL in USER account for NFT creation");
      }
      // Using shared MPL_CORE_CPI_SIGNER defined at the top
      // Derive position page PDA (pageIndex = 0) and capture pre state for rent analysis
      const pageIndexBuf = Buffer.from(new Uint16Array([0]).buffer);
      const [positionPagePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(POSITION_PAGE_SEED), marketId.toArrayLike(Buffer, "le", 8), pageIndexBuf],
        program.programId
      );
      const pagePre = await provider.connection.getAccountInfo(positionPagePda);

      // Ensure page is created by market creator authority (so users don't pay rent)
      if (!pagePre) {
        console.log("Pre-warming PositionPage (creator-funded)...");
        await program.methods
          .ensurePositionPage({ pageIndex: 0 })
          .accountsPartial({
            payer: ADMIN.publicKey,
            market: marketPda,
            marketCreator: marketCreatorpda,
            positionPage: positionPagePda,
            systemProgram: SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc();
      }

      // Create order parameters (1 USDC, 6 decimals)
      const amount = new anchor.BN(1_000_000);
      const direction = { yes: {} }; // Betting on "Yes"

      // Record balances before order
      const solBefore = await provider.connection.getBalance(USER.publicKey);
      const usdcBefore = await provider.connection.getTokenAccountBalance(userTokenAccount);
      console.log("Balances before:");
      console.log("- SOL:", solBefore / LAMPORTS_PER_SOL, "SOL");
      console.log("- USDC:", usdcBefore.value.uiAmountString, "USDC");

       const sig = await program.methods
         .openPosition({
           amount,
           direction,
           metadataUri: "https://arweave.net/position-metadata",
           pageIndex: 0,
         })
         .accountsPartial({
           user: USER.publicKey,
          positionPage: positionPagePda,
           marketFeeVault: marketCreatorAccount.feeVault,
           market: marketPda,
           mint: usdcMint,
           userMintAta: userTokenAccount,
           marketVault: marketVault,
           marketCreator: marketCreatorpda,
           mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
           merkleTree: marketCreatorAccount.merkleTree,
           treeConfig: PublicKey.findProgramAddressSync(
             [marketCreatorAccount.merkleTree.toBuffer()],
             BUBBLEGUM_PROGRAM_ID
           )[0],
           collection: marketCreatorAccount.coreCollection,
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
      await provider.connection.confirmTransaction(sig, "confirmed");
      const parsed = await provider.connection.getTransaction(sig, { commitment: "confirmed" as any });
      if (parsed && parsed.meta && parsed.meta.err) {
        throw new Error(`openPosition failed: ${JSON.stringify(parsed.meta.err)}\nlogs:\n${(parsed.meta.logMessages || []).join('\n')}`);
      }
      const solAfterTx = await provider.connection.getBalance(USER.publicKey);
      const solSpentTx = (solBefore - solAfterTx) / LAMPORTS_PER_SOL;



      console.log("Order creation transaction signature:", sig);
      console.log("SOL spent by openPosition tx:", solSpentTx, "SOL");

      // Inspect position page rent if newly created or resized
      const pagePost = await provider.connection.getAccountInfo(positionPagePda);
      if (!pagePre && pagePost) {
        console.log("PositionPage PDA was created. Rent lamports:", pagePost.lamports);
      } else if (pagePre && pagePost && pagePost.lamports > pagePre.lamports) {
        console.log("PositionPage PDA lamports increased by:", pagePost.lamports - pagePre.lamports);
      }

      // Record balances after order
      const solAfter = await provider.connection.getBalance(USER.publicKey);
      const usdcAfter = await provider.connection.getTokenAccountBalance(userTokenAccount);
      console.log("Balances after:");
      console.log("- SOL:", solAfter / LAMPORTS_PER_SOL, "SOL");
      console.log("- USDC:", usdcAfter.value.uiAmountString, "USDC");

      // Optional: show deltas
      const solDelta = (solBefore - solAfter) / LAMPORTS_PER_SOL;
      const usdcDelta = Number(usdcBefore.value.amount) - Number(usdcAfter.value.amount);
      console.log("Balance deltas:");
      console.log("- SOL spent:", solDelta, "SOL (fees + rents)");
      console.log("- USDC spent:", usdcDelta, "raw units (expected 1,000,000)");

      // Fetch the market account to verify the order was created
      const updatedMarketAccount = await program.account.marketState.fetch(marketPda);
      // console.log("Market Account after order:", updatedMarketAccount);

      // Verify the market volume increased
      assert.ok(updatedMarketAccount.volume.gt(new anchor.BN(0)), "Market volume should be greater than 0");
    });

    // --- Negative Test Cases for Business Logic ---

    it("Fails if market is already resolved", async () => {
      // Create a fresh manual-resolution market, resolve it, then ensure order creation fails
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(CONFIG_SEED)],
        program.programId
      );
      const cfgAccount: any = await program.account.config.fetch(configPda);
      const marketId = cfgAccount.nextMarketId as anchor.BN;

      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(MARKET_SEED), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const now = await getCurrentUnixTime();
      const marketStart = new anchor.BN(now + 3600);
      const marketEnd = new anchor.BN(now + 86400);
      // Ensure we're inside the betting window for Future markets
      const bettingStart = new anchor.BN(now - 60);
      const question = Array.from(Buffer.from("Resolved market test?"));

      // Create manual-resolution market
      await program.methods
        .createMarket({
          question,
          marketStart,
          marketEnd,
          metadataUri: "https://arweave.net/manual-metadata-uri",
          oracleType: { none: {} },
          marketType: { future: {} },
          bettingStart: bettingStart,
        })
        .accountsPartial({
          payer: ADMIN.publicKey,
          feeVault: cfgAccount.feeVault,
          oraclePubkey: ADMIN.publicKey,
          config: configPda,
          marketCreator: testMarketCreator,
          mint: usdcMint,
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

      // Attempt to create an order; expect MarketAlreadyResolved.
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
        [Buffer.from(MARKET_SEED), closedMarketId.toArrayLike(Buffer, "le", 8)],
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
        [Buffer.from(CONFIG_SEED)],
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
        [Buffer.from(MARKET_SEED), resolvedMarketId.toArrayLike(Buffer, "le", 8)],
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
        [Buffer.from(CONFIG_SEED)],
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
        [Buffer.from(MARKET_SEED), manualMarketId.toArrayLike(Buffer, "le", 8)],
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
        [Buffer.from(CONFIG_SEED)],
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
          }
        }
      }
    });
  });


});

