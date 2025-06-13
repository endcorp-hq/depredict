import {
  Market,
  WinningDirection,
  MarketStates
} from '../types/trade'
import { PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { IdlAccounts } from '@coral-xyz/anchor'
import { ShortxContract } from '../types/shortx'
import { PositionAccount, Position, PositionDirection, PositionStatus } from '../types/position'

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
  account: IdlAccounts<ShortxContract>['marketState'],
  address: PublicKey
): Market => {
  return {
    bump: account.bump,
    address: address.toString(),
    authority: account.authority.toString(),
    marketId: account.marketId.toString(),
    yesLiquidity: account.yesLiquidity.toString(),
    noLiquidity: account.noLiquidity.toString(),
    volume: account.volume.toString(),
    oraclePubkey: account.oraclePubkey ? account.oraclePubkey.toString() : '',
    nftCollectionMint: account.nftCollection ? account.nftCollection.toString() : '',
    marketUsdcVault: account.marketUsdcVault ? account.marketUsdcVault.toString() : '',
    marketState: getMarketState(account.marketState),
    updateTs: account.updateTs.toString(),
    nextPositionId: account.nextPositionId.toString(),
    marketStart: account.marketStart.toString(),
    marketEnd: account.marketEnd.toString(),
    question: Buffer.from(account.question).toString().replace(/\0+$/, ''),
    winningDirection: getWinningDirection(account.winningDirection),
  }
}

export const formatPositionAccount = (
  account: IdlAccounts<ShortxContract>['positionAccount'],
  marketId?: number
): PositionAccount => {
  console.log('formatPositionAccount', account)
  return {
    authority: account.authority,
    marketId: marketId ? marketId : account.marketId ? account.marketId.toNumber() : 0,
    positions: account.positions.map((position: any) =>
      formatPosition(position)
    ),
    nonce: account.nonce,
    isSubPosition: account.isSubPosition
  }
}

export const formatPosition = (
  position: IdlAccounts<ShortxContract>['positionAccount']['positions'][number]
): Position => {
  return {
    ts: position.ts.toString(),
    positionNonce: position.positionNonce.toString(),
    createdAt: position.createdAt ? position.createdAt.toString() : '',
    positionId: position.positionId.toString(),
    marketId: position.marketId.toString(),
    mint: position.mint ? position.mint.toString() : '',
    positionStatus: getPositionStatus(position.positionStatus),
    direction: getPositionDirection(position.direction),
    amount: position.amount.toString(),
  }
}

export const getMarketState = (
  status: IdlAccounts<ShortxContract>['marketState']['marketState']
): MarketStates => {
  const currentStatus = Object.keys(status)[0];
  return currentStatus as unknown as MarketStates;
}



export const getWinningDirection = (
  direction: IdlAccounts<ShortxContract>['marketState']['winningDirection']
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