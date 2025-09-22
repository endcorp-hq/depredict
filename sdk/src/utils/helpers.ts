import {
  Market,
  WinningDirection,
  MarketStates,
  MarketType
} from '../types/trade.js'
import { PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { IdlAccounts } from '@coral-xyz/anchor'
import { Depredict } from '../types/depredict.js'
import { PositionDirection, PositionStatus } from '../types/position.js'

export const encodeString = (value: string, alloc = 32): number[] => {
  const buffer = Buffer.alloc(alloc, 32)

  buffer.write(value)

  return Array(...buffer)
}

export const decodeString = (bytes: number[]): string => {
  const buffer = Buffer.from(bytes)
  return buffer.toString('utf8').trim()
}

export const formatMarket = (
  account: IdlAccounts<Depredict>['marketState'],
  address: PublicKey
): Market => {
  return {
    bump: account.bump,
    address: address.toString(),
    authority: account.marketCreator.toString(),
    marketId: account.marketId.toString(),
    yesLiquidity: account.yesLiquidity.toString(),
    noLiquidity: account.noLiquidity.toString(),
    volume: account.volume.toString(),
    oraclePubkey: account.oraclePubkey ? account.oraclePubkey.toString() : '',
    nftCollectionMint: account.nftCollection ? account.nftCollection.toString() : '',
    mint: account.mint ? account.mint.toString() : '',
    decimals: account.decimals,
    marketVault: account.marketVault ? account.marketVault.toString() : '',
    marketState: getMarketState(account.marketState),
    updateTs: account.updateTs.toString(),
    nextPositionId: account.nextPositionId.toString(),
    marketStart: account.marketStart.toString(),
    marketEnd: account.marketEnd.toString(),
    question: Buffer.from(account.question).toString().replace(/\0+$/, ''),
    winningDirection: getWinningDirection(account.winningDirection),
    marketType: getMarketType(account.marketType),
    bettingStartTime: account.bettingStart.toString(),
  }
}

export const getMarketState = (
  status: IdlAccounts<Depredict>['marketState']['marketState']
): MarketStates => {
  const currentStatus = Object.keys(status)[0];
  return currentStatus as unknown as MarketStates;
}

export const getMarketType = (
  type: IdlAccounts<Depredict>['marketState']['marketType']
): MarketType => {
  const currentType = Object.keys(type)[0];
  return currentType as unknown as MarketType;
}


export const getWinningDirection = (
  direction: IdlAccounts<Depredict>['marketState']['winningDirection']
): WinningDirection => {
  const key = Object.keys(direction)[0];
  switch (key) {
    case 'yes':
      return WinningDirection.YES;
    case 'no':
      return WinningDirection.NO;
    case 'none':
      return WinningDirection.NONE;
    default:
      const upperKey = key.toUpperCase();
      if (upperKey in WinningDirection) {
        return WinningDirection[upperKey as keyof typeof WinningDirection];
      }
      throw new Error(`Invalid winning direction variant: ${key}`);
  }
};

export const getTokenProgram = (mint: PublicKey): PublicKey => {
  
  return TOKEN_PROGRAM_ID
}

export const getPositionDirection = (
  direction:
    | {
        yes: {}
      }
    | {
        no: {}
      }
): PositionDirection => {
  if (Object.keys(direction)[0] === 'yes') {
    return PositionDirection.YES
  }

  return PositionDirection.NO
}

export const getPositionStatus = (
  status:
    | {
        init: {}
      }
    | {
        open: {}
      }
    | {
        closed: {}
      }
    | {
        claimed: {}
      }
    | {
        liquidated: {}
      }
    | {
        waiting: {}
      }
): PositionStatus => {
  let currentStatus = Object.keys(status)[0]

  switch (currentStatus) {
    case 'init':
      return PositionStatus.INIT
    case 'open':
      return PositionStatus.OPEN
    case 'closed':
      return PositionStatus.CLOSED
    case 'claimed':
      return PositionStatus.CLAIMED
    case 'liquidated':
      return PositionStatus.LIQUIDATED
    case 'waiting':
      return PositionStatus.WAITING
    default:
      throw new Error('Invalid order status')
  }
}