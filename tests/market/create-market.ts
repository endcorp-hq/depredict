import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../../target/types/shortx_contract";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import * as fs from "fs";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShortxContract as Program<ShortxContract>;
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./keypair.json", "utf-8")))
  );
  const feeVault = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./fee-vault.json", "utf-8")))
  );

  const localMint = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./local_mint.json", "utf-8")))
  );

  let localMintPubkey: PublicKey;

  before(async () => {
    localMintPubkey = localMint.publicKey;
    console.log(`Loaded local token mint: ${localMintPubkey.toString()}`);

    try {
      await createMint(
        provider.connection,
        admin, // Payer
        admin.publicKey, // Mint Authority
        null, // Freeze Authority (optional)
        6, // Decimals (like USDC)
        localMint // Mint Keypair
      );
      console.log(
        `Initialized mint account ${localMintPubkey.toString()} on-chain.`
      );
    } catch (error) {
      // Log error if mint already exists (might happen in specific test setups, though unlikely with anchor test)
      if (error.message.includes("already in use")) {
        console.log(
          `Mint account ${localMintPubkey.toString()} already exists.`
        );
      } else {
        throw error; // Re-throw other errors
      }
    }
    try {
      const adminTokenAccount = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          admin, // Payer
          localMintPubkey,
          admin.publicKey
        )
      ).address;
      console.log(
        `Admin ATA (${localMintPubkey.toString()}): ${adminTokenAccount.toString()}`
      );

      const mintAmount = new anchor.BN(1_000_000 * 10 ** 6); // 1 Million tokens with 6 decimals
      await mintTo(
        provider.connection,
        admin, // Payer
        localMintPubkey,
        adminTokenAccount,
        admin.publicKey, // Mint Authority
        mintAmount.toNumber() // Amount (beware of JS number limits for large amounts)
      );
      console.log(`Minted ${mintAmount.toString()} tokens to admin ATA`);
    } catch (error) {
      console.error("Error minting tokens:", error);
    }
  });



  describe("Market", () => {
    
    it("Creates market", async () => {
      // --- Get validator time ---
      console.log("\n--- Fetching Validator Time ---");
      const currentSlot = await provider.connection.getSlot();
      const validatorTime = await provider.connection.getBlockTime(currentSlot);
      if (!validatorTime) {
        assert.fail("Could not fetch validator block time.");
      }
      console.log(`Current Slot: ${currentSlot}`);
      console.log(
        `Validator Time (getBlockTime): ${validatorTime} (${new Date(
          validatorTime * 1000
        ).toISOString()})`
      );
      console.log("--- End Fetching Validator Time ---");
      // ---

      // Set market times relative to validator time
      const marketStart = new anchor.BN(validatorTime - 60); // Start 60 seconds BEFORE validator time
      const marketEnd = new anchor.BN(validatorTime + 86400); // End 24 hours AFTER validator time
      console.log(
        `Calculated Market Start: ${marketStart.toString()} (${new Date(
          marketStart.toNumber() * 1000
        ).toISOString()})`
      );
      const marketId = new anchor.BN(6);
      const question = Array.from(Buffer.from("Will BTC reach $100k in 2024?"));

      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("Market PDA:", marketPda.toString());

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      console.log("Config PDA:", configPda.toString());

      await program.methods
        .createMarket({
          marketId,
          question,
          marketStart,
          marketEnd,
        })
        .accountsPartial({
          signer: admin.publicKey,
          feeVault: feeVault.publicKey,
          market: marketPda,
          usdcMint: localMintPubkey,
          tokenProgram: TOKEN_PROGRAM_ID,
          config: configPda,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc({
          skipPreflight: true,
          commitment: "confirmed",
        });

      const marketAccount = await program.account.marketState.fetch(marketPda);
      console.log("Market Account:", marketAccount);
      assert.ok(marketAccount.marketId.eq(marketId));
      assert.ok(marketAccount.authority.equals(admin.publicKey));
    });
  });
});
