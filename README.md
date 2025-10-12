
![dePredict Logo](./img/depredict_logo.png "DePredict Logo")

Depredict is a decentralized prediction market protocol on Solana. Anyone can spin up their own prediction market using our open-source smart contract and TypeScript SDK.

- [Documentation](./depredict-docs) — Full guides, API reference, and examples
- [SDK on npm](https://www.npmjs.com/package/@endcorp/depredict)
- [END Corp.](https://endcorp.co) — Project lead

`Program ID: deprZ6k7MU6w3REU6hJ2yCfnkbDvzUZaKE4Z4BuZBhU`

## 📁 Repository Map
### 🏗️ Core Components

| Component | Location | Description | Tech Stack |
|-----------|----------|-------------|------------|
| **On-chain Program** | [`programs/depredict/`](./programs/depredict/) | Solana smart contracts for prediction markets | Rust, Anchor |
| **TypeScript SDK** | [`sdk/`](./sdk/) | Client library for protocol interaction | TypeScript, Solana Web3.js |
| **Documentation** | [`depredict-docs/`](./depredict-docs/) | Comprehensive guides and API docs | Vocs, React |

### 🛠️ Development & Testing

| Directory | Purpose |
|-----------|---------|
| [`tests/`](./tests/) | Integration tests and test utilities |
| [`deploy/`](./deploy/) | Deployment scripts and configuration |
| [`migrations/`](./migrations/) | Database and state migrations |
| [`Anchor.toml`](./Anchor.toml) | Anchor framework configuration |

### 📦 Package Structure

```
depredict/
├── 📄 Anchor.toml              # Anchor configuration & test scripts
├── 📄 package.json             # Root dependencies & scripts
├── 🦀 programs/depredict/      # Solana smart contracts
│   ├── src/instructions/       # Program instructions
│   ├── src/state/             # Account state structures
│   └── Cargo.toml             # Rust dependencies
├── 📚 sdk/                     # TypeScript SDK
│   ├── src/types/             # TypeScript definitions
│   ├── src/utils/             # Utility functions
│   └── package.json           # SDK package config
├── 📖 depredict-docs/          # Documentation site
│   ├── docs/pages/            # Documentation pages
│   └── package.json           # Docs dependencies
├── 🧪 tests/                   # Integration tests
│   ├── market/                # Market-related tests
│   ├── trade/                 # Trading tests
│   └── helpers.ts             # Test utilities
├── 🚀 deploy/                  # Deployment scripts
└── 🔄 migrations/              # State migrations
```

---

## 🚀 Quick Start: Launch Your Own Market

1. **Install the SDK:**
   ```bash
   npm install @endcorp/depredict
   ```

2. **Create a Market (TypeScript Example):**
   ```typescript
   import { Connection, PublicKey } from '@solana/web3.js';
   import DepredictClient from '@endcorp/depredict';

   const connection = new Connection('https://api.devnet.solana.com');
   const adminKey = new PublicKey('...'); // Your admin public key
   const feeVault = new PublicKey('...'); // Your fee vault public key
   const usdcMint = new PublicKey('...'); // USDC mint address

   const client = new DepredictClient(connection, adminKey, feeVault, usdcMint);

   await client.trade.createMarket({
     startTime: Date.now() / 1000,
     endTime: (Date.now() + 86400000) / 1000, // 24 hours from now
     question: 'Will SOL be above $200 by tomorrow?',
     metadataUri: 'https://your-metadata-url',
     payer: adminKey,
     oracleType: 'manual', // or 'switchboard'
   });
   ```

For more details, see the [Getting Started Guide](https://depredict.vercel.app/getting-started) and [SDK API Reference](https://depredict.vercel.app/sdk-api).

---

## 🛠️ Contributing

We welcome contributions to the Depredict protocol and SDK!

### Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/endcorp-hq/depredict.git
   cd depredict
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Build the program:**
   ```bash
   anchor build
   ```

4. **Run tests:**
   ```bash
   anchor run test-runner-continue
   ```

### Development Workflow

- **On-chain Program**: Work in `programs/depredict/` for smart contract changes
- **SDK**: Work in `sdk/` for TypeScript client library updates
- **Documentation**: Work in `depredict-docs/` for guides and API docs
- **Tests**: Add integration tests in `tests/` directory

📖 **For detailed guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)**

---

## 📚 Documentation

- [Depredict Docs](./depredict-docs) — Full protocol and SDK documentation

---

## 💬 Community & Support

- [GitHub Issues](https://github.com/endcorp-hq/depredict/issues) — Bug reports & feature requests
- [END Corp.](https://endcorp.co) — Project lead

---

MIT License