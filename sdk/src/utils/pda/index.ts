import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { MPL_BUBBLEGUM_ID } from '../constants.js'

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

export const getCollectionPDA = (programId: PublicKey, marketId: number) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("collection"), 
      new BN(marketId).toArrayLike(Buffer, "le", 8)
    ],
    programId
  )[0];
}

export const getPositionNftPDA = (programId: PublicKey, marketId: number, positionId: BN) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("nft"),
      new BN(marketId).toArrayLike(Buffer, "le", 8),
      positionId.toArrayLike(Buffer, "le", 8),
    ],
    programId
  )[0];
}

export const getNftMetadataPDA = (nftMint: PublicKey, metaplexProgramId: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      metaplexProgramId.toBuffer(),
      nftMint.toBuffer(),
    ],
    metaplexProgramId
  )[0];
}

export const getNftMasterEditionPDA = (nftMint: PublicKey, metaplexProgramId: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      metaplexProgramId.toBuffer(),
      nftMint.toBuffer(),
      Buffer.from("edition"),
    ],
    metaplexProgramId
  )[0];
}

export const getCustomerPDA = (programId: PublicKey, customerId: number) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('customer'), new BN(customerId).toArrayLike(Buffer, 'le', 8)],
    programId
  )[0]
}

export const getPositionAccountPDA = (programId: PublicKey, marketId: number, subPositionKey?: PublicKey) => {
  return subPositionKey ? PublicKey.findProgramAddressSync(
    [Buffer.from('position'), new BN(marketId).toArrayLike(Buffer, 'le', 8), subPositionKey.toBuffer()],
    programId
  )[0] : PublicKey.findProgramAddressSync(
    [Buffer.from('position'), new BN(marketId).toArrayLike(Buffer, 'le', 8)],
    programId
  )[0]
}

export const getSubPositionAccountPDA = (
  programId: PublicKey,
  marketId: number,
  sub_position_key: PublicKey,
  nonce: number
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('sub_position_account'),
      new BN(marketId).toArrayLike(Buffer, 'le', 8),
      sub_position_key.toBuffer(),
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

export const getMarketCreatorPDA = (programId: PublicKey, authority: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('market_creator'), authority.toBytes()],
    programId
  )[0]
}

export const getPositionPagePDA = (programId: PublicKey, marketId: number, pageIndex: number) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('pos_page'),
      new BN(marketId).toArrayLike(Buffer, 'le', 8),
      new BN(pageIndex).toArrayLike(Buffer, 'le', 2)
    ],
    programId
  )[0]
}

export const getTreeConfigPDA = (merkleTree: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [merkleTree.toBuffer()],
    new PublicKey(MPL_BUBBLEGUM_ID)
  )[0]
}