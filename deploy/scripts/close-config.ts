import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import * as path from "path";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const RPC_URL = process.env.RPC_URL;
const PROGRAM_ID = process.env.PROGRAM_ID;
const ADMIN_KEY_PATH = process.env.ADMIN_KEY_PATH as string;

function loadAdminKeypair() {
  return anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(ADMIN_KEY_PATH, "utf-8")))
  );
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const admin = loadAdminKeypair();

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(admin),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    new PublicKey(PROGRAM_ID)
  );

  const program = anchor.workspace.Depredict;

  console.log("Closing config:", configPda.toBase58());

  try {
    const info = await connection.getAccountInfo(configPda, "confirmed");
    if (!info) {
      console.log("No config account found. Nothing to close.");
      process.exit(0);
    }
    const tx = await program.methods
      .closeConfig()
      .accounts({
        signer: admin.publicKey,
        config: configPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc({ commitment: "confirmed", preflightCommitment: "confirmed" });
    console.log("✅ Closed. Tx:", tx);
  } catch (e) {
    console.error("❌ Error closing config:", e);
    if ((e as any).logs) console.error("Program logs:", (e as any).logs);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


