# Test Runner for Depredict Contract

This directory contains comprehensive test runners that execute all tests in the correct order for the Depredict contract.

## Quick Start

### 1. Setup Localnet (Recommended)
```bash
# Setup localnet with MPL Core and Switchboard programs
./tests/setup-localnet.sh

# Run full test suite
anchor run test-runner-continue

# Stop validator when done
./tests/stop-validator.sh
```

### 2. Run Tests
```bash
# Run with continue-on-failure (recommended)
anchor run test-runner-continue

# Run with verbose logging
anchor run test-runner-continue-verbose

# Run individual tests
yarn test:runner --continue-on-failure --verbose
```

## Test Execution Order

The test suite runs in this order:

1. **create-usdc-mint.ts** - USDC Mint Setup
2. **config.ts** - Configuration Setup  
3. **setup-markets.ts** - Market Setup (creates markets in different states)
4. **create-market.ts** - Market Creation (manual & oracle-based)
5. **create-order.ts** - Order Creation & NFT Minting
6. **resolve-market.ts** - Market Resolution
7. **payout-nft.ts** - NFT Payout

## Prerequisites

1. **Required key files in `tests/keys/`:**
   - `keypair.json` - Admin keypair
   - `fee-vault.json` - Fee vault keypair
   - `user.json` - User keypair
   - `local-mint.json` - Local USDC mint keypair

2. **Dependencies:**
   ```bash
   yarn install
   ```

## Network Support

### Localnet (Full Testing)
- ✅ **Complete functionality** with MPL Core and Switchboard pre-loaded
- ✅ **Fast and free** testing environment
- ✅ **Manual resolution markets** work perfectly
- ✅ **NFT creation and management** via MPL Core
- ✅ **Oracle testing** via Switchboard

### Devnet (Production Testing)
- ✅ **Real network conditions** and oracles
- ✅ **Production validation**
- ⚠️ **Slower** and requires SOL airdrops

## Market State Testing

The test suite creates and tests markets in different states:

- **Active Market**: Open for betting
- **Closed Market**: Betting period ended
- **Resolved Market**: Has winning direction
- **Manual Market**: Manual resolution (no oracle)

Market IDs are automatically tracked in `tests/market-id.json` and propagated between tests.

## Troubleshooting

### Common Issues

1. **Missing key files:**
   ```
   ❌ Missing: tests/keys/keypair.json
   ```
   Generate required keypairs in `tests/keys/` directory.

2. **Validator not running:**
   ```
   ❌ Local validator is not running
   ```
   Run `./tests/setup-localnet.sh` to start validator with required programs.

3. **Test failures on re-run:**
   - Use `--continue-on-failure` flag to run remaining tests
   - Some setup tests fail if already completed (expected behavior)

### Debug Mode
```bash
# Run individual test with verbose output
yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/config.ts --reporter spec
```

## Features

- ✅ **Automatic market ID tracking** and propagation
- ✅ **Multi-state market testing** (active, closed, resolved, manual)
- ✅ **Continue-on-failure mode** for robust testing
- ✅ **Verbose logging** for detailed error information
- ✅ **Prerequisites checking** (validator, key files)
- ✅ **Progress tracking** and comprehensive summaries 