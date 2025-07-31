# Depredict SDK

A TypeScript SDK for interacting with the Depredict Protocol Solana contract.

## Installation

```bash
npm install depredict-sdk
```

## Usage

```typescript
import { Connection } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';
import DepredictClient from 'depredict-sdk';

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

## API Documentation

### Trade Methods

- `getAllMarkets()`: Get all markets
- `getMarketById(marketId)`: Get market by ID
- `createMarket(args)`: Create a new market (requires mintAddress)
- `openPosition(args)`: Open a new position (mint is automatically determined from market)
- `closeMarket(marketId, payer)`: Close a market
- `resolveMarket(args)`: Resolve a market
- `payoutPosition(args)`: Payout a position

### Market Creation

When creating a market, you must specify the mint address:

```typescript
const marketArgs = {
  startTime: Date.now() / 1000,
  endTime: (Date.now() / 1000) + 86400, // 24 hours from now
  question: "Will BTC reach $100k by end of year?",
  metadataUri: "https://example.com/metadata.json",
  payer: wallet.publicKey,
  feeVaultAccount: feeVault,
  mintAddress: new PublicKey("USDC_MINT_ADDRESS"), // Specify the mint for this market
  oracleType: OracleType.MANUAL,
  marketType: MarketType.FUTURE
};

const { tx, marketId } = await client.trade.createMarket(marketArgs);
```

### Position Trading

When opening a position, the mint and decimals are automatically determined from the market:

```typescript
const positionArgs = {
  marketId: 1,
  amount: 100, // Amount in the market's token (will be converted using market's decimals)
  token: "USDC_MINT_ADDRESS", // Token to pay with (will be swapped if different from market mint)
  direction: { yes: {} },
  payer: wallet.publicKey,
  feeVaultAccount: feeVault,
  metadataUri: "https://example.com/position-metadata.json"
};

const { ixs, addressLookupTableAccounts } = await client.trade.openPosition(positionArgs);
```

**Note**: The SDK automatically handles decimal conversion based on each market's configured mint. For example:
- USDC markets (6 decimals): `amount: 100` becomes `100000000` (100 * 10^6)
- SOL markets (9 decimals): `amount: 1` becomes `1000000000` (1 * 10^9)

## License

MIT 