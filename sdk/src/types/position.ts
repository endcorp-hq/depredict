export type PositionAccount = {
    positions: Position[]
    nonce: string
    isSubPosition: boolean
    marketId: number
  }
  
  export type Position = {
    ts: string
    positionId: string
    marketId: string
    positionStatus: PositionStatus
    amount: string
    version: string
    direction: PositionDirection
    positionNonce: string
    authority: string
    createdAt: string
  }

  export enum PositionDirection {
    YES = 'yes',
    NO = 'no'
  }
  
  export enum PositionStatus {
    INIT = 'init',
    OPEN = 'open',
    CLOSED = 'closed',
    CLAIMED = 'claimed',
    LIQUIDATED = 'liquidated',
    WAITING = 'waiting'
  }

