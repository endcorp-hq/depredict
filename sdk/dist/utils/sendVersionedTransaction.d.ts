import { TransactionInstruction } from '@solana/web3.js';
import { RpcOptions } from '../types/index';
import { AddressLookupTableAccount } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { ShortxContract } from '../types/shortx';
declare const sendVersionedTransaction: (program: Program<ShortxContract>, ixs: TransactionInstruction[], options?: RpcOptions, addressLookupTableAccounts?: AddressLookupTableAccount[]) => Promise<string>;
export default sendVersionedTransaction;
