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
  FEE_VAULT
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

  const MARKET_CREATOR_SEED = "market_creator";
  // Shared signer used when CPI-ing into MPL Core
  const mplCoreCpiSigner = new PublicKey("CbNY3JiXdXNE9tPNEk1aRZVEkWdj2v7kfJLNQwZZgpXk");

  // Load local wallet from ~/.config/solana/id.json
  const localKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8")))
  );

  let marketCreatorAccount: any;
  let marketCreatorpda: PublicKey;
  let bump: number;

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
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
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
      [Buffer.from("pos_page"), marketIdForPage.toArrayLike(Buffer, "le", 8), pageIndexBuf],
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
          mplCoreCpiSigner: mplCoreCpiSigner,
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
          Buffer.from("market"),
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
      // Using shared mplCoreCpiSigner defined at the top
      // Find first available position page with a free slot; create pages on-demand
      const derivePagePda = (idx: number) => {
        const pageIndexBuf = Buffer.from(new Uint16Array([idx]).buffer);
        return PublicKey.findProgramAddressSync(
          [Buffer.from("pos_page"), marketId.toArrayLike(Buffer, "le", 8), pageIndexBuf],
          program.programId
        )[0];
      };

      async function ensurePage(idx: number): Promise<void> {
        const pda = derivePagePda(idx);
        const info = await provider.connection.getAccountInfo(pda);
        if (!info) {
          await program.methods
            .ensurePositionPage({ pageIndex: idx })
            .accountsPartial({
              payer: ADMIN.publicKey,
              market: marketPda,
              marketCreator: marketCreatorpda,
              positionPage: pda,
              systemProgram: SystemProgram.programId,
            })
            .signers([ADMIN])
            .rpc();
        }
      }

      // Determine page capacity and available page
      let pageIndex = 0;
      await ensurePage(pageIndex);
      let positionPagePda = derivePagePda(pageIndex);
      let pagePre = await provider.connection.getAccountInfo(positionPagePda);
      let capacity = 0;
      try {
        const firstPage = await program.account.positionPage.fetch(positionPagePda);
        capacity = (firstPage.entries || []).length;
        // If full, advance until a page has room
        while (firstPage.count >= capacity) {
          pageIndex += 1;
          await ensurePage(pageIndex);
          positionPagePda = derivePagePda(pageIndex);
          pagePre = await provider.connection.getAccountInfo(positionPagePda);
          const p = await program.account.positionPage.fetch(positionPagePda);
          capacity = (p.entries || []).length;
          if (p.count < capacity) break;
        }
      } catch (_) {
        // If fetch failed, ensure page and continue
        await ensurePage(pageIndex);
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
           pageIndex,
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
           mplCoreCpiSigner: mplCoreCpiSigner,
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

    it("Creates 20 positions and auto-increments pages when full", async function () {
      // Resolve market ID and PDA
      const marketId = await getCurrentMarketId();
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Preload market and shared fields
      const marketAccount = await program.account.marketState.fetch(marketPda);
      const marketVault = marketAccount.marketVault;

      // Helper to derive a position page PDA
      const derivePagePda = (idx: number) => {
        const pageIndexBuf = Buffer.from(new Uint16Array([idx]).buffer);
        return PublicKey.findProgramAddressSync(
          [Buffer.from("pos_page"), marketId.toArrayLike(Buffer, "le", 8), pageIndexBuf],
          program.programId
        )[0];
      };

      // Ensure a page exists (creator-funded)
      async function ensurePage(idx: number): Promise<void> {
        const pda = derivePagePda(idx);
        const info = await provider.connection.getAccountInfo(pda);
        if (!info) {
          await program.methods
            .ensurePositionPage({ pageIndex: idx })
            .accountsPartial({
              payer: ADMIN.publicKey,
              market: marketPda,
              marketCreator: marketCreatorpda,
              positionPage: pda,
              systemProgram: SystemProgram.programId,
            })
            .signers([ADMIN])
            .rpc();
        }
      }

      // Determine page capacity from the first page's entries length
      let pageIndex = 0;
      await ensurePage(pageIndex);
      let firstPage = await program.account.positionPage.fetch(derivePagePda(pageIndex));
      const pageCapacity = (firstPage.entries || []).length;

      // Create 20 positions, rolling over to new pages as needed
      const totalToCreate = 20;
      let created = 0;
      while (created < totalToCreate) {
        // Make sure current page exists and is not full
        try {
          const pageAccount = await program.account.positionPage.fetch(derivePagePda(pageIndex));
          if (pageAccount.count >= pageCapacity) {
            pageIndex += 1;
            await ensurePage(pageIndex);
            continue;
          }
        } catch (_) {
          await ensurePage(pageIndex);
        }

        // Attempt to create a position on the current page
        const amount = new anchor.BN(1_000_000); // 1 USDC
        const direction = { yes: {} };

        const { tx, error } = await tryCreatePositionTx({
          user: USER,
          amount,
          direction,
          metadataUri: "https://arweave.net/position-metadata",
          pageIndex,
          mint: usdcMint,
          userTokenAccount,
          marketPda,
          marketVault,
          marketCreator: marketCreatorpda,
          coreCollection: marketCreatorAccount.coreCollection,
          merkleTree: marketCreatorAccount.merkleTree,
        });

        if (error) {
          // If page is full, advance and retry; otherwise surface error
          const msg = error?.toString?.() || "";
          if (msg.includes("NoAvailablePositionSlot") || msg.includes("PositionPageNotEmpty")) {
            pageIndex += 1;
            await ensurePage(pageIndex);
            continue;
          }
          throw error;
        }
        created += 1;
      }

      // Validate total positions across pages >= 20
      let totalCount = 0;
      for (let i = 0; i <= pageIndex; i++) {
        try {
          const page = await program.account.positionPage.fetch(derivePagePda(i));
          totalCount += Number(page.count);
        } catch (_) {}
      }
      assert.isAtLeast(totalCount, totalToCreate, "Total positions across pages should be >= created count");

      // Count by direction across pages (filtering out empty default entries)
      let yesCount = 0;
      let noCount = 0;
      const DEFAULT_PK = "11111111111111111111111111111111";
      for (let i = 0; i <= pageIndex; i++) {
        try {
          const page = await program.account.positionPage.fetch(derivePagePda(i));
          for (const entry of page.entries || []) {
            const assetIdStr = entry.assetId?.toBase58?.() || DEFAULT_PK;
            if (assetIdStr !== DEFAULT_PK) {
              if (entry.direction && ("yes" in entry.direction)) yesCount += 1;
              else if (entry.direction && ("no" in entry.direction)) noCount += 1;
            }
          }
        } catch (_) {}
      }
      console.log(`Positions summary - YES: ${yesCount}, NO: ${noCount}, TOTAL: ${yesCount + noCount}`);
      assert.isAtLeast(yesCount + noCount, totalToCreate, "All created positions should exist across pages");
    });
    
    it("Fails to create a position in page 0 when it is full", async function () {
      // Resolve market ID and PDA
      const marketId = await getCurrentMarketId();
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Preload market vault
      const marketAccount = await program.account.marketState.fetch(marketPda);
      const marketVault = marketAccount.marketVault;

      // Page 0 helpers
      const pageIndex = 0;
      const pageIndexBuf = Buffer.from(new Uint16Array([pageIndex]).buffer);
      const positionPage0Pda = PublicKey.findProgramAddressSync(
        [Buffer.from("pos_page"), marketId.toArrayLike(Buffer, "le", 8), pageIndexBuf],
        program.programId
      )[0];

      // Ensure page 0 exists
      const info = await provider.connection.getAccountInfo(positionPage0Pda);
      if (!info) {
        await program.methods
          .ensurePositionPage({ pageIndex })
          .accountsPartial({
            payer: ADMIN.publicKey,
            market: marketPda,
            marketCreator: marketCreatorpda,
            positionPage: positionPage0Pda,
            systemProgram: SystemProgram.programId,
          })
          .signers([ADMIN])
          .rpc();
      }

      // Fill page 0 if not already full
      let page0 = await program.account.positionPage.fetch(positionPage0Pda);
      const capacity = (page0.entries || []).length;
      while (Number(page0.count) < capacity) {
        const { error } = await tryCreatePositionTx({
          user: USER,
          amount: new anchor.BN(1_000_000),
          direction: { yes: {} },
          metadataUri: "https://arweave.net/position-metadata",
          pageIndex,
          mint: usdcMint,
          userTokenAccount,
          marketPda,
          marketVault,
          marketCreator: marketCreatorpda,
          coreCollection: marketCreatorAccount.coreCollection,
          merkleTree: marketCreatorAccount.merkleTree,
        });
        if (error) {
          // If we hit slot exhaustion during filling, break
          if (error.toString().includes("NoAvailablePositionSlot")) break;
          throw error;
        }
        page0 = await program.account.positionPage.fetch(positionPage0Pda);
      }

      // Now attempt one more on page 0 and assert failure
      const { error: finalError } = await tryCreatePositionTx({
        user: USER,
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        metadataUri: "https://arweave.net/position-metadata",
        pageIndex,
        mint: usdcMint,
        userTokenAccount,
        marketPda,
        marketVault,
        marketCreator: marketCreatorpda,
        coreCollection: marketCreatorAccount.coreCollection,
        merkleTree: marketCreatorAccount.merkleTree,
        expectError: "NoAvailablePositionSlot",
      });
      assert.isNotNull(finalError, "Expected failure when page 0 is full");
      assert.include(finalError.toString(), "NoAvailablePositionSlot");
    });
  
  
  });
});

