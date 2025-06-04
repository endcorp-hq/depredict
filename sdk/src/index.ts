import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { Connection } from '@solana/web3.js'
import { ShortxContract } from './types/shortx'
import IDL from './types/idl_shortx.json'
import Trade from './trade'
import Config from './config'
import Position from './position'

export default class ShortXClient {
  program: Program<ShortxContract>
  provider: AnchorProvider
  trade: Trade
  config: Config
  position: Position
  constructor(connection: Connection, wallet: Wallet) {
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed'
    })
    this.program = new Program(IDL as ShortxContract, this.provider)
    this.trade = new Trade(this.program)
    this.position = new Position(this.program)
    this.config = new Config(this.program)
  }
}