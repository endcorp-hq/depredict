import { TransactionMessage, VersionedTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import getPriorityFee from './getPriorityFee';
const sendVersionedTransaction = async (program, ixs, options, addressLookupTableAccounts) => {
    if (!program.provider.publicKey) {
        throw new Error('Payer public key is not available on the program provider. Ensure the wallet is connected and initialized.');
    }
    const payerPublicKey = program.provider.publicKey;
    if (options?.microLamports) {
        ixs.push(ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: options.microLamports
        }));
    }
    if (!options?.microLamports) {
        const priorityFee = await getPriorityFee();
        ixs.push(ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFee
        }));
    }
    const { blockhash } = await program.provider.connection.getLatestBlockhash();
    const tx = new VersionedTransaction(new TransactionMessage({
        instructions: ixs,
        recentBlockhash: blockhash,
        payerKey: payerPublicKey
    }).compileToV0Message(addressLookupTableAccounts));
    if (!program.provider.sendAndConfirm) {
        throw new Error('sendAndConfirm method is not available on the program provider.');
    }
    return program.provider.sendAndConfirm(tx, [], {
        skipPreflight: options?.skipPreflight,
        commitment: 'confirmed'
    });
};
export default sendVersionedTransaction;
