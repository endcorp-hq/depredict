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

// Program IDs used by on-chain CPIs
export const METAPLEX_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
export const MPL_CORE_PROGRAM_ID = 'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'
export const MPL_BUBBLEGUM_ID = 'BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY'
export const MPL_NOOP_ID = 'mnoopTCrg4p8ry25e4bcWA9XZjbNjMTfgYVGGEdRsf3'
export const MPL_ACCOUNT_COMPRESSION_ID = 'mcmt6YrQEMKw8Mw43FmpRLmf7BqRnFMKmAcbxE3xkAW'
export const MPL_CORE_CPI_SIGNER = 'CbNY3JiXdXNE9tPNEk1aRZVEkWdj2v7kfJLNQwZZgpXk'