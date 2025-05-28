import {
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    ComputeBudgetProgram,
    PublicKey
  } from '@solana/web3.js'
  import { RpcOptions } from '../types/index'
  import { AddressLookupTableAccount } from '@solana/web3.js'
  import { Program } from '@coral-xyz/anchor'
  import getPriorityFee from './getPriorityFee'
  import { ShortxContract } from '../types/shortx'
  
  const sendVersionedTransaction = async (
    program: Program<ShortxContract>,
    ixs: TransactionInstruction[],
    options?: RpcOptions,
    addressLookupTableAccounts?: AddressLookupTableAccount[]
  ): Promise<string> => {
    if (!program.provider.publicKey) {
      throw new Error(
        'Payer public key is not available on the program provider. Ensure the wallet is connected and initialized.'
      )
    }
    const payerPublicKey: PublicKey = program.provider.publicKey;

    if (options?.microLamports) {
      ixs.push(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: options.microLamports
        })
      )
    }
  
    if (!options?.microLamports) {
      const priorityFee = await getPriorityFee()
  
      ixs.push(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee
        })
      )
    }
  
    const { blockhash } = await program.provider.connection.getLatestBlockhash()
  
    const tx = new VersionedTransaction(
      new TransactionMessage({
        instructions: ixs,
        recentBlockhash: blockhash,
        payerKey: payerPublicKey
      }).compileToV0Message(addressLookupTableAccounts)
    )
  
    if (!program.provider.sendAndConfirm) {
        throw new Error(
            'sendAndConfirm method is not available on the program provider.'
        );
    }

    return program.provider.sendAndConfirm(tx, [], {
      skipPreflight: options?.skipPreflight,
      commitment: 'confirmed'
    })
  }
  
  export default sendVersionedTransaction