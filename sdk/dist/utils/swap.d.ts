import { AddressLookupTableAccount, Connection, TransactionInstruction } from '@solana/web3.js';
export declare const swap: ({ connection, wallet, inToken, amount }: {
    connection: Connection;
    wallet: string;
    inToken: string;
    amount: number;
}) => Promise<{
    swapIxs: TransactionInstruction[];
    addressLookupTableAccounts: AddressLookupTableAccount[];
    setupInstructions: any;
    cleanupInstruction: TransactionInstruction;
    usdcAmount: any;
}>;
export declare const getAddressLookupTableAccounts: (connection: Connection, keys: string[]) => Promise<AddressLookupTableAccount[]>;
