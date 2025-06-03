#!/bin/bash

solana-keygen new --force --outfile ./tests/keys/admin.json
solana-keygen new --force --outfile ./tests/keys/fee-vault.json
solana-keygen new --force --outfile ./tests/keys/local-mint.json
solana-keygen new --force --outfile ./tests/keys/user.json