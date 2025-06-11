import { TransactionMessage, VersionedTransaction, ComputeBudgetProgram, } from "@solana/web3.js";
import getPriorityFee from "./getPriorityFee";
const createVersionedTransaction = async (program, ixs, payer, options, addressLookupTableAccounts) => {
    const payerPublicKey = payer;
    if (options?.microLamports) {
        ixs.push(ComputeBudgetProgram.setComputeUnitLimit({
            units: options.microLamports,
        }));
    }
    if (!options?.microLamports) {
        const priorityFee = await getPriorityFee();
        ixs.push(ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFee,
        }));
    }
    const { blockhash } = await program.provider.connection.getLatestBlockhash();
    const tx = new VersionedTransaction(new TransactionMessage({
        instructions: ixs,
        recentBlockhash: blockhash,
        payerKey: payerPublicKey,
    }).compileToV0Message(addressLookupTableAccounts));
    return tx;
};
export default createVersionedTransaction;
