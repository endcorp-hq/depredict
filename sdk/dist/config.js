import { PublicKey } from "@solana/web3.js";
import { getConfigPDA } from "./utils/pda";
import { ADMIN_KEY, FEE_VAULT } from "./utils/constants";
import * as anchor from "@coral-xyz/anchor";
export default class Config {
    constructor(program) {
        this.program = program;
    }
    /**
     * Init a config account to maintain details
     *
     */
    async createConfig(feeAmount) {
        const configPDA = getConfigPDA(this.program.programId);
        const ixs = [];
        const feeAmountBN = new anchor.BN(feeAmount);
        ixs.push(await this.program.methods
            .initializeConfig(feeAmountBN)
            .accountsPartial({
            signer: new PublicKey(ADMIN_KEY),
            feeVault: new PublicKey(FEE_VAULT),
            config: configPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
            .instruction());
    }
}
