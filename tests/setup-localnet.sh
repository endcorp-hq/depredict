#!/bin/bash

# Setup Localnet with MPL Core and Switchboard
# This script sets up a local Solana validator with MPL Core and Switchboard programs installed

set -e  # Exit on any error

echo "🚀 Setting up Localnet with MPL Core and Switchboard..."

# Program addresses
MPL_CORE_ADDRESS="CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
SWITCHBOARD_ADDRESS="SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    print_error "Solana CLI is not installed. Please install it first."
    exit 1
fi

# Check if anchor is installed
if ! command -v anchor &> /dev/null; then
    print_error "Anchor CLI is not installed. Please install it first."
    exit 1
fi

# Check if we're on localnet
CURRENT_CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
if [[ "$CURRENT_CLUSTER" != *"localhost"* ]]; then
    print_warning "Not currently on localnet. Current cluster: $CURRENT_CLUSTER"
    print_status "Switching to localnet..."
    solana config set --url localhost
fi

# Kill any existing validator processes
print_status "Stopping any existing validator processes..."
pkill -f "solana-test-validator" || true
sleep 2

# Create logs directory if it doesn't exist
mkdir -p tests/logs

# Download MPL Core program if it doesn't exist
if [ ! -f "tests/mpl-core.so" ]; then
    print_status "Downloading MPL Core program from mainnet..."
    solana program dump $MPL_CORE_ADDRESS tests/mpl-core.so --url mainnet-beta
    
    if [ ! -f "tests/mpl-core.so" ]; then
        print_error "Failed to download MPL Core program"
        exit 1
    fi
    
    print_success "Downloaded MPL Core program to tests/mpl-core.so"
else
    print_success "MPL Core program already exists"
fi

# Download Switchboard program if it doesn't exist
if [ ! -f "tests/switchboard.so" ]; then
    print_status "Downloading Switchboard program from mainnet..."
    solana program dump $SWITCHBOARD_ADDRESS tests/switchboard.so --url mainnet-beta
    
    if [ ! -f "tests/switchboard.so" ]; then
        print_error "Failed to download Switchboard program"
        exit 1
    fi
    
    print_success "Downloaded Switchboard program to tests/switchboard.so"
else
    print_success "Switchboard program already exists"
fi

# Start validator with reset flag and programs pre-loaded
print_status "Starting Solana test validator with reset flag..."
print_status "This will clear all existing data and start fresh..."
print_status "MPL Core and Switchboard will be pre-loaded..."

# Start the validator in the background with reset flag and programs pre-loaded
solana-test-validator \
    --reset \
    --rpc-port 8899 \
    --quiet \
    --ledger tests/validator-ledger \
    --bpf-program $MPL_CORE_ADDRESS tests/mpl-core.so \
    --bpf-program $SWITCHBOARD_ADDRESS tests/switchboard.so &

VALIDATOR_PID=$!
print_success "Validator started with PID: $VALIDATOR_PID"

# Wait for validator to be ready
print_status "Waiting for validator to be ready..."
sleep 5

# Check if validator is responding
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if solana cluster-version &> /dev/null; then
        print_success "Validator is ready!"
        break
    else
        print_status "Waiting for validator... (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)"
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Validator failed to start properly"
    kill $VALIDATOR_PID 2>/dev/null || true
    exit 1
fi

# Get the current slot to verify connection
CURRENT_SLOT=$(solana slot)
print_success "Connected to validator. Current slot: $CURRENT_SLOT"

# Verify MPL Core is working
print_status "Verifying MPL Core program..."
if solana program show $MPL_CORE_ADDRESS &> /dev/null; then
    print_success "MPL Core program is ready for use!"
else
    print_error "Failed to verify MPL Core program"
    kill $VALIDATOR_PID 2>/dev/null || true
    exit 1
fi

# Verify Switchboard is working
print_status "Verifying Switchboard program..."
if solana program show $SWITCHBOARD_ADDRESS &> /dev/null; then
    print_success "Switchboard program is ready for use!"
else
    print_error "Failed to verify Switchboard program"
    kill $VALIDATOR_PID 2>/dev/null || true
    exit 1
fi

# Build and deploy the program
print_status "Building the depredict program..."
if anchor build; then
    print_success "Program built successfully!"
else
    print_error "Failed to build program"
    kill $VALIDATOR_PID 2>/dev/null || true
    exit 1
fi

# Deploy the program
if anchor deploy --provider.cluster localnet; then
    print_success "Program deployed successfully!"
else
    print_error "Failed to deploy program"
    kill $VALIDATOR_PID 2>/dev/null || true
    exit 1
fi

# Create a simple script to stop the validator
cat > tests/stop-validator.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Solana test validator..."
pkill -f "solana-test-validator" || true
echo "✅ Validator stopped"
EOF

chmod +x tests/stop-validator.sh

print_success "Localnet setup complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Solana test validator running with reset flag"
echo "   ✅ MPL Core program loaded and ready"
echo "   ✅ Switchboard program loaded and ready"
echo "   ✅ depredict program built and deployed"
echo "   ✅ Validator logs: tests/logs/validator.log"
echo "   ✅ Stop validator: ./tests/stop-validator.sh"
echo ""
echo "🚀 You can now run your tests with:"
echo "   anchor run test-runner-continue"
echo ""
echo "💡 To stop the validator later, run:"
echo "   ./tests/stop-validator.sh"
echo ""
echo "📝 Validator is running in the background. Check logs with:"
echo "   tail -f tests/logs/validator.log" 