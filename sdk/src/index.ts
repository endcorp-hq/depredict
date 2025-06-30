import { Program } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { ShortxContract } from './types/shortx.js'
import IDL from './types/idl_shortx.json'  // tsup will handle this
import Trade from './trade.js'
import Config from './config.js'
import Position from './position.js'

export default class ShortXClient {
  program: Program<ShortxContract>
  trade: Trade
  config: Config
  position: Position
  ADMIN_KEY: PublicKey
  FEE_VAULT: PublicKey
  USDC_MINT: PublicKey
  
  constructor(connection: Connection, adminKey: PublicKey, feeVault: PublicKey, usdcMint: PublicKey) {
    this.program = new Program(IDL as ShortxContract, { connection })
    this.trade = new Trade(this.program, adminKey, feeVault, usdcMint)
    this.position = new Position(this.program)
    this.config = new Config(this.program, adminKey, feeVault, usdcMint)
    this.ADMIN_KEY = adminKey
    this.FEE_VAULT = feeVault
    this.USDC_MINT = usdcMint
  }
}

//export types
export * from './types/trade.js'
export * from './types/position.js'
export * from './types/shortx.js'
export * from './types/index.js'


