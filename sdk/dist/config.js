import { getConfigPDA } from "./utils/pda";
import * as anchor from "@coral-xyz/anchor";
import Trade from "./trade";
export default class Config {
    constructor(program, adminKey, feeVault, usdcMint) {
        this.program = program;
        this.ADMIN_KEY = adminKey;
        this.FEE_VAULT = feeVault;
        this.USDC_MINT = usdcMint;
        this.trade = new Trade(this.program, this.ADMIN_KEY, this.FEE_VAULT, this.USDC_MINT);
    }
    /**
     * Init a config account to maintain details
     *
     */
    async createConfig(feeAmount, payer) {
        const configPDA = getConfigPDA(this.program.programId);
        const ixs = [];
        const feeAmountBN = new anchor.BN(feeAmount);
        ixs.push(await this.program.methods
            .initializeConfig(feeAmountBN)
            .accountsPartial({
            signer: payer,
            feeVault: this.FEE_VAULT,
            config: configPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
            .instruction());
        return ixs;
    }
    /**
     * Get a config account to maintain details if it exists
     *
     */
    async getConfig() {
        const configPDA = getConfigPDA(this.program.programId);
        try {
            const config = await this.program.account.config.fetch(configPDA);
            return config;
        }
        catch (error) {
            console.error("Error fetching config or config does not exist:", error);
            return null;
        }
    }
    /**
     * Update a config account to maintain details
     *
     */
    async updateConfig(payer, feeAmount, authority, feeVault) {
        const configPDA = getConfigPDA(this.program.programId);
        const ixs = [];
        const feeAmountBN = feeAmount ? new anchor.BN(feeAmount) : null;
        const authorityBN = authority || null;
        const feeVaultBN = feeVault || null;
        ixs.push(await this.program.methods
            .updateConfig(feeAmountBN, authorityBN, feeVaultBN)
            .accountsPartial({
            signer: this.ADMIN_KEY,
            feeVault: this.FEE_VAULT,
            config: configPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
            .instruction());
        return ixs;
        // sendVersionedTransaction(this.program, ixs, payer);
    }
    /**
     * Close a config account
     * @param payer - PublicKey of the payer
     * @returns TransactionInstruction[] - Array of TransactionInstruction
     */
    async closeConfig(payer) {
        const configPDA = getConfigPDA(this.program.programId);
        const markets = await this.trade.getAllMarkets();
        if (markets.length > 0) {
            throw new Error("Cannot close config with active markets");
        }
        const ixs = [];
        try {
            ixs.push(await this.program.methods.closeConfig().accountsPartial({
                signer: this.ADMIN_KEY,
                config: configPDA,
                systemProgram: anchor.web3.SystemProgram.programId,
            }).instruction());
        }
        catch (error) {
            console.error("Error closing config:", error);
            throw error;
        }
        return ixs;
    }
}
