import { Program } from "@coral-xyz/anchor";
import { ShortxContract } from "./types/shortx";
export default class Config {
    private program;
    constructor(program: Program<ShortxContract>);
    /**
     * Init a config account to maintain details
     *
     */
    createConfig(feeAmount: number): Promise<void>;
}
