import { BN, Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import { formatPositionAccount } from "./utils/helpers";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import sendVersionedTransaction from "./utils/sendVersionedTransaction";
import {
  getMarketPDA,
  getNftMasterEditionPDA,
  getNftMetadataPDA,
  getPositionAccountPDA,
  getSubPositionAccountPDA,
} from "./utils/pda";
import { RpcOptions } from "./types";
import { PositionAccount, PositionStatus } from "./types/position";
import { METAPLEX_ID } from "./utils/constants";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import createVersionedTransaction from "./utils/sendVersionedTransaction";

export default class Position {
  METAPLEX_PROGRAM_ID = new PublicKey(METAPLEX_ID);
  constructor(private program: Program<ShortxContract>) {}

  /**
   * Get all Position Accounts for a Market
   * @param marketId - Market ID
   *
   */
  async getPositionsAccountsForMarket(marketId: number) {
    const allAccounts = await this.program.account.positionAccount.all();
    console.log(
      "SDK: All position accounts for user for market:",
      allAccounts.map((acc) => ({
        marketId: acc.account.marketId,
        authority: acc.account.authority.toString(),
        // log other fields you want to see
      }))
    );

    // Then try the filtered query
    const response = await this.program.account.positionAccount.all([
      {
        memcmp: {
          offset: 8 + 1,
          bytes: bs58.encode(new BN(marketId).toArray("le", 8)),
        },
      },
    ]);

    return response.map(({ account }) =>
      formatPositionAccount(account, marketId)
    );
  }

  /**
   * Get all Positions for a user
   * @param user - User PublicKey
   *
   */
  async getPositionsForUser(user: PublicKey) {
    // Then try the filtered query
    const allAccounts = await this.program.account.positionAccount.all();

    const formattedPositionAccounts = allAccounts.map(({ account }) =>
      formatPositionAccount(account)
    );

    const positions = formattedPositionAccounts.flatMap(
      (positionAccount) => positionAccount.positions
    );

    const userPositions = positions.filter(
      (position) => position.authority === user.toBase58()
    );

    return userPositions;
  }

  /**
   * Get User positions for a particular market
   * @param user - User PublicKey
   * @param marketId - Market ID
   */
  async getUserPositionsForMarket(user: PublicKey, marketId: number) {
    const positionAccounts = await this.getPositionsAccountsForMarket(marketId);

    const positions = positionAccounts.flatMap(
      (positionAccount) => positionAccount.positions
    );

    return positions.filter(
      (position) => position.authority === user.toBase58()
    );
  }

  /**
   * Get the PDA for a position account
   * @param marketId - Market ID
   * @param marketAddress - Market Address
   * @param positionNonce - The nonce of the position account
   *
   */
  async getPositionsAccountPda(marketId: number, positionNonce = 0) {
    let positionAccountPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    if (positionNonce !== 0) {
      const marketAddress = getMarketPDA(this.program.programId, marketId);
      const subPositionAccountPDA = getSubPositionAccountPDA(
        this.program.programId,
        marketId,
        marketAddress,
        positionNonce
      );

      positionAccountPDA = getPositionAccountPDA(
        this.program.programId,
        marketId,
        subPositionAccountPDA
      );
    }

    return this.program.account.positionAccount.fetch(positionAccountPDA);
  }

  /**
   * Create Sub positions account
   * @param user - User PublicKey the main user
   * @param payer - Payer PublicKey
   * @param options - RPC options
   *
   */
  async createSubPositionAccount(
    marketId: number,
    payer: PublicKey,
    marketAddress: PublicKey,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    const positionAccount = await this.getPositionsAccountPda(marketId);

    const subPositionAccountPDA = getSubPositionAccountPDA(
      this.program.programId,
      marketId,
      marketAddress,
      positionAccount.nonce + 1
    );

    const marketPositionsAccount = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    try {
      ixs.push(
        await this.program.methods
          .createSubPositionAccount(subPositionAccountPDA)
          .accountsPartial({
            signer: payer,
            market: marketAddress,
            marketPositionsAccount: marketPositionsAccount,
            subMarketPositions: subPositionAccountPDA,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }

    return ixs;
  }

  /**
   * Get position account Nonce With Slots
   * @param positionAccounts - Position Accounts
   *
   */
  getPositionAccountNonceWithSlots(
    positionAccounts: PositionAccount[],
    payer: PublicKey
  ) {
    const marketId = Number(positionAccounts[0].marketId);
    const marketAddress = getMarketPDA(this.program.programId, marketId);
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }
    let nonce: number | null = null;

    for (const positionAccount of positionAccounts.reverse()) {
      if (nonce !== null) {
        break;
      }

      let freeSlots = 0;

      positionAccount.positions.forEach((position) => {
        if (nonce !== null) {
          return;
        }

        if (
          position.positionStatus !== PositionStatus.OPEN &&
          position.positionStatus !== PositionStatus.WAITING &&
          freeSlots >= 2
        ) {
          nonce = positionAccount.isSubPosition
            ? Number(positionAccount.nonce)
            : 0;
        }

        if (
          position.positionStatus !== PositionStatus.OPEN &&
          position.positionStatus !== PositionStatus.WAITING
        ) {
          freeSlots += 1;
        }
      });
    }

    if (nonce === null) {
      throw new Error("No open orders found");
    }

    if (nonce === 0) {
      return getPositionAccountPDA(this.program.programId, Number(marketId));
    }

    const subPositionAccountPDA = getSubPositionAccountPDA(
      this.program.programId,
      Number(marketId),
      marketAddress,
      nonce
    );

    const positionAccountPDA = getPositionAccountPDA(
      this.program.programId,
      Number(marketId),
      subPositionAccountPDA
    );

    return positionAccountPDA;
  }

  async getPositionAccountIxs(marketId: number, payer: PublicKey) {
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }

    let marketAddress = getMarketPDA(this.program.programId, marketId);

    const marketPositionsAccount = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    const ixs: TransactionInstruction[] = [];

    let positionAccounts: PositionAccount[] = [];

    positionAccounts = await this.getPositionsAccountsForMarket(marketId);

    if (positionAccounts.length === 0) {
      throw new Error(
        "No position accounts found for this market. Something went wrong."
      );
    }

    try {
      const positionAccountPDA = this.getPositionAccountNonceWithSlots(
        positionAccounts,
        payer
      );

      return { positionAccountPDA, ixs };
    } catch {
      const mainPositionAccount = positionAccounts.find(
        (positionAccount) => !positionAccount.isSubPosition
      );
      if (!mainPositionAccount) {
        throw new Error(
          "Main position account not found. Cannot determine next sub-position nonce."
        );
      }

      const subPositionAccountPDA = getSubPositionAccountPDA(
        this.program.programId,
        marketId,
        marketAddress,
        Number(mainPositionAccount.nonce) + 1
      );

      ixs.push(
        await this.program.methods
          .createSubPositionAccount(subPositionAccountPDA)
          .accountsPartial({
            signer: payer,
            market: marketAddress,
            marketPositionsAccount: marketPositionsAccount,
            subMarketPositions: subPositionAccountPDA,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
      );

      return {
        positionAccountPDA: getPositionAccountPDA(
          this.program.programId,
          marketId,
          subPositionAccountPDA
        ),
        ixs,
      };
    }
  }

  async mintExistingPosition(
    marketId: number,
    positionId: number,
    positionNonce: number,
    payer: PublicKey,
    metadataUri: string,
    collectionAuthority: PublicKey,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    const marketPDA = getMarketPDA(this.program.programId, marketId);

    let positionAccountPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    if (positionNonce !== 0) {
      const subPositionAccountPDA = getSubPositionAccountPDA(
        this.program.programId,
        marketId,
        marketPDA,
        positionNonce
      );

      positionAccountPDA = getPositionAccountPDA(
        this.program.programId,
        marketId,
        subPositionAccountPDA
      );
    }

    const marketAccount = await this.program.account.marketState.fetch(
      marketPDA
    );

    const nftMintKeypair = Keypair.generate();

    // Get the NFT metadata PDA
    const nftMetadataPda = getNftMetadataPDA(
      nftMintKeypair.publicKey,
      this.METAPLEX_PROGRAM_ID
    );

    // Get the NFT master edition PDA
    const nftMasterEditionPda = getNftMasterEditionPDA(
      nftMintKeypair.publicKey,
      this.METAPLEX_PROGRAM_ID
    );

    // Create the user's NFT token account using ATA program
    const nftTokenAccount = getAssociatedTokenAddressSync(
      nftMintKeypair.publicKey,
      payer, // Create token account for admin since they own the position
      false, // allowOwnerOffCurve
      TOKEN_PROGRAM_ID
    );

    if (
      !marketAccount.nftCollectionMint ||
      !marketAccount.nftCollectionMetadata ||
      !marketAccount.nftCollectionMasterEdition
    ) {
      throw new Error(
        "Market account does not have a collection mint, metadata, or master edition"
      );
    }

    try {
      ixs.push(
        await this.program.methods
          .mintPosition({
            positionId: new BN(positionId),
            metadataUri: metadataUri,
          })
          .accountsPartial({
            signer: payer,
            market: marketPDA,
            marketPositionsAccount: positionAccountPDA,
            nftMint: nftMintKeypair.publicKey,
            nftTokenAccount: nftTokenAccount,
            metadataAccount: nftMetadataPda,
            masterEdition: nftMasterEditionPda,
            collectionMint: marketAccount.nftCollectionMint,
            collectionMetadata: marketAccount.nftCollectionMetadata,
            collectionMasterEdition: marketAccount.nftCollectionMasterEdition,
            collectionAuthority: collectionAuthority, //needs to be the same as market creator and needs to sign.
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: this.METAPLEX_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          })
          .instruction()
      );

      const tx = await createVersionedTransaction(
        this.program,
        ixs,
        payer,
        options
      );
      tx.sign([nftMintKeypair]);
      return tx;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }
}
