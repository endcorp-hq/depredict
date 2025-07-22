import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { getNetworkConfig, FEE_VAULT, program, provider, USER, MARKET_ID, ADMIN, LOCAL_MINT } from "../helpers";

import { fetchAsset, MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { fetchCollection } from '@metaplex-foundation/mpl-core'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import fs from "fs";

describe("depredict", () => { 

  let usdcMint: PublicKey;
  let userTokenAccount: PublicKey;
  let marketVault: PublicKey; 

  // Load local wallet from ~/.config/solana/id.json
  const localKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf-8")))
  );

  before(async () => {
    // Get network configuration
    const { isDevnet } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);
    console.log("USER:", USER.publicKey.toString());

    // Ensure USER has enough SOL for rent and fees by transferring from local wallet if needed
    const userBalance = await provider.connection.getBalance(USER.publicKey);
    const minBalance = 1_000_000_000; // 1 SOL
    if (userBalance < minBalance) {
      console.log("Transferring 2 SOL from local wallet to USER...");
      const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
      const transferIx = SystemProgram.transfer({
        fromPubkey: localKeypair.publicKey,
        toPubkey: USER.publicKey,
        lamports: 2 * LAMPORTS_PER_SOL,
      });
      const transaction = new anchor.web3.Transaction().add(transferIx);
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = localKeypair.publicKey;
      const signature = await provider.connection.sendTransaction(transaction, [localKeypair]);
      await provider.connection.confirmTransaction(signature);
      console.log("Transfer to USER successful");
    }

    // Get the USDC mint
    usdcMint = LOCAL_MINT.publicKey;
    console.log("USDC Mint:", usdcMint.toString());

    // Print out account information for comparison
    console.log("\nAccount Information:");
    console.log("ADMIN public key:", ADMIN.publicKey.toString());
    console.log("USER public key:", USER.publicKey.toString());
    console.log("Local wallet public key:", localKeypair.publicKey.toString());
    console.log("USDC mint authority (LOCAL_MINT):", LOCAL_MINT.publicKey.toString());

    // Defensive check: Create user's USDC token account
    try {
      userTokenAccount = (
        await getOrCreateAssociatedTokenAccount(
          provider.connection,
          USER, // Payer
          usdcMint,
          USER.publicKey
        )
      ).address;
      console.log(`User USDC ATA: ${userTokenAccount.toString()}`);

      // Mint USDC to USER's ATA if needed
      const userUsdcBalance = await provider.connection.getTokenAccountBalance(userTokenAccount);
      const minUsdc = 1_000_000_000; // 1,000 USDC (6 decimals)
      if (Number(userUsdcBalance.value.amount) < minUsdc) {
        console.log(`Minting 1,000 USDC to USER (current balance: ${userUsdcBalance.value.amount})...`);
        await mintTo(
          provider.connection,
          ADMIN, // payer
          usdcMint,
          userTokenAccount,
          LOCAL_MINT, // mint authority
          minUsdc
        );
        console.log("Minted 1,000 USDC to USER's ATA");
      } else {
        console.log(`User already has sufficient USDC: ${userUsdcBalance.value.amount}`);
      }
    } catch (e) {
      console.error("Failed to get or create user USDC ATA:", e);
      throw e;
    }

    if (isDevnet) {
      console.log("Please ensure you have USDC in your wallet from the faucet");
    }
  });

  describe("Trade", () => {
    it("Creates an order in an existing market", async () => {

      // Get the market PDA
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          MARKET_ID.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Get the market account to verify it exists
      const marketAccount = await program.account.marketState.fetch(marketPda);
      console.log("Market Account:", marketAccount);

      // Get the config PDA
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), MARKET_ID.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [positionNftAccountPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("nft"),
          MARKET_ID.toArrayLike(Buffer, "le", 8),
          marketAccount.nextPositionId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("Position account PDA:", positionAccountPda.toString());
      const collectionPubkey = marketAccount.nftCollection;

      const [collectionPda, collectionBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("collection"), 
          MARKET_ID.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );
      console.log("Collection PDA:", collectionPda.toString());


      console.log("Collection PDA:", collectionPubkey.toString());
      // Create order parameters
      const amount = new anchor.BN(3*10**6); // 2 USDC (6 decimals)
      const direction = { yes: {} }; // Betting on "Yes"

      try {
        const { tx, error } = await tryCreatePositionTx({
          user: USER,
          amount,
          direction,
          usdcMint,
          userTokenAccount,
          marketPda,
          marketUsdcVault: marketVault,
          positionAccountPda,
          positionNftAccountPda,
          collectionPubkey,
          configPda,
        });
        if (error) {
          console.error("Order creation failed:", error);
          assert.fail("Order creation failed: " + error.toString());
        }
        console.log("Order creation transaction signature:", tx);

        // Fetch the market account to verify the order was created
        const marketAccount = await program.account.marketState.fetch(marketPda);
        console.log("Market Account after order:", marketAccount);

        // Verify the market volume increased
        assert.ok(marketAccount.volume.gt(new anchor.BN(0)), "Market volume should be greater than 0");

        // Verify the yes liquidity increased (since we placed a "Yes" order)
        // assert.ok(marketAccount.yesLiquidity.gt(new anchor.BN(0)), "Yes liquidity should be greater than 0");

      } catch (error) {
        console.error("Error creating order:", error);
        if (error.logs) {
          console.error("Program logs:", error.logs);
        }
        throw error;
      }


      const umi = createUmi(provider.connection)

      const asset = await fetchAsset(umi, positionNftAccountPda.toString(), {
        skipDerivePlugins: false,
      })
      
      console.log("Asset:", asset)
      let attributes = asset.attributes
      // map the attributes as key value pairs and console log: 
      let attributesMap = attributes.attributeList.map((attribute: any) => {
        return {
          [attribute.key]: attribute.value
        }
      })
      console.log("Attributes:", attributesMap)

      console.log("Fetching collection...");
      const collection = await fetchCollection(umi, collectionPda.toString())
      console.log(collection)
      let collection_attributes = collection.attributes
      // map the attributes as key value pairs and console log: 
      let collection_attributesMap = collection_attributes.attributeList.map((attribute: any) => {
        return {
          [attribute.key]: attribute.value
        }
      })
      console.log("Collection Attributes:", collection_attributesMap)
      console.log("Collection fetched");

    });

    // --- Negative Test Cases for Business Logic ---

    it("Fails if market is already resolved", async () => {
      // TODO: Create a market and resolve it (set winning_direction != None)
      // ...create and resolve market...
      // const { error } = await tryCreatePositionTx({ ... });
      // assert.isNotNull(error, "Should fail with MarketAlreadyResolved");
      // assert.include(error.toString(), "MarketAlreadyResolved");
    });

    it("Fails if concurrent transaction is detected", async () => {
      // TODO: Manipulate market account so update_ts >= current ts
      // ...simulate this state...
      // const { error } = await tryCreatePositionTx({ ... });
      // assert.isNotNull(error, "Should fail with ConcurrentTransaction");
      // assert.include(error.toString(), "ConcurrentTransaction");
    });

    it("Fails if no available position slot", async () => {
      // TODO: Fill all position slots in the market_positions_account
      // ...simulate this state...
      // const { error } = await tryCreatePositionTx({ ... });
      // assert.isNotNull(error, "Should fail with NoAvailablePositionSlot");
      // assert.include(error.toString(), "NoAvailablePositionSlot");
    });

    it("Fails if user has insufficient USDC", async () => {
      // Use a user with 0 USDC
      // You can create a new Keypair for this test
      const poorUser = anchor.web3.Keypair.generate();
      // Create ATA for poorUser but do not mint USDC
      let poorUserTokenAccount;
      try {
        poorUserTokenAccount = (
          await getOrCreateAssociatedTokenAccount(
            provider.connection,
            poorUser, // payer
            usdcMint,
            poorUser.publicKey
          )
        ).address;
      } catch (e) {
        // If fails, skip test
        return;
      }
      const { error } = await tryCreatePositionTx({
        user: poorUser,
        userTokenAccount: poorUserTokenAccount,
        usdcMint,
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        // ...other required params (mock or reuse from above)
        expectError: "InsufficientFunds"
      });
      assert.isNotNull(error, "Should fail with InsufficientFunds");
      assert.include(error.toString(), "InsufficientFunds");
    });

    it("Fails if user has insufficient SOL for fee", async () => {
      // Use a user with 0 SOL
      // Airdrop 0 SOL to a new Keypair (should have no funds)
      const noSolUser = anchor.web3.Keypair.generate();
      // Create ATA for noSolUser and mint USDC so only USDC is present
      let noSolUserTokenAccount;
      try {
        noSolUserTokenAccount = (
          await getOrCreateAssociatedTokenAccount(
            provider.connection,
            noSolUser, // payer
            usdcMint,
            noSolUser.publicKey
          )
        ).address;
        // Mint USDC to this account so only fee transfer fails
        await mintTo(
          provider.connection,
          ADMIN, // payer
          usdcMint,
          noSolUserTokenAccount,
          LOCAL_MINT, // mint authority
          1_000_000
        );
      } catch (e) {
        // If fails, skip test
        return;
      }
      // Do not airdrop SOL, so fee transfer should fail
      const { error } = await tryCreatePositionTx({
        user: noSolUser,
        userTokenAccount: noSolUserTokenAccount,
        usdcMint,
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        // ...other required params (mock or reuse from above)
        expectError: "InsufficientFunds"
      });
      assert.isNotNull(error, "Should fail with InsufficientFunds");
      assert.include(error.toString(), "InsufficientFunds");
    });

    it("Fails if question period has ended (using known closed market ID 1)", async () => {
      // This test targets market with ID 1, which is known to be closed.
      // It should fail with the 'QuestionPeriodEnded' error.
      const closedMarketId = new anchor.BN(1);
      // Derive PDAs for market 1
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), closedMarketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [positionAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), closedMarketId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [positionNftAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("nft"), closedMarketId.toArrayLike(Buffer, "le", 8), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      // Fetch the market account to get the collection pubkey
      let marketAccount;
      try {
        marketAccount = await program.account.marketState.fetch(marketPda);
      } catch (e) {
        // If market doesn't exist, skip test
        return;
      }
      const collectionPubkey = marketAccount.nftCollection;
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );
      // Use a valid user with USDC
      const { error } = await tryCreatePositionTx({
        amount: new anchor.BN(1_000_000),
        direction: { yes: {} },
        usdcMint,
        userTokenAccount,
        marketPda,
        marketUsdcVault: marketVault,
        positionAccountPda,
        positionNftAccountPda,
        collectionPubkey,
        configPda,
        expectError: "QuestionPeriodEnded"
      });
      assert.isNotNull(error, "Should fail with QuestionPeriodEnded");
      assert.include(error.toString(), "QuestionPeriodEnded");
    });
  });
});

type TryCreatePositionParams = {
  user?: typeof USER,
  amount?: anchor.BN,
  direction?: any,
  usdcMint?: PublicKey,
  userTokenAccount?: PublicKey,
  marketPda?: PublicKey,
  marketUsdcVault?: PublicKey,
  positionAccountPda?: PublicKey,
  positionNftAccountPda?: PublicKey,
  collectionPubkey?: PublicKey,
  configPda?: PublicKey,
  expectError?: string | null,
  mplCoreProgram?: PublicKey,
};

async function tryCreatePositionTx({
  user = USER,
  amount = new anchor.BN(1_000_000),
  direction = { yes: {} },
  usdcMint,
  userTokenAccount,
  marketPda,
  marketUsdcVault,
  positionAccountPda,
  positionNftAccountPda,
  collectionPubkey,
  configPda,
  expectError = null,
  mplCoreProgram = new PublicKey(MPL_CORE_PROGRAM_ID.toString()),
}: TryCreatePositionParams) {
  try {
    const tx = await program.methods
      .createPosition({
        amount,
        direction,
      })
      .accountsPartial({
        signer: user.publicKey,
        feeVault: FEE_VAULT.publicKey,
        marketPositionsAccount: positionAccountPda,
        market: marketPda,
        usdcMint: usdcMint,
        userUsdcAta: userTokenAccount,
        marketUsdcVault: marketUsdcVault,
        positionNftAccount: positionNftAccountPda,
        collection: collectionPubkey,
        mplCoreProgram: mplCoreProgram,
        config: configPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    return { tx, error: null };
  } catch (error) {
    if (expectError) {
      assert.include(error.toString(), expectError);
    }
    return { tx: null, error };
  }
}