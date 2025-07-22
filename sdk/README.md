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
const wallet = new Wallet(/* your wallet */);
const client = new DepredictClient(connection, wallet);

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
- `createMarket(args)`: Create a new market
- `openOrder(args)`: Open a new order
- `closeOrder(args)`: Close an existing order
- `settleOrder(args)`: Settle an order

## License

MIT 