import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CreateMarketArgs, OpenOrderArgs, MarketStates } from "./types/trade";
import { RpcOptions } from "./types/index";
import Position from "./position";
export default class Trade {
    private program;
    METAPLEX_PROGRAM_ID: anchor.web3.PublicKey;
    decimals: number;
    position: Position;
    ADMIN_KEY: PublicKey;
    FEE_VAULT: PublicKey;
    USDC_MINT: PublicKey;
    constructor(program: Program<ShortxContract>, adminKey: PublicKey, feeVault: PublicKey, usdcMint: PublicKey);
    /**
     * Get All Markets
     *
     */
    getAllMarkets(): Promise<import("./types/trade").Market[]>;
    /**
     * Get Market By ID
     * @param marketId - The ID of the market
     *
     */
    getMarketById(marketId: number): Promise<import("./types/trade").Market>;
    /**
     * Get Market By Address
     * @param address - The address of the market PDA
     *
     */
    getMarketByAddress(address: PublicKey): Promise<import("./types/trade").Market>;
    /**
     * Create Market
     * @param args.marketId - new markert id - length + 1
     * @param args.startTime - start time
     * @param args.endTime - end time
     * @param args.question - question (max 80 characters)
     * @param args.oraclePubkey - oracle pubkey
     * @param args.metadataUri - metadata uri
     * @param args.mintPublicKey - collection mint public key. This needs to sign the transaction.
     * @param args.payer - payer
     * @param options - RPC options
     *
     */
    createMarket({ startTime, endTime, question, oraclePubkey, metadataUri, payer, }: CreateMarketArgs, options?: RpcOptions): Promise<anchor.web3.VersionedTransaction>;
    /**
     * Open Order
     * @param args.marketId - The ID of the Market
     * @param args.amount - The amount of the Order
     * @param args.direction - The direction of the Order
     * @param args.mint - The mint of the Order
     * @param args.token - The token to use for the Order
     * @param args.payer - The payer of the Order
     * @param options - RPC options
     *
     */
    openPosition({ marketId, amount, direction, mint, token, payer }: OpenOrderArgs, options?: RpcOptions): Promise<{
        ixs: anchor.web3.TransactionInstruction[];
        addressLookupTableAccounts: anchor.web3.AddressLookupTableAccount[];
    } | undefined>;
    /**
     * Resolve Market
     * @param args.marketId - The ID of the Market
     * @param args.winningDirection - The Winning Direction of the Market
     *
     * @param options - RPC options
     *
     */
    resolveMarket({ marketId, winningDirection, payer, oraclePubkey, }: {
        marketId: number;
        winningDirection: {
            yes: {};
        } | {
            no: {};
        } | {
            none: {};
        } | {
            draw: {};
        };
        state: MarketStates;
        payer: PublicKey;
        oraclePubkey: PublicKey;
    }, options?: RpcOptions): Promise<anchor.web3.TransactionInstruction[]>;
    /**
     * Close Market and related accounts to collect remaining liquidity
     * @param marketId - The ID of the market
     * @param payer - The payer of the Market
     * @param options - RPC options
     *
     */
    closeMarket(marketId: number, payer: PublicKey, options?: RpcOptions): Promise<anchor.web3.TransactionInstruction[]>;
    /**
     * Payout Order
     * @param args.marketId - The ID of the Market
     * @param args.orderId - The ID of the Order to Payout
     * @param args.userNonce - The nonce of the user
     *
     * @param options - RPC options
     *
     */
    payoutOrder(orders: {
        marketId: number;
        orderId: number;
        userNonce: number;
    }[], payer: PublicKey, options?: RpcOptions): Promise<anchor.web3.TransactionInstruction[]>;
    /**
     * Update Market
     * @param marketId - The ID of the market
     * @param marketEnd - The end time of the market
     * @param options - RPC options
     *
     */
    updateMarket(marketId: number, marketEnd: number, payer: PublicKey, options?: RpcOptions): Promise<anchor.web3.TransactionInstruction[]>;
    payoutNft(nftPositions: {
        marketId: number;
        positionId: number;
        positionNonce: number;
    }[], payer: PublicKey, options?: RpcOptions): Promise<anchor.web3.TransactionInstruction[]>;
}
