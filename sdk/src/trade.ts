import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import * as anchor from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  CreateMarketArgs,
  OpenOrderArgs,
  CreateCustomerArgs,
  MarketStates,
} from "./types/trade";
import { RpcOptions } from "./types/index";
import BN from "bn.js";
import { encodeString, formatMarket } from "./utils/helpers";
import {
  getConfigPDA,
  getMarketPDA,
  getPositionAccountPDA,
  getSubPositionAccountPDA,
} from "./utils/pda/index";
import sendVersionedTransaction from "./utils/sendVersionedTransaction";
import { swap } from "./utils/swap";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  createMint,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  ADMIN_KEY,
  FEE_VAULT,
  USDC_MINT,
  USDC_DECIMALS,
  METAPLEX_ID,
} from "./utils/constants";
import Position from "./position";

export default class Trade {
  decimals: number = USDC_DECIMALS;
  position: Position;
  constructor(private program: Program<ShortxContract>) {
    this.position = new Position(this.program);
  }

  /**
   * Get All Markets
   *
   */
  async getAllMarkets() {
    const marketV2 = await this.program.account.marketState.all();

    return marketV2.map(({ account, publicKey }) =>
      formatMarket(account, publicKey)
    );
  }

  /**
   * Get Market By ID
   * @param marketId - The ID of the market
   *
   */
  async getMarketById(marketId: number) {
    const marketPDA = getMarketPDA(this.program.programId, marketId);

    const response = await this.program.account.marketState.fetch(marketPDA);

    return formatMarket(response, marketPDA);
  }

  /**
   * Get Market By Address
   * @param address - The address of the market
   *
   */
  async getMarketByAddress(address: PublicKey) {
    const account = await this.program.account.marketState.fetch(address);

    return formatMarket(account, address);
  }

  /**
   * Create Market
   * @param args.marketId - new markert id - length + 1
   * @param args.startTime - start time
   * @param args.endTime - end time
   * @param args.question - question (max 80 characters)
   * @param args.liquidityAtStart - liquidity at start
   * @param args.payoutFee - payout fee (to add affiliate system)
   *
   * @param options - RPC options
   *
   */
  async createMarket(
    {
      marketId,
      startTime,
      endTime,
      question,
      oraclePubkey,
      metadataUri,
    }: CreateMarketArgs,
    options?: RpcOptions
  ) {
    if (question.length > 80) {
      throw new Error("Question must be less than 80 characters");
    }

    const ixs: TransactionInstruction[] = [];

    const marketIdBN = new BN(marketId);

    const [marketPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    );

    const [collectionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection")],
      this.program.programId
    );
    console.log("Collection PDA:", collectionPda.toString());

    // Create a new keypair for the collection mint
    const collectionMintKeypair = Keypair.generate();
    console.log("Collection Mint:", collectionMintKeypair.publicKey.toString());

    // Initialize the collection mint using SPL Token program
    const mintIx = createInitializeMint2Instruction(
      collectionMintKeypair.publicKey,
      1,
      new PublicKey(ADMIN_KEY), // payer
      new PublicKey(ADMIN_KEY), // Mint Authority
      TOKEN_PROGRAM_ID
    );
    console.log("Add collection mint account instructions to transaction");
    ixs.push(mintIx);

    const [collectionMetadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey(METAPLEX_ID).toBuffer(),
        collectionMintKeypair.publicKey.toBuffer(),
      ],
      new PublicKey(METAPLEX_ID)
    );
    console.log("Collection Metadata PDA:", collectionMetadataPda.toString());

    const [collectionMasterEditionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey(METAPLEX_ID).toBuffer(),
        collectionMintKeypair.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      new PublicKey(METAPLEX_ID)
    );

    ixs.push(
      await this.program.methods
        .createMarket({
          marketId: new BN(marketId),
          question: encodeString(question, 80),
          marketStart: new BN(startTime),
          marketEnd: new BN(endTime),
          metadataUri: metadataUri,
        })
        .accountsPartial({
          signer: new PublicKey(ADMIN_KEY),
          feeVault: new PublicKey(FEE_VAULT),
          config: configPDA,
          oraclePubkey: oraclePubkey,
          market: marketPDA,
          usdcMint: new PublicKey(USDC_MINT),
          nftCollectionMint: collectionMintKeypair.publicKey,
          nftCollectionMetadata: collectionMetadataPda,
          nftCollectionMasterEdition: collectionMasterEditionPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenMetadataProgram: METAPLEX_ID,
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Open Order
   * @param args.marketId - The ID of the Market
   * @param args.amount - The amount of the Order
   * @param args.direction - The direction of the Order
   * @param args.mint - The mint of the Order
   * @param args.token - The token to use for the Order
   *
   * @param options - RPC options
   *
   */
  async openPosition(
    { marketId, amount, direction, mint, token }: OpenOrderArgs,
    options?: RpcOptions
  ) {
    const payer = this.program.provider.publicKey;
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }

    const ixs: TransactionInstruction[] = [];
    const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

    const { positionAccountPDA, ixs: positionAccountIxs } =
      await this.position.getPositionAccountIxs(marketId);
    const marketPDA = getMarketPDA(this.program.programId, marketId);
    const configPDA = getConfigPDA(this.program.programId);

    if (positionAccountIxs.length > 0) {
      ixs.push(...positionAccountIxs);
    }

    let amountInTRD = amount * 10 ** USDC_DECIMALS;

    if (token !== USDC_MINT) {
      const {
        setupInstructions,
        swapIxs,
        addressLookupTableAccounts: swapAddressLookupTableAccounts,
        usdcAmount,
      } = await swap({
        connection: this.program.provider.connection,
        wallet: payer.toBase58(),
        inToken: token,
        amount,
      });

      amountInTRD = usdcAmount;

      if (swapIxs.length === 0) {
        return;
      }

      ixs.push(...setupInstructions);
      ixs.push(...swapIxs);
      addressLookupTableAccounts.push(...swapAddressLookupTableAccounts);
    }

    ixs.push(
      await this.program.methods
        .createPosition({
          amount: new BN(amountInTRD),
          direction: direction,
        })
        .accountsPartial({
          signer: payer,
          feeVault: new PublicKey(FEE_VAULT),
          marketPositionsAccount: positionAccountPDA,
          market: marketPDA,
          usdcMint: mint,
          config: configPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction()
    );

    return sendVersionedTransaction(
      this.program,
      ixs,
      options,
      addressLookupTableAccounts
    );
  }

  /**
   * Resolve Market
   * @param args.marketId - The ID of the Market
   * @param args.winningDirection - The Winning Direction of the Market
   *
   * @param options - RPC options
   *
   */
  async resolveMarket(
    {
      marketId,
      winningDirection,
    }: {
      marketId: number;
      winningDirection:
        | {
            yes: {};
          }
        | {
            no: {};
          }
        | {
            none: {};
          }
        | {
            draw: {};
          };
      state: MarketStates;
    },
    options?: RpcOptions
  ) {
    const marketIdBN = new BN(marketId);
    const [marketPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const ixs: TransactionInstruction[] = [];

    ixs.push(
      await this.program.methods
        .resolveMarket({
          marketId: marketIdBN,
          winningDirection: winningDirection,
        })
        .accountsPartial({
          signer: new PublicKey(ADMIN_KEY),
          market: marketPDA,
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Collect Remaining Liquidity
   * @param marketId - The ID of the market
   *
   * @param options - RPC options
   *
   */
  async closeMarket(marketId: number, options?: RpcOptions) {
    try {
      console.log("entered close market");
      const ixs: TransactionInstruction[] = [];

      const marketIdBN = new BN(marketId);

      const [marketPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
        this.program.programId
      );

      console.log("marketPDA", marketPDA.toBase58());

      ixs.push(
        await this.program.methods
          .closeMarket({
            marketId: marketIdBN,
          })
          .accountsPartial({
            signer: new PublicKey(ADMIN_KEY),
            feeVault: new PublicKey(FEE_VAULT),
            market: marketPDA,
            usdcMint: new PublicKey(USDC_MINT),
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .instruction()
      );

      return ixs;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  /**
   * Payout Order
   * @param args.marketId - The ID of the Market
   * @param args.orderId - The ID of the Order to Payout
   * @param args.userNonce - The nonce of the user
   *
   * @param options - RPC options
   *
   */
  async payoutOrder(
    orders: {
      marketId: number;
      orderId: number;
      userNonce: number;
      mint: PublicKey;
    }[],
    options?: RpcOptions
  ) {
    const payer = this.program.provider.publicKey;
    if (!payer) {
      throw new Error(
        "Payer public key is not available. Wallet might not be connected."
      );
    }

    const ixs: TransactionInstruction[] = [];

    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    );

    const marketIdBN = new BN(orders[0].marketId);

    const [marketPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    if (orders.length > 10) {
      throw new Error("Max 10 orders per transaction");
    }

    for (const order of orders) {
      let positionAccountPDA = getPositionAccountPDA(
        this.program.programId,
        order.marketId
      );

      if (order.userNonce !== 0) {
        const marketAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from("market"),
            new BN(order.marketId).toArrayLike(Buffer, "le", 8),
          ],
          this.program.programId
        )[0];

        const subPositionAccountPDA = getSubPositionAccountPDA(
          this.program.programId,
          order.marketId,
          marketAddress,
          order.userNonce
        );

        positionAccountPDA = getPositionAccountPDA(
          this.program.programId,
          order.marketId,
          subPositionAccountPDA
        );
      }

      ixs.push(
        await this.program.methods
          .settlePosition(new BN(order.orderId))
          .accountsPartial({
            signer: payer,
            feeVault: new PublicKey(FEE_VAULT),
            marketPositionsAccount: positionAccountPDA,
            market: marketPDA,
            usdcMint: USDC_MINT,
            config: configPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .instruction()
      );
    }

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Update Market
   * @param marketId - The ID of the market
   * @param marketEnd - The end time of the market
   *
   * @param options - RPC options
   *
   */
  async updateMarket(
    marketId: number,
    marketEnd: number,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    ixs.push(
      await this.program.methods
        .updateMarket({
          marketId: new BN(marketId),
          marketEnd: new BN(marketEnd),
        })
        .accounts({
          signer: this.program.provider.publicKey,
          market: getMarketPDA(this.program.programId, marketId),
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }

  async payoutNft(
    nftPositions: {
      marketId: number;
      positionId: number;
      positionNonce: number;
      amount: number;
      direction: { yes: {} } | { no: {} };
      nftMint: PublicKey;
      nftMetadata: PublicKey;
      nftMasterEdition: PublicKey;
      nftTokenAccount: PublicKey;
      nftUsdcTokenAccount: PublicKey;
      nftUsdcVault: PublicKey;
      nftCollectionMint: PublicKey;
    }[],
    payer: PublicKey,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    const marketIdBN = new BN(nftPositions[0].marketId);

    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketIdBN.toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );

    const userUsdcAta = getAssociatedTokenAddressSync(
      new PublicKey(USDC_MINT),
      payer,
      false,
      TOKEN_PROGRAM_ID
    );

    const marketVault = getAssociatedTokenAddressSync(
      new PublicKey(USDC_MINT),
      marketPda,
      true, // allowOwnerOffCurve since marketPda is a PDA
      TOKEN_PROGRAM_ID
    );

    for (const position of nftPositions) {
      if (position.marketId !== marketIdBN.toNumber()) {
        throw new Error("Market ID mismatch");
      }

      let positionAccountPDA = getPositionAccountPDA(
        this.program.programId,
        position.marketId
      );

      if (position.positionNonce !== 0) {
        const marketAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from("market"),
            new BN(position.marketId).toArrayLike(Buffer, "le", 8),
          ],
          this.program.programId
        )[0];

        const subPositionAccountPDA = getSubPositionAccountPDA(
          this.program.programId,
          position.marketId,
          marketAddress,
          position.positionNonce
        );

        positionAccountPDA = getPositionAccountPDA(
          this.program.programId,
          position.marketId,
          subPositionAccountPDA
        );
      }

      ixs.push(
        await this.program.methods
          .settleNftPosition({
            positionId: new BN(position.positionId),
            marketId: marketIdBN,
            amount: new BN(position.amount),
            direction: position.direction,
          })
          .accountsPartial({
            signer: payer,
            marketPositionsAccount: positionAccountPDA,
            nftMint: position.nftMint,
            userNftTokenAccount: position.nftTokenAccount,
            userUsdcAta: userUsdcAta,
            marketUsdcVault: marketVault,
            usdcMint: new PublicKey(USDC_MINT),
            nftMetadataAccount: position.nftMetadata,
            nftMasterEditionAccount: position.nftMasterEdition,
            market: marketPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            token2022Program: TOKEN_2022_PROGRAM_ID,
            tokenMetadataProgram: METAPLEX_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .instruction()
      );
    }

    return sendVersionedTransaction(this.program, ixs, options);
  }

  /**
   * Create Customer
   * @param args.id - The ID of the customer
   * @param args.name - The name of the customer
   * @param args.authority - The authority of the customer
   *
   * @param options - RPC options
   *
   */
  async createCustomer(
    { id, name, authority, feeRecipient }: CreateCustomerArgs,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    ixs.push(
      await this.program.methods
        .createUser({ id, authority })
        .accounts({
          signer: this.program.provider.publicKey,
        })
        .instruction()
    );

    return sendVersionedTransaction(this.program, ixs, options);
  }
}
