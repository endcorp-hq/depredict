import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getConfigPDA } from "./utils/pda";
import * as anchor from "@coral-xyz/anchor";

export default class Config {
  ADMIN_KEY: PublicKey;
  FEE_VAULT: PublicKey;
  constructor(private program: Program<ShortxContract>, adminKey: PublicKey, feeVault: PublicKey) {
    this.ADMIN_KEY = adminKey;
    this.FEE_VAULT = feeVault;
  }

  /**
   * Init a config account to maintain details
   *
   */
  async createConfig(feeAmount: number, payer: PublicKey) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs: TransactionInstruction[] = [];
    const feeAmountBN = new anchor.BN(feeAmount);
    ixs.push(
      await this.program.methods
        .initializeConfig(feeAmountBN)
        .accountsPartial({
          signer: this.ADMIN_KEY,
          feeVault: this.FEE_VAULT,
          config: configPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction()
    );
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
    } catch (error) {
      console.error("Error fetching config or config does not exist:", error);
      return null;
    }
  }

  /**
   * Update a config account to maintain details
   *
   */
  async updateConfig(
    payer: PublicKey,
    feeAmount?: number,
    authority?: PublicKey,
    feeVault?: PublicKey
  ) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs: TransactionInstruction[] = [];
    const feeAmountBN = feeAmount ? new anchor.BN(feeAmount) : null;
    const authorityBN = authority || null;
    const feeVaultBN = feeVault || null;
    ixs.push(
      await this.program.methods
        .updateConfig(feeAmountBN, authorityBN, feeVaultBN)
        .accountsPartial({
          signer: this.ADMIN_KEY,
          feeVault: this.FEE_VAULT,
          config: configPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
    // sendVersionedTransaction(this.program, ixs, payer);
  }
}