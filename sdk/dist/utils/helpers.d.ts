import { Market, WinningDirection, MarketStates } from '../types/trade';
import { PublicKey } from '@solana/web3.js';
import { IdlAccounts } from '@coral-xyz/anchor';
import { ShortxContract } from '../types/shortx';
import { PositionAccount, Position, PositionDirection, PositionStatus } from '../types/position';
export declare const encodeString: (value: string, alloc?: number) => number[];
export declare const decodeString: (bytes: number[]) => string;
export declare const formatMarket: (account: IdlAccounts<ShortxContract>["marketState"], address: PublicKey) => Market;
export declare const formatPositionAccount: (account: IdlAccounts<ShortxContract>["positionAccount"], marketId: number) => PositionAccount;
export declare const formatPosition: (position: IdlAccounts<ShortxContract>["positionAccount"]["positions"][number], authority?: string) => Position;
export declare const getMarketState: (status: IdlAccounts<ShortxContract>["marketState"]["marketState"]) => MarketStates;
export declare const getWinningDirection: (direction: IdlAccounts<ShortxContract>["marketState"]["winningDirection"]) => WinningDirection;
export declare const getTokenProgram: (mint: PublicKey) => PublicKey;
export declare const getPositionDirection: (direction: {
    yes: {};
} | {
    no: {};
}) => PositionDirection;
export declare const getPositionStatus: (status: {
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
}) => PositionStatus;
