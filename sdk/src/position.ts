import { Program } from "@coral-xyz/anchor";
import { Depredict } from "./types/depredict.js";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

import { getMarketPDA, getPositionPagePDA } from "./utils/pda/index.js";
import { RpcOptions } from "./types/index.js";
import { PositionAccount, PositionStatus } from "./types/position.js";

export default class Position {
  constructor(private program: Program<Depredict>) {}

  /** Ensure a position page exists (and initialize header if needed) */
  async ensurePositionPage({ marketId, payer, pageIndex }: { marketId: number; payer: PublicKey; pageIndex: number; }) {
    const ixs: TransactionInstruction[] = [];
    const market = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(market);
    const marketCreator = marketAccount.marketCreator as PublicKey;
    const positionPage = getPositionPagePDA(this.program.programId, marketId, pageIndex);

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

  /** Prune a position slot (creator only) */
  async prunePosition({ marketId, signer, pageIndex, slotIndex }: { marketId: number; signer: PublicKey; pageIndex: number; slotIndex: number; }) {
    const ixs: TransactionInstruction[] = [];
    const market = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(market);
    const marketCreator = marketAccount.marketCreator as PublicKey;
    const positionPage = getPositionPagePDA(this.program.programId, marketId, pageIndex);

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

  /** Close an empty position page (creator only) */
  async closePositionPage({ marketId, signer, pageIndex }: { marketId: number; signer: PublicKey; pageIndex: number; }) {
    const ixs: TransactionInstruction[] = [];
    const market = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(market);
    const marketCreator = marketAccount.marketCreator as PublicKey;
    const positionPage = getPositionPagePDA(this.program.programId, marketId, pageIndex);

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
}
