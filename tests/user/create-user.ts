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

  describe("User", () => {
    it("Creates user", async () => {
      const userId = 1;
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), user.publicKey.toBytes()],
        program.programId
      );

      await program.methods
        .createUser({
          authority: user.publicKey,
          id: userId,
        })
        .accountsPartial({
          signer: user.publicKey,
          user: userPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const userAccount = await program.account.user.fetch(userPda);
      assert.equal(userAccount.id, userId);
      assert.ok(userAccount.authority.equals(user.publicKey));
    });
  });
});
