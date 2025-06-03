import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../../target/types/shortx_contract";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";

describe("shortx-contract", () => {

  const MarketStates = {
    Active: { active: {} },
    Ended: { ended: {} },
    Resolving: { resolving: {} },
    Resolved: { resolved: {} },
  }

  const WinningDirection = {
    Yes: { yes: {} },
    No: { no: {} },
    Draw: { draw: {} },
    None: { none: {} },
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ShortxContract as Program<ShortxContract>;
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./keypair.json", "utf-8")))
  );

  const localMint = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync("./local_mint.json", "utf-8")))
  );

  let localMintPubkey: PublicKey;

  before(async () => {
    localMintPubkey = localMint.publicKey;
    console.log(`Loaded local token mint: ${localMintPubkey.toString()}`);
  });

  describe("Market", () => {
    it("Updates market", async () => {
      const marketId = new anchor.BN(59583); //ID of market that exists

      const newMarketEnd = new anchor.BN(
        Math.floor(Date.now() / 1000) + 172800
      ); // 48 hours later

      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          marketId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("Market PDA:", marketPda.toString());

      await program.methods
        .updateMarket({
          marketId,
          marketEnd: newMarketEnd,
        })
        .accountsPartial({
          signer: admin.publicKey,
          market: marketPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc(
          {
            skipPreflight: true,
          }
        );

      const marketAccount = await program.account.marketState.fetch(marketPda);
      console.log("Market End:", marketAccount.marketEnd);
      console.log("Market State:", marketAccount.marketState);
      console.log("Winning Direction:", marketAccount.winningDirection);
      assert.ok(marketAccount.marketEnd.eq(newMarketEnd));
    });
  });
});
