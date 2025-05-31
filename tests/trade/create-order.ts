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

  const user = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./user.json", "utf-8")))
  );

  let localMintPubkey: PublicKey;

  before(async () => {
    // Request airdrop for admin and user if needed
    const balance = await provider.connection.getBalance(admin.publicKey);
    if (balance < 1_000_000_000) { // Less than 1 SOL
      console.log("Requesting airdrop for admin...");
      const signature = await provider.connection.requestAirdrop(admin.publicKey, 2_000_000_000); // 2 SOL
      await provider.connection.confirmTransaction(signature);
    }

    const userBalance = await provider.connection.getBalance(user.publicKey);
    if (userBalance < 1_000_000_000) {
      console.log("Requesting airdrop for user...");
      const signature = await provider.connection.requestAirdrop(user.publicKey, 2_000_000_000);
      await provider.connection.confirmTransaction(signature);
    }

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
      // Log error if mint already exists
      if (error.message.includes("already in use")) {
        console.log(
          `Mint account ${localMintPubkey.toString()} already exists.`
        );
      } else {
        throw error;
      }
    }

    try {
      const userTokenAccount = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          user, // Payer
          localMintPubkey,
          user.publicKey
        )
      ).address;
      console.log(
        `User ATA (${localMintPubkey.toString()}): ${userTokenAccount.toString()}`
      );

      const mintAmount = new anchor.BN(1_000_000 * 10 ** 6); // 1 Million tokens with 6 decimals
      await mintTo(
        provider.connection,
        admin, // Payer
        localMintPubkey,
        userTokenAccount,
        admin.publicKey, // Mint Authority
        mintAmount.toNumber()
      );
      console.log(`Minted ${mintAmount.toString()} tokens to user ATA`);
    } catch (error) {
      console.error("Error minting tokens:", error);
    }
  });

  describe("Trade", () => {
    it("Creates an order in an existing market", async () => {
      // Use an existing market ID (you'll need to replace this with a valid market ID)
      const marketId = new anchor.BN(579963); // Replace with your actual market ID
      
      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Get the config PDA
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      // Get the user trade PDA
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const marketVault = (await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        localMintPubkey,
        marketPda,
        true
      )).address;

      // Create order parameters
      const amount = new anchor.BN(100); // 100 tokens with 6 decimals
      const direction = { yes: {} }; // Betting on "Yes"

      try {
        const tx = await program.methods
          .createOrder({
            amount,
            direction,
          })
          .accountsPartial({
            signer: user.publicKey,
            feeVault: feeVault.publicKey,
            positionAccount: positionAccountPda,
            market: marketPda,
            mint: localMintPubkey,
            userAta: (await getOrCreateAssociatedTokenAccount(
              provider.connection,
              user,
              localMintPubkey,
              user.publicKey
            )).address,
            marketVault: marketVault,
            config: configPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user])
          .rpc();

        console.log("Order creation transaction signature:", tx);

        // Fetch the market account to verify the order was created
        const marketAccount = await program.account.marketState.fetch(marketPda);
        console.log("Market Account after order:", marketAccount);

        // Verify the market volume increased
        assert.ok(marketAccount.volume.gt(new anchor.BN(0)), "Market volume should be greater than 0");

        // Verify the yes liquidity increased (since we placed a "Yes" order)
        assert.ok(marketAccount.yesLiquidity.gt(new anchor.BN(0)), "Yes liquidity should be greater than 0");

      } catch (error) {
        console.error("Error creating order:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }
    });
  });
});
