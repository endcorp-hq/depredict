import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { localMint, admin, feeVault, program, marketId } from "../helpers";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);



  let localMintPubkey: PublicKey;

  before(async () => {
    localMintPubkey = localMint.publicKey;
    console.log(`Loaded local token mint: ${localMintPubkey.toString()}`);

    try {
      const feeVaultTokenAccount = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          admin, // Payer
          localMintPubkey,
          feeVault.publicKey,
        )
      ).address;
      console.log(
        `Fee Vault ATA (${localMintPubkey.toString()}): ${feeVaultTokenAccount.toString()}`
      );

      const mintAmount = new anchor.BN(1_000_000 * 10 ** 6); // 1 Million tokens with 6 decimals
      await mintTo(
        provider.connection,
        admin, // Payer
        localMintPubkey,
        feeVaultTokenAccount,
        admin.publicKey, // Mint Authority
        mintAmount.toNumber(), // Amount (beware of JS number limits for large amounts)
      );
      console.log(`Minted ${mintAmount.toString()} tokens to fee vault ATA`);
    } catch (error) {
      console.error("Error minting tokens:", error);
      throw error;
    }
  });

  describe("Market", () => {
    it("Closes market", async () => {


      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      console.log("Market PDA:", marketPda.toString());

      await program.methods
        .closeMarket({
          marketId,
        })
        .accountsPartial({
          signer: admin.publicKey,
          feeVault: feeVault.publicKey,
          market: marketPda,
          usdcMint: localMintPubkey,
          config: configPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc({
          skipPreflight: true,
        });
    });
  });
});
