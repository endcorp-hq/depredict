import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getConfigPDA } from "./utils/pda";
import * as anchor from "@coral-xyz/anchor";

export default class Config {
  ADMIN_KEY: PublicKey;
  FEE_VAULT: PublicKey;
  USDC_MINT: PublicKey;
  constructor(
    private program: Program<ShortxContract>,
    adminKey: PublicKey,
    feeVault: PublicKey,
    usdcMint: PublicKey
  ) {
    this.ADMIN_KEY = adminKey;
    this.FEE_VAULT = feeVault;
    this.USDC_MINT = usdcMint;
  }

  /**
   * Init a config account to maintain details
   *
   */
  async createConfig(feeAmount: number) {
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
  }
}
