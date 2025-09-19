import { Program } from "@coral-xyz/anchor";
import { Depredict } from "./types/depredict.js";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { getMarketCreatorPDA, getTreeConfigPDA } from "./utils/pda/index.js";

export default class MarketCreatorSDK {
  constructor(private program: Program<Depredict>, private adminKey: PublicKey) {}

  /**
   * Create a MarketCreator account (owned by signer)
   */
  async createMarketCreator({ name, feeVault, creatorFeeBps, signer }: { name: string; feeVault: PublicKey; creatorFeeBps: number; signer: PublicKey; }) {
    const marketCreatorPDA = getMarketCreatorPDA(this.program.programId, signer);
    const ixs: TransactionInstruction[] = [];
    ixs.push(
      await this.program.methods
        .createMarketCreator({ name, feeVault, creatorFeeBps })
        .accountsPartial({
          signer,
          marketCreator: marketCreatorPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );
    return { ixs, marketCreator: marketCreatorPDA };
  }

  /**
   * Verify MarketCreator with collection and merkle tree
   */
  async verifyMarketCreator({ signer, coreCollection, merkleTree }: { signer: PublicKey; coreCollection: PublicKey; merkleTree: PublicKey; }) {
    const marketCreatorPDA = getMarketCreatorPDA(this.program.programId, signer);
    const ixs: TransactionInstruction[] = [];
    ixs.push(
      await this.program.methods
        .verifyMarketCreator({ coreCollection, merkleTree })
        .accountsPartial({
          signer,
          marketCreator: marketCreatorPDA,
          coreCollection,
          merkleTree,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
  }

  /**
   * Update MarketCreator name
   */
  async updateMarketCreatorName({ signer, newName }: { signer: PublicKey; newName: string; }) {
    const marketCreatorPDA = getMarketCreatorPDA(this.program.programId, signer);
    const ixs: TransactionInstruction[] = [];
    ixs.push(
      await this.program.methods
        .updateCreatorName(newName)
        .accountsPartial({
          signer,
          marketCreator: marketCreatorPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
  }  
  
  /**
  * Update MarketCreator feeVault
  * Note: Context requires merkleTree and treeConfig accounts even if only updating fields.
  */

  async updateMarketCreatorFeeVault({ signer, currentFeeVault, newFeeVault }: { signer: PublicKey; currentFeeVault: PublicKey; newFeeVault: PublicKey; }) {
    const marketCreatorPDA = getMarketCreatorPDA(this.program.programId, signer);
    const ixs: TransactionInstruction[] = [];
    ixs.push(
      await this.program.methods
        .updateCreatorFeeVault(currentFeeVault, newFeeVault)
        .accountsPartial({
          signer,
          marketCreator: marketCreatorPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
  }

  /**
   * Update MarketCreator fee
   * Note: Creator fee is in basis points, 100 = 1% - max hardcoded at is 2%
   */
  async updateMarketCreatorFee({ signer, creatorFeeBps }: { signer: PublicKey; creatorFeeBps: number; }) {
    const marketCreatorPDA = getMarketCreatorPDA(this.program.programId, signer);
    const ixs: TransactionInstruction[] = [];
    ixs.push(
      await this.program.methods
        .updateCreatorFee(creatorFeeBps)
        .accountsPartial({
          signer,
          marketCreator: marketCreatorPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
  }

  /**
   * Update MarketCreator merkle tree (validates tree authority)
   */
  async updateMerkleTree({ signer, newTree }: { signer: PublicKey; newTree: PublicKey; }) {
    const marketCreatorPDA = getMarketCreatorPDA(this.program.programId, signer);
    const treeConfig = getTreeConfigPDA(newTree);
    const ixs: TransactionInstruction[] = [];
    ixs.push(
      await this.program.methods
        .updateMerkleTree(newTree)
        .accountsPartial({
          signer,
          marketCreator: marketCreatorPDA,
          merkleTree: newTree,
          treeConfig,
          systemProgram: SystemProgram.programId,
        })
        .instruction()
    );
    return ixs;
  }
}


