// Load the admin keypair from environment or file

import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
    console.log("Loading admin and fee vault keypairs...");

    // Check if environment variables are set
    if (!process.env.ADMIN_KEY_PATH) {
        throw new Error("ADMIN_KEY_PATH environment variable is not set");
    }
    
    if (!process.env.FEE_VAULT_KEY_PATH) {
        throw new Error("FEE_VAULT_KEY_PATH environment variable is not set");
    }

    const ADMIN = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(process.env.ADMIN_KEY_PATH, "utf-8")))
    );
  
  // Load the fee vault keypair
    const FEE_VAULT = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(process.env.FEE_VAULT_KEY_PATH, "utf-8")))
    );

    console.log("Admin public key:", ADMIN.publicKey.toString());
    console.log("Fee vault public key:", FEE_VAULT.publicKey.toString());
}

main().catch(console.error); 