import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import Trade from "./trade";
export default class Config {
    private program;
    ADMIN_KEY: PublicKey;
    FEE_VAULT: PublicKey;
    USDC_MINT: PublicKey;
    trade: Trade;
    constructor(program: Program<ShortxContract>, adminKey: PublicKey, feeVault: PublicKey, usdcMint: PublicKey);
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
        nextMarketId: anchor.BN;
        numMarkets: anchor.BN;
    } | null>;
    /**
     * Update a config account to maintain details
     *
     */
    updateConfig(payer: PublicKey, feeAmount?: number, authority?: PublicKey, feeVault?: PublicKey): Promise<TransactionInstruction[]>;
    /**
     * Close a config account
     * @param payer - PublicKey of the payer
     * @returns TransactionInstruction[] - Array of TransactionInstruction
     */
    closeConfig(payer: PublicKey): Promise<TransactionInstruction[]>;
}
