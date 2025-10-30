# Depredict SDK

A TypeScript SDK for interacting with the Depredict Protocol Solana contract.

## Installation

```bash
npm install @endcorp/depredict
```

## Usage

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import DepredictClient, { TOKEN_MINTS, DEFAULT_MINT } from '@endcorp/depredict';

// Initialize the client
const connection = new Connection('https://api.devnet.solana.com');
const adminKey = new PublicKey('your-admin-key');
const feeVault = new PublicKey('your-fee-vault');
const client = new DepredictClient(connection, adminKey, feeVault);

// Use the client to interact with the protocol
// Example: Get all markets
const markets = await client.trade.getAllMarkets();
```

## Features

- Create and manage markets
- Place and manage orders
- View market data and order books
- Handle user trades and positions
- Built-in token constants for easy access
- Default USDC mint for markets

## API Documentation

### Trade Methods

- `getAllMarkets()`: Get all markets
- `getMarketById(marketId)`: Get market by ID
- `createMarket(args)`: Create a new market (mintAddress optional; defaults to USDC devnet)
- `openPosition(args)`: Open a new position (mint is automatically determined from market)
- `closeMarket(marketId, payer)`: Close a market
- `resolveMarket(args)`: Resolve a market
- `payoutPosition(args)`: Payout a position
  - Requires `rpcEndpoint` for DAS/MAS proof fetching

### Payout Example

```typescript
await client.trade.payoutPosition({
  marketId: 1,
  payer: wallet.publicKey,
  assetId: new PublicKey('<compressed-nft-asset-id>'),
  rpcEndpoint: 'https://your-das.example',
  returnMode: 'transaction',
});
```

### Token Constants

The SDK provides easy access to common token mints:

```typescript
import { TOKEN_MINTS, DEFAULT_MINT } from '@endcorp/depredict';

// Available token mints
console.log(TOKEN_MINTS.USDC_DEVNET); // USDC on devnet
console.log(TOKEN_MINTS.USDC_MAINNET); // USDC on mainnet
console.log(TOKEN_MINTS.BONK); // BONK token
console.log(TOKEN_MINTS.SOL); // SOL token

// Default mint (USDC devnet)
console.log(DEFAULT_MINT); // Same as TOKEN_MINTS.USDC_DEVNET
```

### Market Creation

When creating a market, you can specify the mint address or use the default (USDC devnet):

```typescript
// Using default mint (USDC devnet)
const marketArgs = {
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  question: "Will BTC reach $100k by end of year?",
  metadataUri: "https://example.com/metadata.json",
  payer: wallet.publicKey,
  // mintAddress is optional - defaults to USDC_DEVNET
  oracleType: OracleType.MANUAL,
  marketType: MarketType.FUTURE,
  // Required only for FUTURE markets
  bettingStartTime: Math.floor(Date.now() / 1000),
};

// Using specific token mint
const bonkMarketArgs = {
  ...marketArgs,
  question: "Will BONK reach $1 by end of year?",
  mintAddress: TOKEN_MINTS.BONK, // Use BONK token
};

const { tx, marketId } = await client.trade.createMarket(marketArgs);
```

### Position Trading

When opening a position, the mint and decimals are automatically determined from the market:

```typescript
const positionArgs = {
  marketId: 1,
  amount: 100, // Amount in the market's token; auto-converted using market decimals
  direction: { yes: {} },
  payer: wallet.publicKey,
  metadataUri: "https://example.com/position-metadata.json"
};

const { ixs, addressLookupTableAccounts } = await client.trade.openPosition(positionArgs);
```

**Note**: The SDK automatically handles decimal conversion based on each market's configured mint. For example:
- USDC markets (6 decimals): `amount: 100` becomes `100000000` (100 * 10^6)
- SOL markets (9 decimals): `amount: 1` becomes `1000000000` (1 * 10^9)

## License

MIT 