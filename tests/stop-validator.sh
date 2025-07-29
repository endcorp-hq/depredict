#!/bin/bash
echo "🛑 Stopping Solana test validator..."
pkill -f "solana-test-validator" || true
echo "✅ Validator stopped"
