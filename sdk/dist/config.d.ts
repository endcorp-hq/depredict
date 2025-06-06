import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
export default class Config {
    private program;
    ADMIN_KEY: PublicKey;
    FEE_VAULT: PublicKey;
    constructor(program: Program<ShortxContract>, adminKey: PublicKey, feeVault: PublicKey);
    /**
     * Init a config account to maintain details
     *
     */
    createConfig(feeAmount: number, payer: PublicKey): Promise<TransactionInstruction[]>;
    /**
     * Get a config account to maintain details if it exists
     *
     */
    getConfig(): Promise<{
        bump: number;
        authority: PublicKey;
        feeVault: PublicKey;
        feeAmount: anchor.BN;
        version: anchor.BN;
        numMarkets: anchor.BN;
    } | null>;
    /**
     * Update a config account to maintain details
     *
     */
    updateConfig(payer: PublicKey, feeAmount?: number, authority?: PublicKey, feeVault?: PublicKey): Promise<TransactionInstruction[]>;
}
