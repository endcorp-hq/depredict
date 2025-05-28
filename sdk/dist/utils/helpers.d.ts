import { Market, Order, OrderDirection, OrderStatus, UserTrade, WinningDirection, MarketStates } from '../types/trade';
import { PublicKey } from '@solana/web3.js';
import { IdlAccounts } from '@coral-xyz/anchor';
import { ShortxContract } from '../types/shortx';
export declare const encodeString: (value: string, alloc?: number) => number[];
export declare const decodeString: (bytes: number[]) => string;
export declare const formatMarket: (account: IdlAccounts<ShortxContract>["marketState"], address: PublicKey) => Market;
export declare const formatUserTrade: (account: IdlAccounts<ShortxContract>["userTrade"], publicKey: PublicKey) => UserTrade;
export declare const formatOrder: (order: IdlAccounts<ShortxContract>["userTrade"]["orders"][number], authority?: string) => Order;
export declare const getMarketState: (status: IdlAccounts<ShortxContract>["marketState"]["marketState"]) => MarketStates;
export declare const getWinningDirection: (direction: IdlAccounts<ShortxContract>["marketState"]["winningDirection"]) => WinningDirection;
export declare const getTokenProgram: (mint: PublicKey) => PublicKey;
export declare const getOrderDirection: (direction: {
    yes: {};
} | {
    no: {};
}) => OrderDirection;
export declare const getOrderStatus: (status: {
    init: {};
} | {
    open: {};
} | {
    closed: {};
} | {
    claimed: {};
} | {
    liquidated: {};
} | {
    waiting: {};
}) => OrderStatus;
