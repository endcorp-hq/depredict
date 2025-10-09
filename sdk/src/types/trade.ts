import { AddressLookupTableAccount, PublicKey, TransactionInstruction, VersionedTransaction } from '@solana/web3.js'

export type Market = {
  address: string
  bump: number
  authority: string
  oraclePubkey: string
  nftCollectionMint: string
  marketVault: string
  mint: string
  decimals: number
  marketId: string
  yesLiquidity: string
  noLiquidity: string
  volume: string
  updateTs: string
  nextPositionId: string
  marketState: MarketStates
  marketStart: string
  marketEnd: string
  bettingStartTime: string
  question: string
  winningDirection: WinningDirection
  marketType: MarketType
}


export enum MarketStates {
  ACTIVE = 'active',
  ENDED = 'ended',
  RESOLVING = 'resolving',
  RESOLVED = 'resolved'
}


export enum WinningDirection {
  NONE = 'None',
  YES = 'Yes',
  NO = 'No',
  DRAW = 'Draw'
}


export type InitializeMarketArgs = {
  marketId: number
  startTime: number
  endTime: number
  question: string
  feeBps: number
  customer: PublicKey | null
}

export type CreateCustomerArgs = {
  id: number
  name: string
  authority: PublicKey
  feeRecipient: PublicKey
}

export type OpenOrderArgs = {
  marketId: number
  amount: number
  direction:
    | {
        yes: {}
      }
    | {
        no: {}
      }
  payer: PublicKey,
  feeVaultAccount: PublicKey,
  metadataUri: string
}

export type PayoutArgs = {
  marketId: number
  payer: PublicKey
  assetId: PublicKey
  rpcEndpoint?: string
  returnMode?: 'ixs' | 'message' | 'transaction'
}

export type PayoutPositionIxResult = {
  ixs: TransactionInstruction[]
  alts: (AddressLookupTableAccount | string)[]
  /** @deprecated use ixs */
  instructions?: TransactionInstruction[]
  /** @deprecated use alts */
  addressLookupTableAccounts?: (AddressLookupTableAccount | string)[]
}

export type PayoutPositionMessageResult = {
  message: Uint8Array
  alts: string[]
}

export type PayoutPositionTxResult = {
  transaction: VersionedTransaction
  alts: string[]
}

export enum OracleType {
  SWITCHBOARD = 'switchboard',
  MANUAL = 'manual'
}

export enum MarketType {
  LIVE = 'live',
  FUTURE = 'future'
}

export type CreateMarketArgs = {
  bettingStartTime?: number
  startTime: number
  endTime: number
  question: string
  metadataUri: string
  payer: PublicKey
  feeVaultAccount: PublicKey
  mintAddress?: PublicKey // Optional, defaults to USDC_DEVNET
  oraclePubkey?: PublicKey
  oracleType: OracleType
  marketType: MarketType
}
