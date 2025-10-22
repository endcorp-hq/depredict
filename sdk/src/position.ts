import { Program } from "@coral-xyz/anchor";
import { Depredict } from "./types/depredict.js";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

import { getMarketPDA, getPositionPagePDA } from "./utils/pda/index.js";
export interface PositionPageInfo {
  pageIndex: number;
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
  isFull: boolean;
  prewarmNext: boolean;
  exists: boolean;
}

export interface AvailablePageResult {
  pageIndex: number;
  instructions: TransactionInstruction[];
}

export default class Position {
  constructor(private program: Program<Depredict>) {}

  /**
   * Get position account data by assetId
   * @param marketId - Market ID
   * @param assetId - Asset ID to search for
   * @returns Position account data or null if not found
   */
  async getAccountByAssetAndMarket(marketId: number, assetId: PublicKey) {
    const pages = await this.getAllPositionPagesForMarket(marketId);

    for (const page of pages) {
      try {
        const positionPagePDA = getPositionPagePDA(
          this.program.programId,
          marketId,
          page.pageIndex
        );
        const pageAccount = await this.program.account.positionPage.fetch(
          positionPagePDA
        );

        // Search through all slots in this page
        for (
          let slotIndex = 0;
          slotIndex < pageAccount.entries.length;
          slotIndex++
        ) {
          const entry = pageAccount.entries[slotIndex];
          if (entry.assetId.equals(assetId)) {
            return {
              pageIndex: page.pageIndex,
              slotIndex,
              entry,
              positionPagePDA,
            };
          }
        }
      } catch (error) {
        // Continue to next page if this one fails
        continue;
      }
    }

    return null; // Position not found
  }

  /**
   * Ensure a position page exists (and initialize header if needed)
   * @param marketId - Market ID
   * @param payer - Payer public key
   * @param pageIndex - Page index
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
   */
  async ensurePositionPage({
    marketId,
    payer,
    pageIndex,
  }: {
    marketId: number;
    payer: PublicKey;
    pageIndex: number;
  }) {
    const ixs: TransactionInstruction[] = [];
    const market = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(market);
    const marketCreator = marketAccount.marketCreator as PublicKey;
    const positionPage = getPositionPagePDA(
      this.program.programId,
      marketId,
      pageIndex
    );

    ixs.push(
      await this.program.methods
        .ensurePositionPage({ pageIndex })
        .accountsPartial({
          payer,
          market,
          marketCreator,
          positionPage,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
  }

  /**
   * Prune a position slot (creator only)
   * @param marketId - Market ID
   * @param signer - Signer public key
   * @param pageIndex - Page index
   * @param slotIndex - Slot index
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
   */
  async prunePosition({
    marketId,
    signer,
    pageIndex,
    slotIndex,
  }: {
    marketId: number;
    signer: PublicKey;
    pageIndex: number;
    slotIndex: number;
  }) {
    const ixs: TransactionInstruction[] = [];
    const market = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(market);
    const marketCreator = marketAccount.marketCreator as PublicKey;
    const positionPage = getPositionPagePDA(
      this.program.programId,
      marketId,
      pageIndex
    );

    ixs.push(
      await this.program.methods
        .prunePosition({ pageIndex, slotIndex })
        .accountsPartial({
          signer,
          market,
          marketCreator,
          positionPage,
        })
        .instruction()
    );
    return ixs;
  }

  /**
   * Close an empty position page (creator only)
   * @param marketId - Market ID
   * @param signer - Signer public key
   * @param pageIndex - Page index
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
   */
  async closePositionPage({
    marketId,
    signer,
    pageIndex,
  }: {
    marketId: number;
    signer: PublicKey;
    pageIndex: number;
  }) {
    const ixs: TransactionInstruction[] = [];
    const market = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(market);
    const marketCreator = marketAccount.marketCreator as PublicKey;
    const positionPage = getPositionPagePDA(
      this.program.programId,
      marketId,
      pageIndex
    );

    ixs.push(
      await this.program.methods
        .closePositionPage({ pageIndex })
        .accountsPartial({
          signer,
          market,
          marketCreator,
          positionPage,
        })
        .instruction()
    );
    return ixs;
  }

  /**
   * Get all Positions for a user
   * @param user - User PublicKey
   *
   */
  // async getPositionsForUser(user: PublicKey) {
  //   // Then try the filtered query
  //   const allAccounts = await this.program.account.positionAccount.all();

  //   const formattedPositionAccounts = allAccounts.map(({ account }) =>
  //     formatPositionAccount(account)
  //   );

  //   const positions = formattedPositionAccounts.flatMap(
  //     (positionAccount) => positionAccount.positions
  //   );

  //   const userPositions = positions.filter(
  //     (position) => position.authority === user.toBase58()
  //   );

  //   return userPositions;
  // }

  /**
   * Get User positions for a particular market
   * @param user - User PublicKey
   * @param marketId - Market ID
   */
  // async getUserPositionsForMarket(user: PublicKey, marketId: number) {
  //   const positionAccounts = await this.getPositionsAccountsForMarket(marketId);

  //   const positions = positionAccounts.flatMap(
  //     (positionAccount) => positionAccount.positions
  //   );

  //   return positions.filter(
  //     (position) => position.authority === user.toBase58()
  //   );
  // }

  // Legacy positionAccount flows have been removed in favor of paged position accounts.

  /**
   * Create Sub positions account
   * @param user - User PublicKey the main user
   * @param payer - Payer PublicKey
   * @param options - RPC options
   *
   */
  // createSubPositionAccount removed (no longer applicable)

  /**
   * Get position account Nonce With Slots
   * @param positionAccounts - Position Accounts
   *
   */
  // getPositionAccountNonceWithSlots removed (no longer applicable)

  // getPositionAccountIxs removed (no longer applicable)

  // async mintExistingPosition(
  //   marketId: number,
  //   positionId: number,
  //   positionNonce: number,
  //   payer: PublicKey,
  //   metadataUri: string,
  //   collectionAuthority: PublicKey,
  //   options?: RpcOptions
  // ) {
  //   const ixs: TransactionInstruction[] = [];

  //   const marketPDA = getMarketPDA(this.program.programId, marketId);

  //   let positionAccountPDA = getPositionAccountPDA(
  //     this.program.programId,
  //     marketId
  //   );

  //   if (positionNonce !== 0) {
  //     const subPositionAccountPDA = getSubPositionAccountPDA(
  //       this.program.programId,
  //       marketId,
  //       marketPDA,
  //       positionNonce
  //     );

  //     positionAccountPDA = getPositionAccountPDA(
  //       this.program.programId,
  //       marketId,
  //       subPositionAccountPDA
  //     );
  //   }

  //   const marketAccount = await this.program.account.marketState.fetch(
  //     marketPDA
  //   );

  //   const nftMintKeypair = Keypair.generate();

  //   // Get the NFT metadata PDA
  //   const nftMetadataPda = getNftMetadataPDA(
  //     nftMintKeypair.publicKey,
  //     this.METAPLEX_PROGRAM_ID
  //   );

  //   // Get the NFT master edition PDA
  //   const nftMasterEditionPda = getNftMasterEditionPDA(
  //     nftMintKeypair.publicKey,
  //     this.METAPLEX_PROGRAM_ID
  //   );

  //   // Create the user's NFT token account using ATA program
  //   const nftTokenAccount = getAssociatedTokenAddressSync(
  //     nftMintKeypair.publicKey,
  //     payer, // Create token account for admin since they own the position
  //     false, // allowOwnerOffCurve
  //     TOKEN_PROGRAM_ID
  //   );

  //   if (
  //     !marketAccount.nftCollectionMint ||
  //     !marketAccount.nftCollectionMetadata ||
  //     !marketAccount.nftCollectionMasterEdition
  //   ) {
  //     throw new Error(
  //       "Market account does not have a collection mint, metadata, or master edition"
  //     );
  //   }

  //   try {
  //     ixs.push(
  //       await this.program.methods
  //         .mintPosition({
  //           positionId: new BN(positionId),
  //           metadataUri: metadataUri,
  //         })
  //         .accountsPartial({
  //           signer: payer,
  //           market: marketPDA,
  //           marketPositionsAccount: positionAccountPDA,
  //           nftMint: nftMintKeypair.publicKey,
  //           nftTokenAccount: nftTokenAccount,
  //           metadataAccount: nftMetadataPda,
  //           masterEdition: nftMasterEditionPda,
  //           collectionMint: marketAccount.nftCollectionMint,
  //           collectionMetadata: marketAccount.nftCollectionMetadata,
  //           collectionMasterEdition: marketAccount.nftCollectionMasterEdition,
  //           collectionAuthority: collectionAuthority, //needs to be the same as market creator and needs to sign.
  //           tokenProgram: TOKEN_PROGRAM_ID,
  //           tokenMetadataProgram: this.METAPLEX_PROGRAM_ID,
  //           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //           systemProgram: SystemProgram.programId,
  //           sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
  //         })
  //         .instruction()
  //     );

  //     const tx = await createVersionedTransaction(
  //       this.program,
  //       ixs,
  //       payer,
  //       options
  //     );
  //     tx.sign([nftMintKeypair]);
  //     return tx;
  //   } catch (error) {
  //     console.log("error", error);
  //     throw error;
  //   }
  // }

  /**
   * Find a page with available slots for a specific market
   * @param marketId - Market ID
   * @param payer - Payer public key
   * @returns {Promise<AvailablePageResult>} - Page info and instructions
   */
  async findAvailablePageForMarket(
    marketId: number,
    payer: PublicKey
  ): Promise<AvailablePageResult> {
    const instructions: TransactionInstruction[] = [];

    // Get all pages for THIS market only (much faster)
    const pages = await this.getAllPositionPagesForMarket(marketId);

    // Find the page with the MOST available slots
    let targetPageIndex = -1;
    let maxAvailableSlots = 0;

    for (const page of pages) {
      if (page.availableSlots > maxAvailableSlots) {
        targetPageIndex = page.pageIndex;
        maxAvailableSlots = page.availableSlots;
      }
    }

    // If no page with slots found, create a new one
    if (targetPageIndex === -1) {
      // Find the next page index to create
      const maxExistingPage =
        pages.length > 0 ? Math.max(...pages.map((p) => p.pageIndex)) : -1;
      targetPageIndex = maxExistingPage + 1;

      // Create the new page
      const ensureInstructions = await this.ensurePositionPage({
        marketId,
        payer,
        pageIndex: targetPageIndex,
      });
      instructions.push(...ensureInstructions);
    }

    // Only create next page if current page has < 2 slots
    let needsNextPage = false;
    if (maxAvailableSlots < 2) {
      needsNextPage = true;
    }

    // Create the next page if needed (pre-warming strategy)
    if (needsNextPage) {
      // Find the highest existing page index to determine next page
      const maxExistingPage =
        pages.length > 0 ? Math.max(...pages.map((p) => p.pageIndex)) : -1;
      const nextPageIndex = maxExistingPage + 1;
      const nextPageExists = pages.some((p) => p.pageIndex === nextPageIndex);

      if (!nextPageExists) {
        const ensureNextInstructions = await this.ensurePositionPage({
          marketId,
          payer,
          pageIndex: nextPageIndex,
        });
        instructions.push(...ensureNextInstructions);
      }
    }

    return {
      pageIndex: targetPageIndex,
      instructions,
    };
  }

  /**
   * Get all position pages for a specific market
   * @param marketId - Market ID
   * @returns {Promise<PositionPageInfo[]>} - Array of page information
   */
  async getAllPositionPagesForMarket(
    marketId: number
  ): Promise<PositionPageInfo[]> {
    const pages: PositionPageInfo[] = [];
    const marketPDA = getMarketPDA(this.program.programId, marketId);

    try {
      const marketAccount = await this.program.account.marketState.fetch(
        marketPDA
      );
      const pagesAllocated = marketAccount.pagesAllocated;

      // Check each page from 0 to pagesAllocated
      for (let pageIndex = 0; pageIndex < pagesAllocated; pageIndex++) {
        try {
          const positionPagePDA = getPositionPagePDA(
            this.program.programId,
            marketId,
            pageIndex
          );
          const pageAccount = await this.program.account.positionPage.fetch(
            positionPagePDA
          );

          // Count available slots
          const availableSlots = pageAccount.entries.filter(
            (entry: any) => "init" in entry.status
          ).length;

          const usedSlots = 16 - availableSlots;

          pages.push({
            pageIndex,
            totalSlots: 16,
            usedSlots,
            availableSlots,
            isFull: availableSlots === 0,
            prewarmNext: pageAccount.prewarmNext,
            exists: true,
          });
        } catch (error) {
          // Page doesn't exist, but we expected it to (based on pagesAllocated)
          console.warn(
            `Page ${pageIndex} expected but not found for market ${marketId}`
          );
        }
      }
    } catch (error) {
      console.error(`Failed to fetch market ${marketId}:`, error);
      throw new Error(`Market ${marketId} not found`);
    }

    return pages;
  }

  /**
   * Get position pages by market creator (for debugging/admin purposes)
   * @param marketCreator - Market creator public key
   * @returns {Promise<PositionPageInfo[]>} - Array of page information
   */
  async getPositionPagesByCreator(
    marketCreator: PublicKey
  ): Promise<PositionPageInfo[]> {
    // This is slower but useful for admin/debugging
    const allMarkets = await this.program.account.marketState.all();
    const creatorMarkets = allMarkets.filter((market) =>
      market.account.marketCreator.equals(marketCreator)
    );

    const allPages: PositionPageInfo[] = [];

    // Process each market
    for (const market of creatorMarkets) {
      const marketPages = await this.getAllPositionPagesForMarket(
        market.account.marketId.toNumber()
      );
      allPages.push(...marketPages);
    }

    return allPages;
  }
}
