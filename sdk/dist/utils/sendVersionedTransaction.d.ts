import { TransactionInstruction, VersionedTransaction, PublicKey } from "@solana/web3.js";
import { RpcOptions } from "../types/index";
import { AddressLookupTableAccount } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "../types/shortx";
declare const createVersionedTransaction: (program: Program<ShortxContract>, ixs: TransactionInstruction[], payer: PublicKey, options?: RpcOptions, addressLookupTableAccounts?: AddressLookupTableAccount[]) => Promise<VersionedTransaction>;
export default createVersionedTransaction;
