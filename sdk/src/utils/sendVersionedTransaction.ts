import {
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  PublicKey,
} from "@solana/web3.js";
import { RpcOptions } from "../types/index.js";
import { AddressLookupTableAccount } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import getPriorityFee from "./getPriorityFee.js";
import { ShortxContract } from "../types/shortx.js";

const createVersionedTransaction = async (
  program: Program<ShortxContract>,
  ixs: TransactionInstruction[],
  payer: PublicKey,
  options?: RpcOptions,
  addressLookupTableAccounts?: AddressLookupTableAccount[]
): Promise<VersionedTransaction> => {
  const payerPublicKey: PublicKey = payer;

  if (options?.microLamports) {
    ixs.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: options.microLamports,
      })
    );
  }

  if (!options?.microLamports) {
    const priorityFee = await getPriorityFee();

    ixs.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      })
    );
  }

  const { blockhash } = await program.provider.connection.getLatestBlockhash();

  const tx = new VersionedTransaction(
    new TransactionMessage({
      instructions: ixs,
      recentBlockhash: blockhash,
      payerKey: payerPublicKey,
    }).compileToV0Message(addressLookupTableAccounts)
  );

  return tx;
};

export default createVersionedTransaction;
