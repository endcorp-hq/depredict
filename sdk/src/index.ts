import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { Depredict } from "./types/depredict.js";
import DEVNET_IDL from "./types/depredict-devnet.json"; // tsup will handle this
import MAINNET_IDL from "./types/depredict-mainnet.json"; // tsup will handle this
import Trade from "./trade.js";
import Config from "./config.js";
import Position from "./position.js";
import MarketCreator from './marketCreator.js'

// Re-export all types
export * from "./types/trade.js";
export * from "./types/position.js";
export * from "./types/index.js";

// Re-export constants
export * from "./utils/constants.js";
export { getUmi, toWeb3PublicKey, toUmiPublicKey, normalizeResult, buildV0Message } from "./utils/mplHelpers.js";

export default class DepredictClient {
  program: Program<Depredict>;
  trade: Trade;
  config: Config;
  position: Position;
  marketCreator: MarketCreator

  constructor(
    connection: Connection,
  ) {

    this.program = new Program(
      connection.rpcEndpoint.includes("devnet")
        ? (DEVNET_IDL as Depredict)
        : (MAINNET_IDL as Depredict),
      { connection }
    );
    this.trade = new Trade(this.program);
    this.position = new Position(this.program);
    this.config = new Config(this.program);
    this.marketCreator = new MarketCreator(this.program)
  }
}
