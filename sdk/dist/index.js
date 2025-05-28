import { AnchorProvider, Program } from '@coral-xyz/anchor';
import IDL from './types/idl_shortx.json';
import Trade from './trade';
import Config from './config';
export default class ShortXClient {
    constructor(connection, wallet) {
        this.provider = new AnchorProvider(connection, wallet, {
            commitment: 'confirmed'
        });
        this.program = new Program(IDL, this.provider);
        this.trade = new Trade(this.program);
        this.config = new Config(this.program);
    }
}
