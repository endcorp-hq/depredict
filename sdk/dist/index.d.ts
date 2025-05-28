import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { ShortxContract } from './types/shortx';
import Trade from './trade';
import Config from './config';
export default class ShortXClient {
    program: Program<ShortxContract>;
    provider: AnchorProvider;
    trade: Trade;
    config: Config;
    constructor(connection: Connection, wallet: Wallet);
}
