import { Program } from "@coral-xyz/anchor";
import { Depredict } from "./types/depredict.js";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { getMarketCreatorPDA, getTreeConfigPDA } from "./utils/pda/index.js";

export default class MarketCreatorSDK {
  constructor(private program: Program<Depredict>) {}

  /**
   * Create a MarketCreator account (owned by signer)
   * @param name - MarketCreator name
   * @param feeVault - Fee vault public key
   * @param creatorFeeBps - Creator fee in basis points
   * @param signer - Signer public key
   * @returns {Promise<{ixs: TransactionInstruction[], marketCreator: PublicKey}>} - Transaction instructions and MarketCreator public key
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
   * @param signer - Signer public key
   * @param coreCollection - Core collection public key
   * @param merkleTree - Merkle tree public key
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
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
   * @param signer - Signer public key
   * @param newName - New name for the MarketCreator
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
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
  * @param signer - Signer public key
  * @param currentFeeVault - Current fee vault public key
  * @param newFeeVault - New fee vault public key
  * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
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
   * @param signer - Signer public key
   * @param creatorFeeBps - Creator fee in basis points
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
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
   * @param signer - Signer public key
   * @param newTree - New merkle tree public key
   * @returns {Promise<{ixs: TransactionInstruction[]}>} - Transaction instructions
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


