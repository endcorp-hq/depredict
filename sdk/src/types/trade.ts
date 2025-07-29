import { PublicKey } from '@solana/web3.js'

export type Market = {
  address: string
  bump: number
  authority: string
  oraclePubkey: string
  nftCollectionMint: string
  marketUsdcVault: string
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
  token: string
  direction:
    | {
        yes: {}
      }
    | {
        no: {}
      }
  mint: PublicKey,
  payer: PublicKey,
  feeVaultAccount: PublicKey,
  usdcMintAddress: PublicKey
  metadataUri: string
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
  usdcMintAddress: PublicKey
  oraclePubkey?: PublicKey
  oracleType: OracleType
  marketType: MarketType
}
