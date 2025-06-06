import { Program } from '@coral-xyz/anchor';
import IDL from './types/idl_shortx.json';
import Trade from './trade';
import Config from './config';
import Position from './position';
export default class ShortXClient {
    constructor(connection, adminKey, feeVault, usdcMint) {
        this.program = new Program(IDL, { connection });
        this.trade = new Trade(this.program, adminKey, feeVault, usdcMint);
        this.position = new Position(this.program);
        this.config = new Config(this.program, adminKey, feeVault);
        this.ADMIN_KEY = adminKey;
        this.FEE_VAULT = feeVault;
        this.USDC_MINT = usdcMint;
    }
}
