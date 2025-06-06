import { Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { ShortxContract } from './types/shortx';
import Trade from './trade';
import Config from './config';
import Position from './position';
export default class ShortXClient {
    program: Program<ShortxContract>;
    trade: Trade;
    config: Config;
    position: Position;
    ADMIN_KEY: PublicKey;
    FEE_VAULT: PublicKey;
    USDC_MINT: PublicKey;
    constructor(connection: Connection, adminKey: PublicKey, feeVault: PublicKey, usdcMint: PublicKey);
}
