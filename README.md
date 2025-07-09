
![dePredict Logo](./img/depredict_logo.png "DePredict Logo")

Depredict is a decentralized prediction market protocol on Solana. Anyone can spin up their own prediction market using our open-source smart contract and TypeScript SDK.

- [Documentation](./depredict-docs) — Full guides, API reference, and examples
- [SDK on npm](https://www.npmjs.com/package/shortx-sdk)
- [END Corp.](https://endcorp.co) — Project lead

---

## 🚀 Quick Start: Launch Your Own Market

1. **Install the SDK:**
   ```bash
   npm install shortx-sdk
   ```

2. **Create a Market (TypeScript Example):**
   ```typescript
   import { Connection, PublicKey } from '@solana/web3.js';
   import DepredictClient from 'shortx-sdk';

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

For more details, see the [Getting Started Guide](./depredict-docs/docs/pages/getting-started.mdx) and [SDK API Reference](./depredict-docs/docs/pages/sdk-api.mdx).

---

## 🛠️ Contributing

We welcome contributions to the Depredict protocol and SDK!

### Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/endcorp-hq/shortx-contract-v1.git
   cd shortx-contract-v1
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
   anchor test
   ```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

---

## 📚 Documentation

- [Depredict Docs](./depredict-docs) — Full protocol and SDK documentation

---

## 💬 Community & Support

- [GitHub Issues](https://github.com/endcorp-hq/shortx-contract-v1/issues) — Bug reports & feature requests
- [END Corp.](https://endcorp.co) — Project lead

---

MIT License

