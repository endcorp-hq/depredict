import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'

export const getTokenATA = (
  address: PublicKey,
  Mint: PublicKey,
  program = TOKEN_PROGRAM_ID
) => {
  return PublicKey.findProgramAddressSync(
    [address.toBytes(), program.toBytes(), Mint.toBytes()],
    new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
  )[0]
}

export const getMarketPDA = (programId: PublicKey, marketId: number) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('market'), new BN(marketId).toArrayLike(Buffer, 'le', 8)],
    programId
  )[0]
}

export const getConfigPDA = (programId: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    programId
  )[0]
}

export const getCustomerPDA = (programId: PublicKey, customerId: number) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('customer'), new BN(customerId).toArrayLike(Buffer, 'le', 8)],
    programId
  )[0]
}

export const getUserTradePDA = (programId: PublicKey, wallet: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_trade'), wallet.toBuffer()],
    programId
  )[0]
}

export const getSubUserTradePDA = (
  programId: PublicKey,
  wallet: PublicKey,
  nonce: number
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('sub_user_trade'),
      wallet.toBuffer(),
      new BN(nonce).toArrayLike(Buffer, 'le', 8)
    ],
    programId
  )[0]
}

export const getPoolPDA = (programId: PublicKey, poolId: number) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), new BN(poolId).toArrayLike(Buffer, 'le', 8)],
    programId
  )[0]
}