import { Program, BN, web3 } from "@coral-xyz/anchor";
import { Depredict } from "./types/depredict.js";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getConfigPDA } from "./utils/pda/index.js";

export default class Config {
  ADMIN_KEY: PublicKey;
  FEE_VAULT: PublicKey;
  constructor(private program: Program<Depredict>, adminKey: PublicKey, feeVault: PublicKey) {
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
   * Update the fee amount for the config account
   *
   */
  async updateFee(
    feeAmount: number,
  ) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs: TransactionInstruction[] = [];
    const feeAmountBN = new BN(feeAmount);
    ixs.push(
      await this.program.methods
        .updateFeeAmount(feeAmountBN)
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
   * Update the fee vault for the config account
   *
   */
  async updateFeeVault(
    newFeeVault: PublicKey,
  ) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs: TransactionInstruction[] = [];
    const currentFeeVault = this.FEE_VAULT;
    ixs.push(
      await this.program.methods
        .updateFeeVault(newFeeVault)
        .accountsPartial({
          signer: this.ADMIN_KEY,
          feeVault: currentFeeVault,
          config: configPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
    // sendVersionedTransaction(this.program, ixs, payer);
  }

    /**
   * Update the authority for the config account
   *
   */
    async updateAuthority(
      newAuthority: PublicKey,
    ) {
      const configPDA = getConfigPDA(this.program.programId);
      const ixs: TransactionInstruction[] = [];
      const currentAuthority = this.ADMIN_KEY;
             ixs.push(
         await this.program.methods
           .updateAuthority(newAuthority)
           .accountsPartial({
             signer: this.ADMIN_KEY,
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
    const markets = await this.program.account.marketState.all();
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