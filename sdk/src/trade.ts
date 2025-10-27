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
import {
  PayoutArgs,
  PayoutPositionIxResult,
  PayoutPositionMessageResult,
  PayoutPositionTxResult,
} from "./types/trade.js";
import BN from "bn.js";
import { encodeString, formatMarket, dedupePubkeys } from "./utils/helpers.js";
import {
  getConfigPDA,
  getMarketPDA,
  getMarketCreatorPDA,
  getPositionPagePDA,
  getTreeConfigPDA,
} from "./utils/pda/index.js";
import createVersionedTransaction from "./utils/sendVersionedTransaction.js";
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
import {
  fetchAssetProofWithRetry,
  buildV0Message,
  ensureLookupTable,
  buildLookupTableCloseTransactions,
} from "./utils/mplHelpers.js";

export default class Trade {
  METAPLEX_PROGRAM_ID = new PublicKey(METAPLEX_ID);
  position: Position;
  constructor(private program: Program<Depredict>) {
    this.position = new Position(this.program);
  }

  private async collectCreatorLookupAddresses(
    authority: PublicKey
  ): Promise<PublicKey[]> {
    // Creator LUT stores static/shared accounts reused by every market settle.
    const configPda = getConfigPDA(this.program.programId);
    const marketCreatorPda = getMarketCreatorPDA(
      this.program.programId,
      authority
    );
    const creatorAccount = await this.program.account.marketCreator.fetch(
      marketCreatorPda
    );
    const merkleTree = creatorAccount.merkleTree as PublicKey;
    const collection = creatorAccount.coreCollection as PublicKey;
    const treeConfig = getTreeConfigPDA(merkleTree);

    const baseAccounts: (PublicKey | null | undefined)[] = [
      marketCreatorPda,
      configPda,
      merkleTree,
      collection,
      treeConfig,
      new PublicKey(MPL_CORE_CPI_SIGNER),
      new PublicKey(MPL_CORE_PROGRAM_ID),
      new PublicKey(MPL_BUBBLEGUM_ID),
      new PublicKey(MPL_NOOP_ID),
      new PublicKey(MPL_ACCOUNT_COMPRESSION_ID),
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      anchor.web3.SystemProgram.programId,
      this.program.programId,
    ];

    return dedupePubkeys(baseAccounts);
  }

  private async collectMarketLookupAddresses(
    marketId: number,
    pageIndexes: number[] = [],
    exclude: PublicKey[] = []
  ): Promise<PublicKey[]> {
    // Market LUT only tracks market-specific accounts (market PDA, vault, pages).
    const configPda = getConfigPDA(this.program.programId);
    const marketPda = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(
      marketPda
    );
    const marketCreator = marketAccount.marketCreator as PublicKey;
    const marketMint = (marketAccount.mint ?? null) as PublicKey | null;
    const marketVault = (marketAccount.marketVault ?? null) as PublicKey | null;
    const marketCreatorAccount = await this.program.account.marketCreator.fetch(
      marketCreator
    );
    const merkleTree = marketCreatorAccount.merkleTree as PublicKey;
    const collection = marketCreatorAccount.coreCollection as PublicKey;
    const treeConfig = getTreeConfigPDA(merkleTree);

    const pageAddresses = pageIndexes.map((pageIndex) =>
      getPositionPagePDA(this.program.programId, marketId, pageIndex)
    );

    const baseAccounts: (PublicKey | null | undefined)[] = [
      marketPda,
      configPda,
      marketCreator,
      marketMint,
      marketVault,
      collection,
      merkleTree,
      treeConfig,
      new PublicKey(MPL_CORE_CPI_SIGNER),
      new PublicKey(MPL_CORE_PROGRAM_ID),
      new PublicKey(MPL_BUBBLEGUM_ID),
      new PublicKey(MPL_NOOP_ID),
      new PublicKey(MPL_ACCOUNT_COMPRESSION_ID),
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      anchor.web3.SystemProgram.programId,
      this.program.programId,
      ...pageAddresses,
    ];

    const excluded = new Set(exclude.map((pk) => pk.toBase58()));
    return dedupePubkeys(baseAccounts.filter((pk) => pk && !excluded.has(pk.toBase58())));
  }

  /**
   * Ensures a lookup table exists for a market and contains reusable settle accounts.
   * Returns the transactions needed to create/extend the table.
   */
  async ensureMarketLookupTable({
    marketId,
    authority,
    payer,
    pageIndexes = [],
    additionalAddresses = [],
    existingLookupTable,
    excludeAddresses = [],
    creatorLookupTableAddress,
  }: {
    marketId: number;
    authority: PublicKey;
    payer?: PublicKey;
    pageIndexes?: number[];
    additionalAddresses?: (PublicKey | null | undefined)[];
    existingLookupTable?: PublicKey;
    excludeAddresses?: (PublicKey | null | undefined)[];
    creatorLookupTableAddress?: PublicKey;
  }): Promise<{
    lookupTableAddress: PublicKey;
    createTx?: VersionedTransaction;
    extendTxs: VersionedTransaction[];
  }> {
    const payerPk = payer ?? authority;
    let inheritedExclusions: PublicKey[] = [];
    if (creatorLookupTableAddress) {
      const { value } =
        await this.program.provider.connection.getAddressLookupTable(
          creatorLookupTableAddress
        );
      if (!value) {
        throw new Error("Creator lookup table not found/active");
      }
      // Drop creator LUT entries so we do not pay rent twice for shared accounts.
      inheritedExclusions = value.state.addresses;
    }
    const marketAddresses = await this.collectMarketLookupAddresses(
      marketId,
      pageIndexes,
      dedupePubkeys([
        ...excludeAddresses,
        ...inheritedExclusions,
      ] as (PublicKey | null | undefined)[])
    );
    const extraAddresses = dedupePubkeys(additionalAddresses ?? []);
    const targetAddresses = dedupePubkeys([
      ...marketAddresses,
      ...extraAddresses,
    ]);
    return ensureLookupTable(
      this.program,
      payerPk,
      targetAddresses,
      existingLookupTable
    );
  }

  /**
   * Extends an existing market lookup table with new market-level or proof nodes.
   * Does not create a table if it is missing.
   */
  async extendMarketLookupTable({
    marketId,
    authority,
    lookupTableAddress,
    pageIndexes = [],
    proofNodes = [],
    additionalAddresses = [],
    excludeAddresses = [],
    creatorLookupTableAddress,
  }: {
    marketId: number;
    authority: PublicKey;
    lookupTableAddress: PublicKey;
    pageIndexes?: number[];
    proofNodes?: (string | PublicKey)[];
    additionalAddresses?: (PublicKey | null | undefined)[];
    excludeAddresses?: (PublicKey | null | undefined)[];
    creatorLookupTableAddress?: PublicKey;
  }): Promise<{
    lookupTableAddress: PublicKey;
    extendTxs: VersionedTransaction[];
  }> {
    const payerPk = authority;
    let inheritedExclusions: PublicKey[] = [];
    if (creatorLookupTableAddress) {
      const { value } =
        await this.program.provider.connection.getAddressLookupTable(
          creatorLookupTableAddress
        );
      if (!value) {
        throw new Error("Creator lookup table not found/active");
      }
      // Ensures we only extend with genuinely new market or proof accounts.
      inheritedExclusions = value.state.addresses;
    }
    const marketAddresses = await this.collectMarketLookupAddresses(
      marketId,
      pageIndexes,
      dedupePubkeys([
        ...excludeAddresses,
        ...inheritedExclusions,
      ] as (PublicKey | null | undefined)[])
    );
    const proofAddresses = proofNodes.map((node) =>
      typeof node === "string" ? new PublicKey(node) : node
    );
    const extraAddresses = dedupePubkeys(additionalAddresses ?? []);
    const targetAddresses = dedupePubkeys([
      ...marketAddresses,
      ...proofAddresses,
      ...extraAddresses,
    ]);

    const { extendTxs } = await ensureLookupTable(
      this.program,
      payerPk,
      targetAddresses,
      lookupTableAddress
    );

    return { lookupTableAddress, extendTxs };
  }

  async buildMarketLookupTableCloseTxs({
    authority,
    lookupTableAddress,
    recipient,
  }: {
    authority: PublicKey;
    lookupTableAddress: PublicKey;
    recipient?: PublicKey;
  }): Promise<{
    deactivateTx: VersionedTransaction;
    closeTx: VersionedTransaction;
  }> {
    return buildLookupTableCloseTransactions(
      this.program,
      authority,
      lookupTableAddress,
      recipient
    );
  }

  async ensureMarketCreatorLookupTable({
    authority,
    payer,
    additionalAddresses = [],
    existingLookupTable,
  }: {
    authority: PublicKey;
    payer?: PublicKey;
    additionalAddresses?: (PublicKey | null | undefined)[];
    existingLookupTable?: PublicKey;
  }): Promise<{
    lookupTableAddress: PublicKey;
    createTx?: VersionedTransaction;
    extendTxs: VersionedTransaction[];
  }> {
    // Creator LUT holds shared state: config, creator PDA, tree + program IDs.
    const creatorAddresses = await this.collectCreatorLookupAddresses(authority);
    const extraAddresses = dedupePubkeys(additionalAddresses ?? []);
    const targetAddresses = dedupePubkeys([
      ...creatorAddresses,
      ...extraAddresses,
    ]);
    return ensureLookupTable(
      this.program,
      payer ?? authority,
      targetAddresses,
      existingLookupTable
    );
  }

  async extendMarketCreatorLookupTable({
    authority,
    lookupTableAddress,
    additionalAddresses = [],
  }: {
    authority: PublicKey;
    lookupTableAddress: PublicKey;
    additionalAddresses?: (PublicKey | null | undefined)[];
  }): Promise<{
    lookupTableAddress: PublicKey;
    extendTxs: VersionedTransaction[];
  }> {
    // Extend creator LUT when shared infra (e.g. helper PDAs) changes.
    const creatorAddresses = await this.collectCreatorLookupAddresses(authority);
    const extraAddresses = dedupePubkeys(additionalAddresses ?? []);
    const targetAddresses = dedupePubkeys([
      ...creatorAddresses,
      ...extraAddresses,
    ]);
    const { extendTxs } = await ensureLookupTable(
      this.program,
      authority,
      targetAddresses,
      lookupTableAddress
    );
    return { lookupTableAddress, extendTxs };
  }

  async buildMarketCreatorLookupTableCloseTxs({
    authority,
    lookupTableAddress,
    recipient,
  }: {
    authority: PublicKey;
    lookupTableAddress: PublicKey;
    recipient?: PublicKey;
  }): Promise<{
    deactivateTx: VersionedTransaction;
    closeTx: VersionedTransaction;
  }> {
    return buildLookupTableCloseTransactions(
      this.program,
      authority,
      lookupTableAddress,
      recipient
    );
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
                : new PublicKey("HX5YhqFV88zFhgPxEzmR1GFq8hPccuk2gKW58g1TLvbL"), // if manual resolution, pass a dummy oracle pubkey
            market: marketPDA,
            positionPage0: positionPage0PDA,
            mint: marketMint,
            // Include derived market vault ATA as required by IDL (authority = market PDA)
            marketVault: getAssociatedTokenAddressSync(
              marketMint,
              marketPDA,
              true,
              TOKEN_PROGRAM_ID
            ),
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
    { marketId, amount, direction, payer, metadataUri }: OpenOrderArgs,
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
    const CORE_PROGRAM_ID = new PublicKey(MPL_CORE_PROGRAM_ID);
    const CORE_CPI_SIGNER_ID = new PublicKey(MPL_CORE_CPI_SIGNER);

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
            market: marketPDA,
            marketCreator: marketCreatorPubkey,
            mint: marketMint,
            userMintAta: userMintAta,
            marketVault: marketVault,
            merkleTree: merkleTree,
            collection: collection,
            treeConfig: treeConfig,
            mplCoreCpiSigner: CORE_CPI_SIGNER_ID,
            mplCoreProgram: CORE_PROGRAM_ID,
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

  async buildSettleInstructionWithProof({
    marketId,
    claimer,
    assetId,
    pageIndex,
    slotIndex,
    proof,
  }: {
    marketId: number;
    claimer: PublicKey;
    assetId: PublicKey;
    pageIndex: number;
    slotIndex?: number | null;
    proof: {
      root: number[] | Uint8Array;
      dataHash: number[] | Uint8Array;
      creatorHash: number[] | Uint8Array;
      nonce: number | BN;
      leafIndex: number;
      proofNodes: (string | PublicKey)[];
    };
  }): Promise<{
    instruction: TransactionInstruction;
    lookupAddresses: PublicKey[];
    resolvedSlotIndex: number;
    resolvedPageIndex: number;
  }> {
    const configPda = getConfigPDA(this.program.programId);
    const marketPda = getMarketPDA(this.program.programId, marketId);
    const marketAccount = await this.program.account.marketState.fetch(
      marketPda
    );
    const marketCreator = marketAccount.marketCreator as PublicKey;
    const marketMint = marketAccount.mint as PublicKey;
    const marketVault = marketAccount.marketVault as PublicKey;

    const claimerMintAta = getAssociatedTokenAddressSync(
      marketMint,
      claimer,
      false,
      TOKEN_PROGRAM_ID
    );

    // Fetch market creator to access merkleTree and coreCollection
    const marketCreatorAccount = await this.program.account.marketCreator.fetch(
      marketCreator
    );
    const merkleTree = marketCreatorAccount.merkleTree as PublicKey;
    const collection = marketCreatorAccount.coreCollection as PublicKey;
    const treeConfig = getTreeConfigPDA(merkleTree);

    const resolvedPageIndex = pageIndex;
    let resolvedSlotIndex = slotIndex ?? null;

    const positionPage = getPositionPagePDA(
      this.program.programId,
      marketId,
      resolvedPageIndex
    );
    const pageAccount = await this.program.account.positionPage.fetch(
      positionPage
    );

    if (resolvedSlotIndex === null || resolvedSlotIndex === undefined) {
      for (let i = 0; i < pageAccount.entries.length; i++) {
        if (pageAccount.entries[i].assetId.equals(assetId)) {
          resolvedSlotIndex = i;
          break;
        }
      }
      if (resolvedSlotIndex === null || resolvedSlotIndex === undefined) {
        throw new Error(
          `Position with asset ${assetId.toBase58()} not found on page ${resolvedPageIndex}`
        );
      }
    }

    const proofMetas = proof.proofNodes.map((node) => {
      const pubkey = typeof node === "string" ? new PublicKey(node) : node;
      return {
        pubkey,
        isWritable: false,
        isSigner: false,
      };
    });

    const nonceBn = BN.isBN(proof.nonce)
      ? proof.nonce
      : new BN(proof.nonce);

    const instruction = await this.program.methods
      .settlePosition({
        pageIndex: resolvedPageIndex,
        slotIndex: resolvedSlotIndex,
        assetId,
        root: Array.from(proof.root),
        dataHash: Array.from(proof.dataHash),
        creatorHash: Array.from(proof.creatorHash),
        nonce: nonceBn,
        leafIndex: proof.leafIndex,
      })
      .accountsPartial({
        claimer,
        market: marketPda,
        config: configPda,
        marketCreator,
        positionPage,
        mint: marketMint,
        claimerMintAta,
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
      .remainingAccounts(proofMetas)
      .instruction();

    const lookupExtras: (PublicKey | null | undefined)[] = [
      marketPda,
      configPda,
      marketCreator,
      positionPage,
      marketMint,
      marketVault,
      collection,
      merkleTree,
      new PublicKey(MPL_CORE_CPI_SIGNER),
      new PublicKey(MPL_CORE_PROGRAM_ID),
      treeConfig,
      new PublicKey(MPL_BUBBLEGUM_ID),
      new PublicKey(MPL_NOOP_ID),
      new PublicKey(MPL_ACCOUNT_COMPRESSION_ID),
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      anchor.web3.SystemProgram.programId,
      this.program.programId,
    ];

    const combinedLookup = dedupePubkeys([
      ...proofMetas.map((m) => m.pubkey),
      ...lookupExtras,
    ]);
    const excludeSet = new Set<string>([
      claimer.toBase58(),
      claimerMintAta.toBase58(),
    ]);
    // Do not leak claimer-specific accounts into reusable LUTs.
    const lookupAddresses = combinedLookup.filter(
      (pk) => !excludeSet.has(pk.toBase58())
    );

    return {
      instruction,
      lookupAddresses,
      resolvedSlotIndex,
      resolvedPageIndex,
    };
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
    const marketCreatorPubkey = marketAccount.marketCreator;
    // creator_fee_vault_ata must be for authority = marketCreator.feeVault
    const marketCreatorAccount = await this.program.account.marketCreator.fetch(
      marketCreatorPubkey
    );
    const creatorFeeVaultAta = getAssociatedTokenAddressSync(
      marketMint,
      marketCreatorAccount.feeVault,
      true,
      TOKEN_PROGRAM_ID
    );

    const configPDA = getConfigPDA(this.program.programId);

    const configAccount = await this.program.account.config.fetch(configPDA);
    const protocolFeeVault = configAccount.feeVault;


    const feeVaultMintAta = getAssociatedTokenAddressSync(
      marketMint,
      protocolFeeVault,
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
            protocolFeeVault: protocolFeeVault,
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
          .accountsPartial({
            signer: payer,
            market: getMarketPDA(this.program.programId, marketId),
            systemProgram: anchor.web3.SystemProgram.programId,
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
    { marketId, payer, assetId, rpcEndpoint, returnMode = "ixs" }: PayoutArgs,
    options?: RpcOptions
  ): Promise<
    | PayoutPositionIxResult
    | PayoutPositionMessageResult
    | PayoutPositionTxResult
  > {
    // Inputs are web3.PublicKey only
    const payerPk: PublicKey = payer;
    const assetPk: PublicKey = assetId;
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
      payerPk,
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
    // Choose DAS RPC endpoint with precedence
    const dasEndpoint = rpcEndpoint;
    if (!dasEndpoint) {
      throw new Error("MISSING_DAS_RPC: Provide rpcEndpoint");
    }

    const {
      root: rootBytes,
      dataHash: dataHashBytes,
      creatorHash: creatorHashBytes,
      nonce,
      index,
    } = await fetchAssetProofWithRetry(assetPk, dasEndpoint);

    // Search for the asset ID across all pages
    const pages = await this.position.getAllPositionPagesForMarket(marketId);
    let foundPageIndex = -1;
    let foundSlotIndex = -1;

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
          if (entry.assetId.equals(assetPk)) {
            foundPageIndex = page.pageIndex;
            foundSlotIndex = slotIndex;
            break;
          }
        }

        if (foundPageIndex !== -1) break;
      } catch (error) {
        // Page might not exist, continue searching
        continue;
      }
    }

    if (foundPageIndex === -1) {
      throw new Error(
        `Position with asset ID ${assetPk.toBase58()} not found in market ${marketId}`
      );
    }

    try {
      const positionPage = getPositionPagePDA(
        this.program.programId,
        marketId,
        foundPageIndex
      );
      ixs.push(
        await this.program.methods
          .settlePosition({
            pageIndex: foundPageIndex,
            slotIndex: foundSlotIndex,
            assetId: assetPk,
            root: Array.from(rootBytes),
            dataHash: Array.from(dataHashBytes),
            creatorHash: Array.from(creatorHashBytes),
            nonce: new BN(nonce),
            leafIndex: index,
          })
          .accountsPartial({
            claimer: payerPk,
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

    if (!ixs || ixs.length === 0) {
      throw new Error(
        "NO_PAYOUT_INSTRUCTIONS: Builder produced no instructions; check marketId/assetId/payer/feeVault"
      );
    }

    // Standardize return shapes
    if (returnMode === "ixs") {
      const result: PayoutPositionIxResult = {
        ixs,
        alts: [],
        instructions: ixs,
        addressLookupTableAccounts: [],
      };
      return result;
    }

    if (returnMode === "message") {
      const { message, alts } = await buildV0Message(
        this.program,
        ixs,
        payerPk,
        []
      );
      const result: PayoutPositionMessageResult = { message, alts };
      return result;
    }

    // default to transaction
    const tx = await createVersionedTransaction(
      this.program,
      ixs,
      payerPk,
      options
    );
    const txResult: PayoutPositionTxResult = { transaction: tx, alts: [] };
    return txResult;
  }
}
