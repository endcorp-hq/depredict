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
    getPositionAccountsForMarket(marketId: number): Promise<PositionAccount[]>;
    /**
     * Get User positions for a market
     * @param user - User PublicKey
     *
     */
    getUserPositions(user: PublicKey, marketId: number): Promise<import("./types/position").Position[]>;
    /**
     * Get the PDA for a position account
     * @param marketId - Market ID
     * @param marketAddress - Market Address
     * @param positionNonce - The nonce of the position account
     *
     */
    getPositionsAccountPda(marketId: number, positionNonce?: number): Promise<{
        bump: number;
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
            isNft: boolean;
            mint: PublicKey | null;
            authority: PublicKey | null;
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
        marketId: BN;
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
    createSubPositionAccount(marketId: number, payer: PublicKey, marketAddress: PublicKey, options?: RpcOptions): Promise<string | TransactionInstruction[]>;
    /**
     * Get position account Nonce With Slots
     * @param positionAccounts - Position Accounts
     *
     */
    getPositionAccountNonceWithSlots(positionAccounts: PositionAccount[]): PublicKey;
    getPositionAccountIxs(marketId: number): Promise<{
        positionAccountPDA: PublicKey;
        ixs: TransactionInstruction[];
    }>;
    mintExistingPosition(marketId: number, positionId: number, positionNonce: number, payer: PublicKey, metadataUri: string, collectionAuthority: PublicKey, options?: RpcOptions): Promise<void>;
}
