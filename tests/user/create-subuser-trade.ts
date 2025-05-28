import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../../target/types/shortx_contract";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";

describe("shortx-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShortxContract as Program<ShortxContract>;

  const user = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./user.json", "utf-8")))
  );

  const localMint = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./local_mint.json", "utf-8")))
  );

  let localMintPubkey: PublicKey;

  before(async () => {
    localMintPubkey = localMint.publicKey;
    console.log(`Loaded local token mint: ${localMintPubkey.toString()}`);
  });

  describe("User Trade", () => {
    it("Creates sub user trade", async () => {
      const subUser = Keypair.generate();
      const [userTradePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_trade"), user.publicKey.toBytes()],
        program.programId
      );

      const [subUserTradePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_trade"), subUser.publicKey.toBytes()],
        program.programId
      );

      await program.methods
        .createSubUserTrade(subUser.publicKey)
        .accountsPartial({
          signer: user.publicKey,
          userTrade: userTradePda,
          subUserTrade: subUserTradePda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const subUserTradeAccount = await program.account.userTrade.fetch(
        subUserTradePda
      );
      assert.ok(subUserTradeAccount.authority.equals(user.publicKey));
      assert.ok(subUserTradeAccount.isSubUser);
    });
  });
});
