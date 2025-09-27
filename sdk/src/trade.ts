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
import { PayoutArgs } from "./types/trade.js";
import BN from "bn.js";
import { encodeString, formatMarket } from "./utils/helpers.js";
import {
  getConfigPDA,
  getMarketPDA,
  getMarketCreatorPDA,
  getPositionPagePDA,
  getTreeConfigPDA,
} from "./utils/pda/index.js";
import createVersionedTransaction from "./utils/sendVersionedTransaction.js";
import { swap } from "./utils/swap.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  METAPLEX_ID,
  DEFAULT_MINT,
  MPL_BUBBLEGUM_ID,
  MPL_NOOP_ID as NOOP_PROGRAM_ID,
  MPL_ACCOUNT_COMPRESSION_ID as ACCOUNT_COMPRESSION_ID,
  MPL_CORE_PROGRAM_ID,
  MPL_CORE_CPI_SIGNER,
  MPL_NOOP_ID,
  MPL_ACCOUNT_COMPRESSION_ID,
} from "./utils/constants.js";
import Position from "./position.js";
import { fetchAssetProofWithRetry } from "./utils/mplHelpers.js";

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
   * @returns Markets
   */
  async getAllMarkets() {
    try {
      const marketV2 = await this.program.account.marketState.all();
      return marketV2.map(({ account, publicKey }) =>
        formatMarket(account, publicKey)
      );
    } catch (error) {
      console.log("SDK: getAllMarkets error", error);
      throw error;
    }
  }

  /**
   * Get Markets By Authority
   * @param authority - The authority of the markets
   * (The idea is that every platform can query their own markets)
   * @returns Markets
   */
  async getMarketsByAuthority(authority: PublicKey) {
    const markets = await this.program.account.marketState.all();
    const filteredMarkets = markets.filter((market) =>
      market.account.marketCreator.equals(authority)
    );
    return filteredMarkets.map(({ account, publicKey }) =>
      formatMarket(account, publicKey)
    );
  }

  /**
   * Get Market By Market ID
   * @param marketId - The ID of the market
   * @returns Market
   */
  async getMarketById(marketId: number) {
    const marketPDA = getMarketPDA(this.program.programId, marketId);
    const response = await this.program.account.marketState.fetch(marketPDA);
    return formatMarket(response, marketPDA);
  }

  /**
   * Get Market By Address
   * @param address - The address of the market PDA
   * @returns Market
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
   * @returns Transaction, marketId
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
    // Use default mint if none specified
    const marketMint = mintAddress || DEFAULT_MINT;
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

    // Derive position page 0 and market creator PDAs
    const positionPage0PDA = getPositionPagePDA(
      this.program.programId,
      marketId,
      0
    );
    // Market creator PDA is derived from the payer (authority)
    const marketCreatorPDA = getMarketCreatorPDA(this.program.programId, payer);

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
            marketCreator: marketCreatorPDA,
            payer: payer,
            config: configPDA,
            oraclePubkey:
              oracleType == OracleType.SWITCHBOARD
                ? oraclePubkey
                : "HX5YhqFV88zFhgPxEzmR1GFq8hPccuk2gKW58g1TLvbL", //if manual resolution, just pass in a dummy oracle ID. This is not used anywhere in the code.
            market: marketPDA,
            positionPage0: positionPage0PDA,
            mint: marketMint,
            tokenProgram: TOKEN_PROGRAM_ID,
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
   * @returns Transaction, addressLookupTableAccounts, nftMint || null (if no swap)
   */
  async openPosition(
    {
      marketId,
      amount,
      direction,
      token,
      payer,
      metadataUri,
      pageIndex,
    }: OpenOrderArgs,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];
    const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

    const marketPDA = getMarketPDA(this.program.programId, marketId);

    const marketAccount = await this.program.account.marketState.fetch(
      marketPDA
    );

    // Ensure the market has a mint configured
    if (!marketAccount.mint) {
      throw new Error(`Market ${marketId} does not have a mint configured`);
    }

    const marketMint = marketAccount.mint;
    const marketCreatorPubkey: PublicKey = marketAccount.marketCreator;

    //this will find the page index with open slots and create a new page if needed (available slots < 2)
    const positionPageResult = await this.position.findAvailablePageForMarket(
      marketId,
      payer
    );
    
    // Add any page creation instructions to the transaction
    ixs.push(...positionPageResult.instructions);
    
    const positionPagePDA = getPositionPagePDA(
      this.program.programId,
      marketId,
      positionPageResult.pageIndex
    );

    // Derive vaults
    const userMintAta = getAssociatedTokenAddressSync(
      marketMint,
      payer,
      false,
      TOKEN_PROGRAM_ID
    );
    const marketVault = getAssociatedTokenAddressSync(
      marketMint,
      marketPDA,
      true,
      TOKEN_PROGRAM_ID
    );

    // Fetch market creator to get merkle tree and collection
    const marketCreatorAccount = await this.program.account.marketCreator.fetch(
      marketCreatorPubkey
    );
    const merkleTree: PublicKey = marketCreatorAccount.merkleTree;
    const collection: PublicKey = marketCreatorAccount.coreCollection;

    // Constants from IDL addresses
    const BGUM_PROGRAM_ID = new PublicKey(MPL_BUBBLEGUM_ID);
    const MPL_NOOP_ID = new PublicKey(NOOP_PROGRAM_ID);
    const MPL_ACCOUNT_COMPRESSION_ID = new PublicKey(ACCOUNT_COMPRESSION_ID);

    // Derive TreeConfig PDA (Bubblegum)
    const [treeConfig] = PublicKey.findProgramAddressSync(
      [merkleTree.toBuffer()],
      BGUM_PROGRAM_ID
    );

    let amountInMint = amount * 10 ** marketAccount.decimals;

    try {
      ixs.push(
        await this.program.methods
          .openPosition({
            amount: new BN(amountInMint),
            direction: direction,
            metadataUri: metadataUri,
          })
          .accountsPartial({
            user: payer,
            positionPage: positionPagePDA,
            positionPageNext: positionPagePDA,
            market: marketPDA,
            marketCreator: marketCreatorPubkey,
            mint: marketMint,
            userMintAta: userMintAta,
            marketVault: marketVault,
            merkleTree: merkleTree,
            collection: collection,
            treeConfig: treeConfig,
            mplCoreCpiSigner: MPL_CORE_CPI_SIGNER,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            bubblegumProgram: BGUM_PROGRAM_ID,
            logWrapperProgram: MPL_NOOP_ID,
            compressionProgram: MPL_ACCOUNT_COMPRESSION_ID,
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
    return { ixs, addressLookupTableAccounts, nftMint: positionPagePDA };
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
    const marketCreator = marketAccount.marketCreator;

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
            marketCreator,
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
    const marketAccount = await this.program.account.marketState.fetch(
      marketPDA
    );
    if (!marketAccount.mint) {
      throw new Error(`Market ${marketId} does not have a mint configured`);
    }
    const marketMint = marketAccount.mint;

    const configPDA = getConfigPDA(this.program.programId);

    // legacy positions PDA no longer needed

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

    const marketCreatorPubkey = marketAccount.marketCreator;
    const creatorFeeVaultAta = getAssociatedTokenAddressSync(
      marketMint,
      marketCreatorPubkey,
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
            protocolFeeVault: this.FEE_VAULT,
            protocolFeeVaultAta: feeVaultMintAta,
            marketCreator: marketCreatorPubkey,
            creatorFeeVaultAta: creatorFeeVaultAta,
            market: marketPDA,
            config: configPDA,
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

    try {
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

      const updateMarketTx = await createVersionedTransaction(
        this.program,
        ixs,
        payer
      );
      return updateMarketTx;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

  async payoutPosition(
    { marketId, payer, pageIndex, assetId, slotIndex }: PayoutArgs,
    options?: RpcOptions
  ) {
    const ixs: TransactionInstruction[] = [];

    const marketPda = getMarketPDA(this.program.programId, marketId);

    // Get the market account to access its mint
    const marketAccount = await this.program.account.marketState.fetch(
      marketPda
    );
    if (!marketAccount.mint) {
      throw new Error(`Market ${marketId} does not have a mint configured`);
    }
    const marketMint = marketAccount.mint;
    const configPda = getConfigPDA(this.program.programId);

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

    // Load market creator to fetch merkle tree and collection
    const marketCreator = (
      await this.program.account.marketState.fetch(marketPda)
    ).marketCreator as PublicKey;
    const marketCreatorAccount = await this.program.account.marketCreator.fetch(
      marketCreator
    );
    const merkleTree: PublicKey = marketCreatorAccount.merkleTree;
    const collection: PublicKey = marketCreatorAccount.coreCollection;

    // Derive TreeConfig PDA from merkle tree
    const treeConfig = getTreeConfigPDA(merkleTree);

    // Fetch asset proof details required by on-chain args
    const {
      root: rootBytes,
      dataHash: dataHashBytes,
      creatorHash: creatorHashBytes,
      nonce,
      index,
    } = await fetchAssetProofWithRetry(assetId);

    try {
      const positionPage = getPositionPagePDA(
        this.program.programId,
        marketId,
        pageIndex
      );
      ixs.push(
        await this.program.methods
          .settlePosition({
            pageIndex,
            slotIndex: slotIndex ?? null,
            assetId,
            root: Array.from(rootBytes),
            dataHash: Array.from(dataHashBytes),
            creatorHash: Array.from(creatorHashBytes),
            nonce: new BN(nonce),
            leafIndex: index,
          })
          .accountsPartial({
            claimer: payer,
            market: marketPda,
            config: configPda,
            marketCreator,
            positionPage,
            mint: marketMint,
            claimerMintAta: userMintAta,
            marketVault,
            mplCoreProgram: new PublicKey(MPL_CORE_PROGRAM_ID),
            bubblegumProgram: new PublicKey(MPL_BUBBLEGUM_ID),
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            merkleTree,
            collection,
            treeConfig,
            mplCoreCpiSigner: new PublicKey(MPL_CORE_CPI_SIGNER),
            logWrapperProgram: new PublicKey(MPL_NOOP_ID),
            compressionProgram: new PublicKey(MPL_ACCOUNT_COMPRESSION_ID),
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
