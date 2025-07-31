import { Program } from "@coral-xyz/anchor";
import { Depredict } from "./types/depredict.js";
import * as anchor from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  CreateMarketArgs,
  MarketStates,
  MarketType,
  OpenOrderArgs,
  OracleType,
} from "./types/trade.js";
import { RpcOptions } from "./types/index.js";
import BN from "bn.js";
import { encodeString, formatMarket } from "./utils/helpers.js";
import {
  getCollectionPDA,
  getConfigPDA,
  getMarketPDA,
  getPositionAccountPDA,
  getPositionNftPDA,
  getSubPositionAccountPDA,
} from "./utils/pda/index.js";
import createVersionedTransaction from "./utils/sendVersionedTransaction.js";
import { swap } from "./utils/swap.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { METAPLEX_ID } from "./utils/constants.js";
import Position from "./position.js";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";

export default class Trade {
  METAPLEX_PROGRAM_ID = new PublicKey(METAPLEX_ID);
  position: Position;
  ADMIN_KEY: PublicKey;
  FEE_VAULT: PublicKey;
  constructor(
    private program: Program<Depredict>,
    adminKey: PublicKey,
    feeVault: PublicKey
  ) {
    this.ADMIN_KEY = adminKey;
    this.FEE_VAULT = feeVault;
    this.position = new Position(this.program);
  }

  /**
   * Get All Markets
   *
   */
  async getAllMarkets() {
    try {
      const marketV2 = await this.program.account.marketState.all();
      console.log("SDK:marketV2", marketV2);
      return marketV2.map(({ account, publicKey }) =>
        formatMarket(account, publicKey)
      );
    } catch (error) {
      console.log("SDK: getAllMarkets error", error);
      throw error;
    }
  }

  /**
   * Get Market By Market ID
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
   * @param address - The address of the market PDA
   *
   */
  async getMarketByAddress(address: PublicKey) {
    const account = await this.program.account.marketState.fetch(address);
    return formatMarket(account, address);
  }

  /**
   * Create Market
   * @param args.startTime - start time
   * @param args.endTime - end time
   * @param args.question - question (max 80 characters)
   * @param args.oraclePubkey - oracle pubkey (leave empty if manual resolution)
   * @param args.metadataUri - metadata uri
   * @param args.mintPublicKey - collection mint public key. This needs to sign the transaction.
   * @param args.payer - payer
   * @param args.oracleType - oracle type (manual or switchboard)
   * @param options - RPC options
   *
   */
  async createMarket(
    {
      bettingStartTime,
      startTime,
      endTime,
      question,
      oraclePubkey,
      metadataUri,
      payer,
      oracleType,
      marketType,
      mintAddress,
    }: CreateMarketArgs,
    options?: RpcOptions
  ) {
    if (question.length > 80) {
      throw new Error("Question must be less than 80 characters");
    }

    if (marketType == MarketType.FUTURE && !bettingStartTime) {
      throw new Error("Betting start time is required for future markets");
    }

    if (
      marketType == MarketType.FUTURE &&
      bettingStartTime &&
      bettingStartTime > startTime
    ) {
      throw new Error("Betting start time cannot be greater than start time");
    }

    const ixs: TransactionInstruction[] = [];

    const configPDA = getConfigPDA(this.program.programId);

    const configAccount = await this.program.account.config.fetch(configPDA);

    const marketIdBN = configAccount.nextMarketId;

    const marketId = marketIdBN.toNumber();

    const marketPDA = getMarketPDA(this.program.programId, marketId);

    const marketPositionsPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    // Create a new keypair for the collection mint
    const collectionMintPDA = getCollectionPDA(
      this.program.programId,
      marketId
    );

    const bettingStart =
      marketType == MarketType.LIVE
        ? new BN(startTime)
        : bettingStartTime
        ? new BN(bettingStartTime)
        : null;

    try {
      ixs.push(
        await this.program.methods
          .createMarket({
            question: encodeString(question, 80),
            marketStart: new BN(startTime),
            marketEnd: new BN(endTime),
            metadataUri: metadataUri,
            oracleType:
              oracleType == OracleType.SWITCHBOARD
                ? { switchboard: {} }
                : { none: {} },
            marketType:
              marketType == MarketType.LIVE ? { live: {} } : { future: {} },
            bettingStart,
          })
          .accountsPartial({
            payer: payer,
            feeVault: this.FEE_VAULT,
            config: configPDA,
            oraclePubkey:
              oracleType == OracleType.SWITCHBOARD
                ? oraclePubkey
                : "HX5YhqFV88zFhgPxEzmR1GFq8hPccuk2gKW58g1TLvbL", //if manual resolution, just pass in a dummy oracle ID. This is not used anywhere in the code.
            market: marketPDA,
            marketPositionsAccount: marketPositionsPDA,
            mint: mintAddress,
            collection: collectionMintPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .instruction()
      );
      const createMarketTx = await createVersionedTransaction(
        this.program,
        ixs,
        payer,
        options
      );

      let tx: VersionedTransaction = createMarketTx;
      return { tx, marketId };
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  /**
   * Open Order
   * @param args.marketId - The ID of the Market
   * @param args.amount - The amount of the Order
   * @param args.direction - The direction of the Order
   * @param args.mint - The mint of the Order
   * @param args.token - The token to use for the Order
   * @param args.payer - The payer of the Order
   * @param args.metadataUri - The metadata URI of the Order NFT
   * @param options - RPC options
   *
   */
  async openPosition(
    {
      marketId,
      amount,
      direction,
      token,
      payer,
      metadataUri,
    }: OpenOrderArgs,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];
    const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

    const { positionAccountPDA, ixs: positionAccountIxs } =
      await this.position.getPositionAccountIxs(marketId, payer);

    console.log(
      "SDK: positions account in trade open",
      positionAccountPDA.toString()
    );

    const marketPDA = getMarketPDA(this.program.programId, marketId);

    const marketAccount = await this.program.account.marketState.fetch(
      marketPDA
    );

    // Ensure the market has a mint configured
    if (!marketAccount.mint) {
      throw new Error(`Market ${marketId} does not have a mint configured`);
    }

    const marketMint = marketAccount.mint;
    const nextPositionId = marketAccount.nextPositionId;

    const configPDA = getConfigPDA(this.program.programId);

    const collectionPDA = getCollectionPDA(this.program.programId, marketId);

    const positionNftPDA = getPositionNftPDA(
      this.program.programId,
      marketId,
      nextPositionId
    );

    if (positionAccountIxs.length > 0) {
      ixs.push(...positionAccountIxs);
    }

    let amountInMint = amount * 10 ** marketAccount.decimals;

    if (token !== marketMint.toBase58()) {
      const {
        setupInstructions,
        swapIxs,
        addressLookupTableAccounts: swapAddressLookupTableAccounts,
        mintAmount,
      } = await swap({
        connection: this.program.provider.connection,
        wallet: payer.toBase58(),
        inToken: token,
        amount,
        mint: marketMint.toBase58(),
      });

      amountInMint = mintAmount;

      if (swapIxs.length === 0) {
        return;
      }

      ixs.push(...setupInstructions);
      ixs.push(...swapIxs);
      addressLookupTableAccounts.push(...swapAddressLookupTableAccounts);
    }

    try {
      ixs.push(
        await this.program.methods
          .createPosition({
          amount: new BN(amountInMint),
            direction: direction,
            metadataUri: metadataUri,
          })
          .accountsPartial({
            signer: payer,
            feeVault: this.FEE_VAULT,
            marketPositionsAccount: positionAccountPDA,
            market: marketPDA,
            mint: marketMint,
            config: configPDA,
            collection: collectionPDA,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            positionNftAccount: positionNftPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .instruction()
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }
    return { ixs, addressLookupTableAccounts };
  }

  /**
   * Resolve Market
   * @param args.marketId - The ID of the Market
   * @param args.payer - The payer of the Market resolution (this has to be the config authority)
   * @param args.resolutionValue - The resolution value of the Market (10 for yes, 11 for no). Leave it empty if oracle market.
   */
  async resolveMarket({
    marketId,
    payer,
    resolutionValue = null,
  }: {
    marketId: number;
    payer: PublicKey;
    resolutionValue?: 10 | 11 | null;
  }) {
    const marketPDA = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(
      marketPDA
    );
    const oracleType = marketAccount.oracleType;
    const oraclePubkey = marketAccount.oraclePubkey;


    if (!oraclePubkey && "switchboard" in oracleType) {
      throw new Error("Market has no oracle pubkey");
    }

    const ixs: TransactionInstruction[] = [];
    try {
      ixs.push(
        await this.program.methods
          .resolveMarket({
            oracleValue: "switchboard" in oracleType ? null : resolutionValue,
          })
          .accountsPartial({
            signer: payer,
            market: marketPDA,
            oraclePubkey: !("switchboard" in oracleType)
              ? new PublicKey("HX5YhqFV88zFhgPxEzmR1GFq8hPccuk2gKW58g1TLvbL")
              : oraclePubkey || anchor.web3.SystemProgram.programId,
          })
          .instruction()
      );

      const tx = await createVersionedTransaction(this.program, ixs, payer);
      return tx;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  /**
   * Close Market and related accounts to collect remaining liquidity
   * @param marketId - The ID of the market
   * @param payer - The payer of the Market
   */
  async closeMarket(marketId: number, payer: PublicKey) {
    const ixs: TransactionInstruction[] = [];

    const marketIdBN = new BN(marketId);

    const marketPDA = getMarketPDA(this.program.programId, marketId);

    // Get the market account to access its mint
    const marketAccount = await this.program.account.marketState.fetch(marketPDA);
    if (!marketAccount.mint) {
      throw new Error(`Market ${marketId} does not have a mint configured`);
    }
    const marketMint = marketAccount.mint;

    const configPDA = getConfigPDA(this.program.programId);

    const marketPositionsPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    /** DO NOT UMCOMMENT OR CALL METHOD IF NOT IMPLEMENTED THOROUGHLY */

    // close any sub position accounts (need to write code)
    // const subPositionAccounts = await this.position.getPositionsAccountsForMarket(marketId);
    // for (const subPositionAccount of subPositionAccounts) {
    //   ixs.push(
    //     await this.program.methods
    //       .closeSubPositionAccount(subPositionAccount.subPositionAccount)
    //       .accountsPartial({})
    //       .instruction()
    //   );
    // }

    const feeVaultMintAta = getAssociatedTokenAddressSync(
      marketMint,
      this.FEE_VAULT,
      true,
      TOKEN_PROGRAM_ID
    );

    const marketVault = getAssociatedTokenAddressSync(
      marketMint,
      marketPDA,
      true,
      TOKEN_PROGRAM_ID
    );

    try {
      ixs.push(
        await this.program.methods
          .closeMarket({
            marketId: marketIdBN,
          })
          .accountsPartial({
            signer: payer,
            feeVault: this.FEE_VAULT,
            market: marketPDA,
            marketPositionsAccount: marketPositionsPDA,
            config: configPDA,
            feeVaultMintAta: feeVaultMintAta,
            mint: marketMint,
            marketVault: marketVault,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
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
   * Update Market
   * @param marketId - The ID of the market
   * @param payer - The payer of the Market
   * @param marketEnd - The end time of the market
   * @param marketState - The state of the market to update to (cannot be resolved)
   *
   */
  async updateMarket(
    marketId: number,
    payer: PublicKey,
    marketEnd?: number,
    marketState?: MarketStates
  ) {
    const ixs: TransactionInstruction[] = [];

    if (marketState == MarketStates.RESOLVED) {
      throw new Error("Market state cannot be resolved");
    }

    try{
    ixs.push(
      await this.program.methods
        .updateMarket({
          marketEnd: marketEnd ? new BN(marketEnd) : null,
          marketState:
            marketState == MarketStates.ACTIVE
              ? { active: {} }
              : marketState == MarketStates.ENDED
              ? { ended: {} }
              : marketState == MarketStates.RESOLVING
              ? { resolving: {} }
              : null,
        })
        .accounts({
          signer: payer,
          market: getMarketPDA(this.program.programId, marketId),
        })
          .instruction()
      );

      const updateMarketTx = await createVersionedTransaction(this.program, ixs, payer);
      return updateMarketTx;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  async payoutPosition(
    marketId: number,
    payer: PublicKey,
    positionId: number,
    positionNonce: number,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    const marketPda = getMarketPDA(this.program.programId, marketId);

    // Get the market account to access its mint
    const marketAccount = await this.program.account.marketState.fetch(marketPda);
    if (!marketAccount.mint) {
      throw new Error(`Market ${marketId} does not have a mint configured`);
    }
    const marketMint = marketAccount.mint;

    const collectionPda = getCollectionPDA(this.program.programId, marketId);

    const userMintAta = getAssociatedTokenAddressSync(
      marketMint,
      payer,
      false,
      TOKEN_PROGRAM_ID
    );

    const marketVault = getAssociatedTokenAddressSync(
      marketMint,
      marketPda,
      true, // allowOwnerOffCurve since marketPda is a PDA
      TOKEN_PROGRAM_ID
    );

    let positionAccountPDA = getPositionAccountPDA(
      this.program.programId,
      marketId
    );

    if (positionNonce !== 0) {
      // if a sub position account
      const subPositionAccountPDA = getSubPositionAccountPDA(
        this.program.programId,
        marketId,
        marketPda,
        positionNonce
      );

      positionAccountPDA = getPositionAccountPDA(
        this.program.programId,
        marketId,
        subPositionAccountPDA
      );
    }

    // get the position from the position account
    const positionAccount = await this.program.account.positionAccount.fetch(
      positionAccountPDA
    );
    const currentPosition = positionAccount.positions.find(
      (p) => p.positionId.toNumber() === positionId
    );
    if (!currentPosition) {
      throw new Error("Position not found in position account");
    }

    const nftMint = currentPosition.mint;

    if (!nftMint) {
      throw new Error("Position is not an NFT");
    }

    try {
      ixs.push(
        await this.program.methods
          .settlePosition()
          .accountsPartial({
            signer: payer,
            marketPositionsAccount: positionAccountPDA,
            nftMint: nftMint,
            userMintAta: userMintAta,
            marketVault: marketVault,
            mint: marketMint,
            market: marketPda,
            collection: collectionPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .instruction()
      );
    } catch (error) {
      console.log("error", error);
      throw error;
    }

    const tx = await createVersionedTransaction(
      this.program,
      ixs,
      payer,
      options
    );

    return tx;
  }
}
