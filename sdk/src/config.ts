import { Program, BN, web3 } from "@coral-xyz/anchor";
import { Depredict } from "./types/depredict.js";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getConfigPDA } from "./utils/pda/index.js";
import Trade from "./trade.js";

export default class Config {
  ADMIN_KEY: PublicKey;
  FEE_VAULT: PublicKey;
  USDC_MINT: PublicKey;
  trade: Trade;
  constructor(private program: Program<Depredict>, adminKey: PublicKey, feeVault: PublicKey, usdcMint: PublicKey) {
    this.ADMIN_KEY = adminKey;
    this.FEE_VAULT = feeVault;
    this.USDC_MINT = usdcMint;
    this.trade = new Trade(this.program, this.ADMIN_KEY, this.FEE_VAULT, this.USDC_MINT);
  }

  /**
   * Init a config account to maintain details
   *
   */
  async createConfig(feeAmount: number, payer: PublicKey) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs: TransactionInstruction[] = [];
    const feeAmountBN = new BN(feeAmount);
    ixs.push(
      await this.program.methods
        .initializeConfig(feeAmountBN)
        .accountsPartial({
          signer: payer,
          feeVault: this.FEE_VAULT,
          config: configPDA,
          systemProgram: web3.SystemProgram.programId,
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
    const feeAmountBN = feeAmount ? new BN(feeAmount) : null;
    const authorityBN = authority || null;
    const feeVaultBN = feeVault || null;
    ixs.push(
      await this.program.methods
        .updateConfig(feeAmountBN, authorityBN, feeVaultBN)
        .accountsPartial({
          signer: this.ADMIN_KEY,
          feeVault: this.FEE_VAULT,
          config: configPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
    // sendVersionedTransaction(this.program, ixs, payer);
  }

  /**
   * Close a config account
   * @param payer - PublicKey of the payer
   * @returns TransactionInstruction[] - Array of TransactionInstruction
   */
  async closeConfig(payer: PublicKey) {
    const configPDA = getConfigPDA(this.program.programId);
    const markets = await this.trade.getAllMarkets();
    if(markets.length > 0){
      throw new Error("Cannot close config with active markets");
    }
    const ixs: TransactionInstruction[] = [];
    try{
    ixs.push(
      await this.program.methods.closeConfig().accountsPartial({
        signer: this.ADMIN_KEY,
        config: configPDA,
        systemProgram: web3.SystemProgram.programId,
      }).instruction()
    );
  }catch(error){
    console.error("Error closing config:", error);
    throw error;
  }
    return ixs;
  }
}