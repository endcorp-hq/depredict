# Mainnet Initialization Script

This script initializes the config account for the depredict program on mainnet.

## Prerequisites

1. **Program deployed on mainnet** - Make sure your program is deployed and the program ID is correct in the script
2. **Admin keypair** - The keypair that will be the authority for the config
3. **Fee vault keypair** - The keypair that will receive fees
4. **Sufficient SOL balance** - Admin account needs at least 0.1 SOL for transaction fees

## Configuration

### Update Program ID

Before running the script, update the `PROGRAM_ID` constant in `init.ts` with your actual mainnet program ID:

```typescript
const PROGRAM_ID = "your_actual_mainnet_program_id_here";
```

### Keypair Setup

You can provide the keypairs in two ways:

#### Option 1: Environment Variables (Recommended for security)

```bash
export ADMIN_PRIVATE_KEY='[1,2,3,...]'  # JSON array of private key bytes
export FEE_VAULT_PRIVATE_KEY='[1,2,3,...]'  # JSON array of private key bytes
```

#### Option 2: Keypair Files

Create the keypair files in the deploy directory:

```bash
# admin-keypair.json
[1,2,3,...]  # JSON array of private key bytes

# fee-vault-keypair.json  
[1,2,3,...]  # JSON array of private key bytes
```

Or set custom paths via environment variables:

```bash
export ADMIN_KEY_PATH="./path/to/admin-keypair.json"
export FEE_VAULT_KEY_PATH="./path/to/fee-vault-keypair.json"
```

## Running the Script

### Using npm/yarn script

```bash
yarn init-mainnet
```

### Using ts-node directly

```bash
npx ts-node deploy/scripts/init.ts
```

## What the Script Does

1. **Loads keypairs** from environment variables or files
2. **Checks account balances** to ensure sufficient SOL for transaction fees
3. **Calculates the config PDA** using the program ID and "config" seed
4. **Checks if config already exists** to prevent duplicate initialization
5. **Initializes the config account** with:
   - Authority: Admin public key
   - Fee vault: Fee vault public key
   - Fee amount: 100 lamports (0.0000001 SOL)
   - Version: 1
   - Next market ID: 1
   - Number of markets: 0
6. **Verifies the config** was created correctly
7. **Saves config info** to `deploy/config-info.json`

## Output

The script will output:
- Account public keys
- Balance checks
- Transaction signature
- Config verification details
- Path to saved config info file

## Error Handling

The script handles common errors:
- Insufficient account balance
- Config already exists
- Invalid keypair formats
- Network connection issues
- Program errors

## Security Notes

- **Never commit private keys** to version control
- **Use environment variables** for production deployments
- **Verify the program ID** before running on mainnet
- **Test on devnet first** to ensure everything works correctly

## Post-Initialization

After successful initialization, you can:
- Use the saved config info for future reference
- Update fee amounts, authority, or fee vault using the program's update instructions
- Start creating markets and positions

## Troubleshooting

### "Admin keypair not found"
- Ensure environment variables are set correctly
- Check that keypair files exist and are readable
- Verify the keypair format (JSON array of numbers)

### "Insufficient balance"
- Fund the admin account with at least 0.1 SOL
- Check the account balance manually: `solana balance <admin_public_key>`

### "Config already exists"
- The config has already been initialized
- Check the existing config details in the output
- Use update instructions to modify the config if needed

### "Program error"
- Check the program logs in the error output
- Verify the program ID is correct
- Ensure the program is deployed and accessible 