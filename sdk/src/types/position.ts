import { PublicKey } from "@solana/web3.js";

export type PositionAccount = {
  authority: PublicKey;
  positions: Position[];
  nonce: number;
  isSubPosition: boolean;
  marketId: number;
};

export type Position = {
  ts: string;
  positionId: string;
  marketId: string;
  positionStatus: PositionStatus;
  amount: string;
  mint: string;
  direction: PositionDirection;
  positionNonce: string;
  createdAt: string;
};

export enum PositionDirection {
  YES = "yes",
  NO = "no",
}

export enum PositionStatus {
  INIT = "init",
  OPEN = "open",
  CLOSED = "closed",
  CLAIMED = "claimed",
  LIQUIDATED = "liquidated",
  WAITING = "waiting",
}
