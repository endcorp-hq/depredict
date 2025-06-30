import * as anchor from "@coral-xyz/anchor";  
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
} from "@solana/spl-token";
import { assert } from "chai";
import { getNetworkConfig, ADMIN, FEE_VAULT, program, provider, METAPLEX_ID, LOCAL_MINT, ORACLE_KEY, extractErrorCode } from "../helpers";
import { getMint } from "@solana/spl-token";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { fetchCollection } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  PullFeed,
  getDefaultDevnetQueue,
  asV0Tx,
} from "@switchboard-xyz/on-demand";
import { CrossbarClient } from "@switchboard-xyz/common";

const umi = createUmi(provider.connection);

// At the top of your file:
let numMarkets: anchor.BN;
let configPda: PublicKey;

async function tryCreateMarketTx({
  questionStr = "Default question?",
  metadataUri = "https://arweave.net/default",
  oraclePubkey = ORACLE_KEY,
  feeVault = FEE_VAULT.publicKey,
  usdcMintParam = null,
  expectError = null,
}) {
  // Get current marketId and PDAs
  const marketId = numMarkets;
  const [marketPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [marketPositionsPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("position"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [collectionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection"), marketId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  // Market times
  const currentSlot = await provider.connection.getSlot();
  const validatorTime = await provider.connection.getBlockTime(currentSlot);
  if (!validatorTime) assert.fail("Could not fetch validator block time.");
  const marketStart = new anchor.BN(validatorTime - 60);
  const marketEnd = new anchor.BN(validatorTime + 86400);
  const question = Array.from(Buffer.from(questionStr));
  const usdcMintToUse = usdcMintParam || LOCAL_MINT.publicKey;

  try {
    const tx = await program.methods
      .createMarket({
        question,
        marketStart,
        marketEnd,
        metadataUri,
      })
      .accountsPartial({
        payer: ADMIN.publicKey,
        feeVault,
        market: marketPda,
        collection: collectionPda,
        marketPositionsAccount: marketPositionsPda,
        oraclePubkey,
        usdcMint: usdcMintToUse,
        tokenProgram: TOKEN_PROGRAM_ID,
        config: configPda,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
      })
      .signers([ADMIN])
      .rpc();
    return { tx, error: null, marketPda, collectionPda, marketId };
  } catch (error) {
    if (expectError) {
      assert.include(error.toString(), expectError);
    }
    return { tx: null, error, marketPda, collectionPda, marketId };
  }
}

describe("shortx-contract", () => {
  let usdcMint: PublicKey;
  let collectionMintKeypair: Keypair;

  before(async () => {
    // Get network configuration
    const { isDevnet } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);

    // Use local mint for testing
    usdcMint = LOCAL_MINT.publicKey;
    console.log("USDC Mint:", usdcMint.toString());
    collectionMintKeypair = Keypair.generate();
  });

  before(async () => {
    configPda = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    )[0];
    const configAccount = await program.account.config.fetch(configPda);
    numMarkets = configAccount.nextMarketId;
    console.log("Num Markets:", numMarkets);
  });

  describe("Market", () => {
    it("Creates market", async () => {
      const questionStr = "Will BTC reach $100k in 2024?";
      const metadataUri = "https://arweave.net/your-metadata-uri";
      const { tx, error, marketPda } = await tryCreateMarketTx({
        questionStr,
        metadataUri,
        oraclePubkey: ORACLE_KEY,
        feeVault: FEE_VAULT.publicKey,
        usdcMintParam: usdcMint,
      });
      assert.isNotOk(error, "Should not error on valid market creation");
      assert.ok(tx, "Transaction signature should be returned");

      const marketAccount = await program.account.marketState.fetch(marketPda);


      assert.ok(marketAccount.marketId.eq(numMarkets));
      assert.ok(marketAccount.authority.equals(ADMIN.publicKey));

    });

    it("Fails to create market with invalid oracle", async () => {
      const invalidOracle = Keypair.generate().publicKey;
      const { error } = await tryCreateMarketTx({
        questionStr: "Invalid oracle test?",
        oraclePubkey: invalidOracle,
        usdcMintParam: usdcMint,
      });
      if (error) {
        const code = extractErrorCode(error);
        console.log("Invalid oracle error code:", code);
        assert.equal(code.code, "ConstraintSeeds", "Should fail with ConstraintSeeds error code");
      }
      assert.isOk(error, "Should fail with invalid oracle");
    });

    it("Fails to create market with invalid fee vault", async () => {
      const invalidFeeVault = Keypair.generate().publicKey;
      const { error } = await tryCreateMarketTx({
        questionStr: "Invalid fee vault test?",
        feeVault: invalidFeeVault,
        usdcMintParam: usdcMint,
      });
      if (error) {
        const code = extractErrorCode(error);
        console.log("Invalid fee vault error code:", code);
        assert.equal(code.code, "ConstraintSeeds", "Should fail with ConstraintSeeds error code");
      }
      assert.isOk(error, "Should fail with invalid fee vault");
    });

    it("Fails to create market with invalid USDC mint", async () => {
      const invalidMint = Keypair.generate().publicKey;
      const { error } = await tryCreateMarketTx({
        questionStr: "Invalid mint test?",
        usdcMintParam: invalidMint,
      });
      if (error) {
        const code = extractErrorCode(error);
        console.log("Invalid mint error code:", code);
        assert.equal(code.code, "AccountNotInitialized", "Should fail with AccountNotInitialized error code");
      }
      assert.isOk(error, "Should fail with invalid mint");
    });
  });
});