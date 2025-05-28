import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  let feeVaultTokenAccount: PublicKey;
  let userTokenAccount: PublicKey;

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  before(async () => {
    console.log("Admin public key:", admin.publicKey.toString());
    console.log("Fee vault public key:", feeVault.publicKey.toString());
    console.log("Config PDA:", configPda.toString());
    localMintPubkey = localMint.publicKey;
    console.log(`Loaded local token mint: ${localMintPubkey.toString()}`);

    // 2. Initialize the mint account on the current localnet instance
    // This is needed every time because anchor test starts a fresh validator
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

    feeVaultTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        admin, // Payer (admin pays for fee vault's ATA)
        localMintPubkey,
        feeVault.publicKey
      )
    ).address;

    userTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user, // Payer
        localMintPubkey,
        user.publicKey
      )
    ).address;

    console.log(
      `Fee Vault ATA (${localMintPubkey.toString()}): ${feeVaultTokenAccount.toString()}`
    );

    // 4. Mint tokens to the ATAs
    const mintAmount = new anchor.BN(1_000_000 * 10 ** 6); // 1 Million tokens with 6 decimals

    await mintTo(
      provider.connection,
      admin, // Payer
      localMintPubkey,
      feeVaultTokenAccount,
      admin.publicKey, // Mint Authority
      mintAmount.toNumber()
    );

    await mintTo(
      provider.connection,
      admin, // Payer
      localMintPubkey,
      userTokenAccount,
      admin.publicKey, // Mint Authority
      mintAmount.toNumber()
    );
    console.log(`Minted ${mintAmount.toString()} tokens to fee vault ATA`);
  });

  describe("Order Placement and Flow", () => {
    const marketId = new anchor.BN(6); //replace with marketId from create-market.ts

    it("Creates order", async () => {
      //make sure userTradePda is created beforehand
      const [userTradePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_trade"), user.publicKey.toBytes()],
        program.programId
      );

      //make sure marketPda is created beforehand
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      // --- Log UserTrade Orders Before Placing ---
      console.log("\n--- Checking UserTrade Orders Before Placing ---");
      try {
        const userTradeAccount = await program.account.userTrade.fetch(
          userTradePda
        );
        console.log("Current orders in UserTrade:");
        userTradeAccount.orders.forEach((order, index) => {
          console.log(
            `  Slot ${index}: ID=${order.orderId.toString()}, Status=${JSON.stringify(
              order.orderStatus
            )}, Direction=${JSON.stringify(
              order.orderDirection
            )}, Market=${order.marketId.toString()}`
          );
        });
      } catch (fetchError) {
        console.error(
          "Error fetching userTrade account before createOrder:",
          fetchError
        );
        assert.fail(
          "UserTrade account could not be fetched before placing order."
        );
      }
      console.log("--- End UserTrade Orders Check ---");
      // ---

      // console.log("\n--- Placing First YES Order ---");
      // // Fetch market state to get the current price for the first order
      let marketAccount = await program.account.marketState.fetch(marketPda);
      let orderAmount = new anchor.BN(5000000); // Use current YES liquidity as amount
      console.log(
        `Using order amount (current YES price): ${orderAmount.toString()}`
      );

      await program.methods
        .createOrder({
          amount: orderAmount, // Use the fetched price
          direction: { yes: {} },
        })
        .accountsPartial({
          signer: user.publicKey,
          feeVault: feeVault.publicKey,
          userTrade: userTradePda,
          market: marketPda,
          mint: localMintPubkey,
          config: configPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc({
          skipPreflight: true,
          commitment: "confirmed",
        });
      console.log("First YES Order placed.");
      marketAccount = await program.account.marketState.fetch(marketPda); // Re-fetch market state
      console.log(
        `Liquidity after 1st YES: YES=${marketAccount.yesLiquidity.toString()}, NO=${marketAccount.noLiquidity.toString()}`
      );

      await sleep(3500); // Add delay before next order

      // --- Place First NO Order ---
      console.log("\n--- Placing First NO Order ---");
      orderAmount = new anchor.BN(5000000);
      console.log(
        `Using order amount (current YES price): ${orderAmount.toString()}`
      );
      await program.methods
        .createOrder({ amount: orderAmount, direction: { no: {} } })
        .accountsPartial({
          /* Same accounts as above */ signer: user.publicKey,
          feeVault: feeVault.publicKey,
          userTrade: userTradePda,
          market: marketPda,
          mint: localMintPubkey,
          config: configPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc({
          skipPreflight: true,
          commitment: "confirmed",
        });
      console.log("Second YES Order placed.");
      marketAccount = await program.account.marketState.fetch(marketPda);
      console.log(
        `Liquidity after 2nd YES: YES=${marketAccount.yesLiquidity.toString()}, NO=${marketAccount.noLiquidity.toString()}`
      );

      await sleep(3500); // Add delay before next order
    });
    it("market resolution", async () => {
      let marketId = new anchor.BN(6);
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
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
      // const marketStart = new anchor.BN(validatorTime - 60); // Start 60 seconds BEFORE validator time
      const marketEnd = new anchor.BN(validatorTime - 100); // End 24 hours Before validator time

      await program.methods
        .updateMarket({
          marketId,
          marketEnd,
          winningDirection: { yes: {} },
          state: { resolved: {} },
        })
        .accountsPartial({
          signer: admin.publicKey,
          market: marketPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc({
          skipPreflight: true,
          commitment: "confirmed",
        });
    });

    it("order payouts", async () => {
      await sleep(3500);
      let marketId = new anchor.BN(6);
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [userTradePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_trade"), user.publicKey.toBytes()],
        program.programId
      );
      const userTradeAccount = await program.account.userTrade.fetch(
        userTradePda
      );

      console.log("Current orders in UserTrade:");
      userTradeAccount.orders.forEach((order, index) => {
        console.log(
          `  Slot ${index}: ID=${order.orderId.toString()}, Status=${JSON.stringify(
            order.orderStatus
          )}, Direction=${JSON.stringify(
            order.orderDirection
          )}, Market=${order.marketId.toString()}`
        );
      });
      console.log(
        "market volume before payout",
        (await program.account.marketState.fetch(marketPda)).volume.toString()
      );

      const winningOrder = userTradeAccount.orders.filter(
        (order) => order.marketId === new BN(6) && order.orderId === new BN(1)
      )[0];
      await program.methods
        .settleOrder(winningOrder.orderId)
        .accountsPartial({
          signer: user.publicKey,
          feeVault: feeVault.publicKey,
          userTrade: userTradePda,
          market: marketPda,
          mint: localMintPubkey,
          config: configPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc({
          skipPreflight: true,
          commitment: "confirmed",
        });
      console.log(
        "market volume after payout",
        (await program.account.marketState.fetch(marketPda)).volume.toString()
      );
    });
  });
});
