import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
export const convertSecretKeyToKeypair = (key) => Keypair.fromSecretKey(bs58.decode(key));
