import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
export const getTokenATA = (address, Mint, program = TOKEN_PROGRAM_ID) => {
    return PublicKey.findProgramAddressSync([address.toBytes(), program.toBytes(), Mint.toBytes()], new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID))[0];
};
export const getMarketPDA = (programId, marketId) => {
    return PublicKey.findProgramAddressSync([Buffer.from('market'), new BN(marketId).toArrayLike(Buffer, 'le', 8)], programId)[0];
};
export const getConfigPDA = (programId) => {
    return PublicKey.findProgramAddressSync([Buffer.from('config')], programId)[0];
};
export const getCustomerPDA = (programId, customerId) => {
    return PublicKey.findProgramAddressSync([Buffer.from('customer'), new BN(customerId).toArrayLike(Buffer, 'le', 8)], programId)[0];
};
export const getUserTradePDA = (programId, wallet) => {
    return PublicKey.findProgramAddressSync([Buffer.from('user_trade'), wallet.toBuffer()], programId)[0];
};
export const getSubUserTradePDA = (programId, wallet, nonce) => {
    return PublicKey.findProgramAddressSync([
        Buffer.from('sub_user_trade'),
        wallet.toBuffer(),
        new BN(nonce).toArrayLike(Buffer, 'le', 8)
    ], programId)[0];
};
export const getPoolPDA = (programId, poolId) => {
    return PublicKey.findProgramAddressSync([Buffer.from('pool'), new BN(poolId).toArrayLike(Buffer, 'le', 8)], programId)[0];
};
