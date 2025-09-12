import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { getNetworkConfig, getCurrentMarketId } from "../helpers";
import { ADMIN, program } from "../constants";

describe("depredict", () => {


  before(async () => {
    const { isDevnet } = await getNetworkConfig();
    console.log(`Running tests on ${isDevnet ? "devnet" : "localnet"}`);
  });

  describe("Market", () => {
    it("Updates market", async () => {
      // Get the current market ID
      const marketId = await getCurrentMarketId();

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
          marketEnd: newMarketEnd,
          marketState: null,
        })
        .accountsPartial({
          signer: ADMIN.publicKey,
          market: marketPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([ADMIN])
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
