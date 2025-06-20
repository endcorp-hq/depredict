import { BN, Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { RpcOptions } from "./types";
import { PositionAccount } from "./types/position";
export default class Position {
    private program;
    METAPLEX_PROGRAM_ID: PublicKey;
    constructor(program: Program<ShortxContract>);
    /**
     * Get all Position Accounts for a Market
     * @param marketId - Market ID
     *
     */
    getPositionsAccountsForMarket(marketId: number): Promise<PositionAccount[]>;
    /**
     * Get all Positions for a user
     * @param user - User PublicKey
     *
     */
    /**
     * Get User positions for a particular market
     * @param user - User PublicKey
     * @param marketId - Market ID
     */
    /**
     * Get the PDA for a position account
     * @param marketId - Market ID
     * @param marketAddress - Market Address
     * @param positionNonce - The nonce of the position account
     *
     */
    getPositionsAccountPda(marketId: number, positionNonce?: number): Promise<{
        bump: number;
        marketId: BN;
        authority: PublicKey;
        version: BN;
        positions: {
            positionId: BN;
            marketId: BN;
            amount: BN;
            direction: ({
                no?: undefined;
            } & {
                yes: Record<string, never>;
            }) | ({
                yes?: undefined;
            } & {
                no: Record<string, never>;
            });
            createdAt: BN;
            ts: BN;
            mint: PublicKey | null;
            positionStatus: ({
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
            positionNonce: number;
            padding: number[];
            version: BN;
        }[];
        nonce: number;
        isSubPosition: boolean;
        padding: number[];
    }>;
    /**
     * Create Sub positions account
     * @param user - User PublicKey the main user
     * @param payer - Payer PublicKey
     * @param options - RPC options
     *
     */
    createSubPositionAccount(marketId: number, payer: PublicKey, marketAddress: PublicKey, options?: RpcOptions): Promise<TransactionInstruction[]>;
    /**
     * Get position account Nonce With Slots
     * @param positionAccounts - Position Accounts
     *
     */
    getPositionAccountNonceWithSlots(positionAccounts: PositionAccount[], payer: PublicKey): PublicKey;
    getPositionAccountIxs(marketId: number, payer: PublicKey): Promise<{
        positionAccountPDA: PublicKey;
        ixs: TransactionInstruction[];
    }>;
}
