import { PublicKey } from '@solana/web3.js'

// Common token mints
export const TOKEN_MINTS = {
  // USDC
  USDC_DEVNET: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
  USDC_MAINNET: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  
  // Other popular tokens
  BONK: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
  SOL: new PublicKey('So11111111111111111111111111111111111111112'),
} as const

// Default mint (USDC devnet for development)
export const DEFAULT_MINT = TOKEN_MINTS.USDC_DEVNET

// Token decimals mapping
export const TOKEN_DECIMALS = {
  [TOKEN_MINTS.USDC_DEVNET.toBase58()]: 6,
  [TOKEN_MINTS.USDC_MAINNET.toBase58()]: 6,
  [TOKEN_MINTS.BONK.toBase58()]: 5,
  [TOKEN_MINTS.SOL.toBase58()]: 9,
} as const

// Metaplex program ID
export const METAPLEX_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'