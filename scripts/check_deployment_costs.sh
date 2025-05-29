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

# Get program size in KB and convert to bytes
PROGRAM_SIZE_KB=$(du -k target/deploy/shortx_market_contract.so | cut -f1)
PROGRAM_SIZE=$((PROGRAM_SIZE_KB * 1024))

# Calculate buffer size (2n + 45)
BUFFER_SIZE=$((2 * PROGRAM_SIZE + 45))

echo "Network: $NETWORK"
echo "Program size: $PROGRAM_SIZE_KB KB ($PROGRAM_SIZE bytes)"
echo "Buffer size: $BUFFER_SIZE bytes"

# Get rent cost
echo "Calculating rent cost on $NETWORK..."
RENT_COST=$(solana rent $BUFFER_SIZE --url $NETWORK)
if [ $? -ne 0 ]; then
    echo "Error: Failed to calculate rent cost"
    exit 1
fi

# Extract the rent value from the output
RENT_VALUE=$(echo "$RENT_COST" | grep "Rent-exempt minimum" | awk '{print $3}')
if [ -z "$RENT_VALUE" ]; then
    echo "Error: Could not parse rent cost from output"
    echo "Raw output:"
    echo "$RENT_COST"
    exit 1
fi

echo "Rent cost: $RENT_VALUE SOL"

# Get wallet balance
echo "Checking wallet balance on $NETWORK..."
WALLET_BALANCE=$(solana balance --url $NETWORK --keypair $PROVIDER_WALLET | awk '{print $1}')
if [ $? -ne 0 ]; then
    echo "Error: Failed to get wallet balance"
    exit 1
fi

echo "Wallet balance: $WALLET_BALANCE SOL"

# Compare balance with rent cost
if (( $(echo "$WALLET_BALANCE < $RENT_VALUE" | bc -l) )); then
    echo "Warning: Wallet balance is less than required rent cost!"
    echo "You need at least $RENT_VALUE SOL to deploy"
else
    echo "Wallet has sufficient balance for deployment"
fi