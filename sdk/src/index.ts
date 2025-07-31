import { Program } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { Depredict } from './types/depredict.js'
import IDL from './types/depredict.json'  // tsup will handle this
import Trade from './trade.js'
import Config from './config.js'
import Position from './position.js'

// Re-export all types
export * from './types/trade.js'
export * from './types/position.js'
export * from './types/index.js'

export default class DepredictClient {
  program: Program<Depredict>
  trade: Trade
  config: Config
  position: Position
  ADMIN_KEY: PublicKey
  FEE_VAULT: PublicKey
  
  constructor(connection: Connection, adminKey: PublicKey, feeVault: PublicKey) {
    this.program = new Program(IDL as Depredict, { connection })
    this.trade = new Trade(this.program, adminKey, feeVault)
    this.position = new Position(this.program)
    this.config = new Config(this.program, adminKey, feeVault)
    this.ADMIN_KEY = adminKey
    this.FEE_VAULT = feeVault
  }
}


