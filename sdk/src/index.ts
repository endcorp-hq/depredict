import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { ShortxContract } from './types/shortx'
import IDL from './types/idl_shortx.json'
import Trade from './trade'
import Config from './config'
import Position from './position'

export default class ShortXClient {
  program: Program<ShortxContract>
  trade: Trade
  config: Config
  position: Position
  ADMIN_KEY: PublicKey
  FEE_VAULT: PublicKey
  USDC_MINT: PublicKey
  constructor(connection: Connection, adminKey: PublicKey, feeVault: PublicKey, usdcMint: PublicKey) {
    this.program = new Program(IDL as ShortxContract,{connection})
    this.trade = new Trade(this.program, adminKey, feeVault, usdcMint)
    this.position = new Position(this.program)
    this.config = new Config(this.program, adminKey, feeVault)
    this.ADMIN_KEY = adminKey
    this.FEE_VAULT = feeVault
    this.USDC_MINT = usdcMint
  }
}


