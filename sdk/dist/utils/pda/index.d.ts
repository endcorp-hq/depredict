import { PublicKey } from '@solana/web3.js';
export declare const getTokenATA: (address: PublicKey, Mint: PublicKey, program?: PublicKey) => PublicKey;
export declare const getMarketPDA: (programId: PublicKey, marketId: number) => PublicKey;
export declare const getConfigPDA: (programId: PublicKey) => PublicKey;
export declare const getCustomerPDA: (programId: PublicKey, customerId: number) => PublicKey;
export declare const getUserTradePDA: (programId: PublicKey, wallet: PublicKey) => PublicKey;
export declare const getSubUserTradePDA: (programId: PublicKey, wallet: PublicKey, nonce: number) => PublicKey;
export declare const getPoolPDA: (programId: PublicKey, poolId: number) => PublicKey;
