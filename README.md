# ShortX Market Contract

A Solana-based prediction market contract that allows users to bet on outcomes of events.

Devnet: `shrtX1eBcrSci4CdZU7t1X1uaxV77VC4FatEqYwtZoJ`  
Mainnet: `shrtX1eBcrSci4CdZU7t1X1uaxV77VC4FatEqYwtZoJ`
## Prerequisites

- Node.js and Yarn
- Solana CLI tools
- Anchor Framework

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Build the program:
```bash
anchor build
```

## Running Tests

The test suite is organized into several files, each testing different aspects of the contract:

### Configuration Tests
```bash
anchor run test test-config
```
Tests the initialization and updating of the contract configuration.

### Market Tests
```bash
# Create a new market
anchor run test test-create-market

# Close an existing market
anchor run test test-close-market

# Update market parameters
anchor run test test-update-market
```

### User Tests
```bash
# Create a new user
anchor run test test-create-user

# Create user trade account
anchor run test test-user-trade

# Create subuser trade account
anchor run test test-create-sub-trade
```

### Order Flow Tests
```bash
anchor run test test-order-flow
```
Tests the complete order lifecycle:
- Creating orders (Yes/No)
- Market resolution
- Order payouts

## Test Structure

- `tests/config.ts`: Tests contract configuration
- `tests/market/`: Market-related tests
  - `create-market.ts`: Market creation
  - `close-market.ts`: Market closure
  - `update-market.ts`: Market updates
- `tests/user/`: User-related tests
  - `create-user.ts`: User creation
  - `create-user-trade.ts`: User trade account creation
  - `create-subuser-trade.ts`: Subuser trade account creation
- `tests/trade/`: Trading tests
  - `order-flow.ts`: Complete order lifecycle

## Key Files (need to be created in the root)

- `keypair.json`: Admin keypair
- `fee-vault.json`: Fee vault keypair
- `local_mint.json`: Local token mint keypair
- `user.json`: Test user keypair

## Notes

- Tests run on a local Solana validator
- Each test file is independent and can be run separately
- Some tests require specific market IDs to be set correctly
- The order flow test includes delays to ensure proper transaction sequencing
