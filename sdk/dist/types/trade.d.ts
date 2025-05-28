import { PublicKey } from '@solana/web3.js';
export type Market = {
    address: string;
    bump: number;
    authority: string;
    marketId: string;
    yesLiquidity: string;
    noLiquidity: string;
    volume: string;
    updateTs: string;
    nextOrderId: string;
    marketState: MarketStates;
    marketStart: string;
    marketEnd: string;
    question: string;
    winningDirection: WinningDirection;
};
export type MarketStates = {
    active: {};
} | {
    ended: {};
} | {
    resolving: {};
} | {
    resolved: {};
};
export type UserTrade = {
    user: string;
    totalDeposits: string;
    totalWithdraws: string;
    orders: Order[];
    nonce: string;
    isSubUser: boolean;
};
export type Order = {
    ts: string;
    orderId: string;
    marketId: string;
    orderStatus: OrderStatus;
    price: string;
    version: string;
    orderDirection: OrderDirection;
    userNonce: string;
    authority: string;
    createdAt: string;
};
export declare enum WinningDirection {
    NONE = "None",
    YES = "Yes",
    NO = "No",
    DRAW = "Draw"
}
export declare enum OrderDirection {
    YES = "yes",
    NO = "no"
}
export declare enum OrderStatus {
    INIT = "init",
    OPEN = "open",
    CLOSED = "closed",
    CLAIMED = "claimed",
    LIQUIDATED = "liquidated",
    WAITING = "waiting"
}
export type InitializeMarketArgs = {
    marketId: number;
    startTime: number;
    endTime: number;
    question: string;
    feeBps: number;
    customer: PublicKey | null;
};
export type CreateCustomerArgs = {
    id: number;
    name: string;
    authority: PublicKey;
    feeRecipient: PublicKey;
};
export type OpenOrderArgs = {
    marketId: number;
    amount: number;
    token: string;
    direction: {
        yes: {};
    } | {
        no: {};
    };
    mint: PublicKey;
};
export type CreateMarketArgs = {
    marketId: number;
    startTime: number;
    endTime: number;
    question: string;
    feeBps: number;
    customer: PublicKey | null;
    payoutFee: number;
    mint: PublicKey;
    poolId?: number;
};
