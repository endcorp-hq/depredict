import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CreateMarketArgs, OpenOrderArgs, UserTrade, CreateCustomerArgs, MarketStates } from "./types/trade";
import { RpcOptions } from "./types/index";
export default class Trade {
    private program;
    decimals: number;
    constructor(program: Program<ShortxContract>);
    /**
     * Get All Markets
     *
     */
    getAllMarkets(): Promise<import("./types/trade").Market[]>;
    /**
     * Get My User Trades from a user authority
     * @param user - User PublicKey
     *
     */
    getMyUserTrades(user: PublicKey): Promise<UserTrade[]>;
    /**
     * Get User Orders
     * @param user - User PublicKey
     *
     */
    getUserOrders(user: PublicKey): Promise<import("./types/trade").Order[]>;
    /**
     * Get Market By ID
     * @param marketId - The ID of the market
     *
     */
    getMarketById(marketId: number): Promise<import("./types/trade").Market>;
    /**
     * Get Market By Address
     * @param address - The address of the market
     *
     */
    getMarketByAddress(address: PublicKey): Promise<import("./types/trade").Market>;
    /**
     * Get User Trade
     * @param user - User PublicKey
     * @param userNonce - The nonce of the user
     *
     */
    getUserTrade(user: PublicKey, userNonce?: number): Promise<{
        bump: number;
        authority: anchor.web3.PublicKey;
        totalDeposits: anchor.BN;
        totalWithdraws: anchor.BN;
        version: anchor.BN;
        orders: {
            ts: anchor.BN;
            orderId: anchor.BN;
            marketId: anchor.BN;
            orderStatus: ({
                open?: undefined;
                closed?: undefined;
                claimed?: undefined;
            } & {
                init: Record<string, never>;
            }) | ({
                init?: undefined;
                closed?: undefined;
                claimed?: undefined;
            } & {
                open: Record<string, never>;
            }) | ({
                init?: undefined;
                open?: undefined;
                claimed?: undefined;
            } & {
                closed: Record<string, never>;
            }) | ({
                init?: undefined;
                open?: undefined;
                closed?: undefined;
            } & {
                claimed: Record<string, never>;
            });
            price: anchor.BN;
            version: anchor.BN;
            orderDirection: ({
                no?: undefined;
            } & {
                yes: Record<string, never>;
            }) | ({
                yes?: undefined;
            } & {
                no: Record<string, never>;
            });
            userNonce: number;
            createdAt: anchor.BN;
            padding: number[];
        }[];
        nonce: number;
        isSubUser: boolean;
        padding: number[];
    }>;
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
    createMarket({ marketId, startTime, endTime, question, }: CreateMarketArgs, options?: RpcOptions): Promise<string>;
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
    openOrder({ marketId, amount, direction, mint, token }: OpenOrderArgs, options?: RpcOptions): Promise<string | undefined>;
    /**
     * Resolve Market
     * @param args.marketId - The ID of the Market
     * @param args.winningDirection - The Winning Direction of the Market
     *
     * @param options - RPC options
     *
     */
    resolveMarket({ marketId, winningDirection, state, }: {
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
    }, options?: RpcOptions): Promise<string>;
    /**
     * Collect Remaining Liquidity
     * @param marketId - The ID of the market
     *
     * @param options - RPC options
     *
     */
    closeMarket(marketId: number, options?: RpcOptions): Promise<anchor.web3.TransactionInstruction[]>;
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
        mint: PublicKey;
    }[], options?: RpcOptions): Promise<string>;
    /**
     * Allow Market to Payout
     * @param marketId - The ID of the market
     *
     * @param options - RPC options
     *
     */
    allowMarketToPayout(marketId: number, options?: RpcOptions): Promise<string>;
    /**
     * Create Sub User Trade
     * @param user - User PublicKey the main user
     *
     * @param options - RPC options
     *
     */
    createSubUserTrade(user: PublicKey, options?: RpcOptions): Promise<string>;
    /**
     * Update Market
     * @param marketId - The ID of the market
     * @param marketEnd - The end time of the market
     *
     * @param options - RPC options
     *
     */
    updateMarket(marketId: number, marketEnd: number, options?: RpcOptions): Promise<string>;
    /**
     * Create Customer
     * @param args.id - The ID of the customer
     * @param args.name - The name of the customer
     * @param args.authority - The authority of the customer
     *
     * @param options - RPC options
     *
     */
    createCustomer({ id, name, authority, feeRecipient }: CreateCustomerArgs, options?: RpcOptions): Promise<string>;
    /**
     * Get User Trade Nonce With Slots
     * @param userTrades - User Trades
     *
     */
    getUserTradeNonceWithSlots(userTrades: UserTrade[]): anchor.web3.PublicKey;
    getUserTradeIxs(): Promise<{
        userTradePDA: anchor.web3.PublicKey;
        ixs: anchor.web3.TransactionInstruction[];
        nonce: number;
    } | {
        userTradePDA: anchor.web3.PublicKey;
        ixs: anchor.web3.TransactionInstruction[];
        nonce?: undefined;
    }>;
}
