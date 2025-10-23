import { Program, BN, web3 } from "@coral-xyz/anchor";
import { Depredict } from "./types/depredict.js";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getConfigPDA } from "./utils/pda/index.js";
import { encodeString } from "./utils/helpers.js";

export default class Config {
  constructor(
    private program: Program<Depredict>,
  ) {}

  /**
   * Init a config account to maintain details
   * Note: Fee amount is in basis points, 100 = 1% - max hardcoded at is 2%
   * @param feeAmount - Fee amount in basis points
   * @param payer - Payer public key
   * @param feeVault - Fee vault public key
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
   */
  async createConfig(feeAmount: number, payer: PublicKey, feeVault: PublicKey) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs: TransactionInstruction[] = [];
    ixs.push(
      await this.program.methods
        .initializeConfig(feeAmount)
        .accountsPartial({
          signer: payer,
          feeVault: feeVault,
          config: configPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
  }

  /**
   * Get a config account to maintain details if it exists
   * @returns {Promise<Config>} - Config account
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
   * @param feeAmount - Fee amount in basis points
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
   */
  async updateFee(feeAmount: number) {
    const configPDA = getConfigPDA(this.program.programId);
    const configAccount = await this.program.account.config.fetch(configPDA);
    const feeVault = configAccount.feeVault;
    const payer = configAccount.authority;
    const ixs: TransactionInstruction[] = [];
    ixs.push(
      await this.program.methods
        .updateFeeAmount(feeAmount)
        .accountsPartial({
          signer: payer,
          feeVault: feeVault,
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
   * @param newFeeVault - New fee vault public key
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
   */
  async updateFeeVault(newFeeVault: PublicKey) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs: TransactionInstruction[] = [];
    const configAccount = await this.program.account.config.fetch(configPDA);
    const currentFeeVault = configAccount.feeVault;
    const payer = configAccount.authority;
    ixs.push(
      await this.program.methods
        .updateFeeVault(newFeeVault)
        .accountsPartial({
          signer: payer,
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
   * Update base URI (fixed 200 bytes)
   * @param baseUri - New base URI
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
   */
  async updateBaseUri(baseUri: string) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs: TransactionInstruction[] = [];
    const configAccount = await this.program.account.config.fetch(configPDA);
    const payer = configAccount.authority;
    const feeVault = configAccount.feeVault;
    const baseUriBytes = encodeString(baseUri, 200);
    ixs.push(
      await this.program.methods
        .updateBaseUri(baseUriBytes)
        .accountsPartial({
          signer: payer,
          feeVault: feeVault,
          config: configPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
  }

  /**
   * Update the authority for the config account
   * @param newAuthority - New authority public key
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
   */
  async updateAuthority(newAuthority: PublicKey) {
    const configPDA = getConfigPDA(this.program.programId);
    const ixs: TransactionInstruction[] = [];
    const configAccount = await this.program.account.config.fetch(configPDA);
    const payer = configAccount.authority;
    const feeVault = configAccount.feeVault;
    ixs.push(
      await this.program.methods
        .updateAuthority(newAuthority)
        .accountsPartial({
          signer: payer,
          feeVault: feeVault,
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
   * @param payer - Payer public key
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
   */
  async closeConfig(payer: PublicKey) {
    const configPDA = getConfigPDA(this.program.programId);
    const markets = await this.program.account.marketState.all();
    if (markets.length > 0) {
      throw new Error("Cannot close config with active markets");
    }
    const ixs: TransactionInstruction[] = [];
    try {
      ixs.push(
        await this.program.methods
          .closeConfig()
          .accountsPartial({
            signer: payer,
            config: configPDA,
            systemProgram: web3.SystemProgram.programId,
          })
          .instruction()
      );
    } catch (error) {
      console.error("Error closing config:", error);
      throw error;
    }
    return ixs;
  }
}
