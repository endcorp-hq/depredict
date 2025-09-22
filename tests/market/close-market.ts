import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Depredict } from "../../target/types/depredict";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { ADMIN, FEE_VAULT, program } from "../constants";
import { getUsdcMint, getCurrentMarketId } from "../helpers";

describe("depredict", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Depredict as Program<Depredict>;
  const admin = ADMIN;
  const feeVault = FEE_VAULT;


  let localMintPubkey: PublicKey;
  let feeVaultTokenAccount: PublicKey;

  before(async () => {
    const { mint: localMintKey, } = await getUsdcMint();
    localMintPubkey = localMintKey;
    console.log(`Loaded local token mint: ${localMintPubkey.toString()}`);

    try {
      feeVaultTokenAccount = (
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
      const marketId = await getCurrentMarketId(); // Get the current market ID

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

      // Derive market creator PDA
      const [marketCreatorPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market_creator"), admin.publicKey.toBytes()],
        program.programId
      );

      // Before closing, prune positions and close empty pages to reclaim rent
      const marketAccount: any = await program.account.marketState.fetch(marketPda);
      const pagesAllocated = Number(marketAccount.pagesAllocated || 0);
      for (let i = 0; i < pagesAllocated; i++) {
        const pageIndexBuf = Buffer.from(new Uint16Array([i]).buffer);
        const [positionPagePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("pos_page"), marketId.toArrayLike(Buffer, "le", 8), pageIndexBuf],
          program.programId
        );

        const pageInfo = await anchor.getProvider().connection.getAccountInfo(positionPagePda);
        if (!pageInfo) continue; // Page may not exist

        try {
          const page: any = await program.account.positionPage.fetch(positionPagePda);
          // Prune any Claimed/Closed slots
          for (let s = 0; s < page.entries.length; s++) {
            const st = page.entries[s].status;
            const isClaimed = !!st["claimed"];
            const isClosed = !!st["closed"];
            if (isClaimed || isClosed) {
              try {
                await program.methods
                  .prunePosition({ pageIndex: i, slotIndex: s })
                  .accounts({ signer: admin.publicKey, market: marketPda, marketCreator: marketCreatorPda, positionPage: positionPagePda })
                  .signers([admin])
                  .rpc();
              } catch (_) {}
            }
          }

          // Refetch and attempt to close if empty
          const afterPrune: any = await program.account.positionPage.fetch(positionPagePda);
          if (Number(afterPrune.count) === 0) {
            try {
              await program.methods
                .closePositionPage({ pageIndex: i })
                .accounts({ signer: admin.publicKey, market: marketPda, marketCreator: marketCreatorPda, positionPage: positionPagePda })
                .signers([admin])
                .rpc();
              console.log(`Closed empty PositionPage index ${i}`);
            } catch (e) {
              console.log(`Could not close PositionPage index ${i}:`, (e as any).message);
            }
          }
        } catch (e) {
          // If cannot fetch, skip
          continue;
        }
      }

      await program.methods
        .closeMarket({
          marketId,
        })
        .accountsPartial({
          signer: admin.publicKey,
          feeVault: feeVault.publicKey,
          market: marketPda,
          mint: localMintPubkey,
          feeVaultMintAta: feeVaultTokenAccount,
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
