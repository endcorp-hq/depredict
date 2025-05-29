#!/bin/bash

# Check if network argument is provided, default to devnet if not
NETWORK=${1:-devnet}

# Validate network parameter
if [[ ! "$NETWORK" =~ ^(devnet|mainnet|localnet)$ ]]; then
    echo "Error: Invalid network. Must be one of: devnet, mainnet, localnet"
    echo "Usage: $0 [network]"
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found"
    exit 1
fi

# Check if PROVIDER_WALLET is set
if [ -z "$PROVIDER_WALLET" ]; then
    echo "Error: PROVIDER_WALLET is not set in .env file"
    exit 1
fi

echo "Deploying to $NETWORK..."

# Run the deployment command
anchor deploy \
    --program-name shortx_market_contract \
    --provider.cluster $NETWORK \
    --provider.wallet "$PROVIDER_WALLET" 