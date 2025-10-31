# Optimistic Oracle

> **Truth by Default, Verified by Economics**

An optimistic oracle protocol built on Solana that enables decentralized data feeds with economic guarantees. Data is assumed true unless challenged, providing sub-second finality with cryptoeconomic security.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-Devnet-blueviolet)](https://solana.com)

🌐 **Live:** [optimisticoracle.com](https://optimisticoracle.com)  
📊 **Dashboard:** [Work in Progress]  
📖 **Docs:** [optimisticoracle.com/docs](https://www.optimisticoracle.com/docs)
🔗 **$OPTIM:** [86BMwo29TgobuYTCFU7tf3DBhgNvgeCkNTQXbAvUpump](https://solscan.io/token/86BMwo29TgobuYTCFU7tf3DBhgNvgeCkNTQXbAvUpump)

---

## 🚀 Features

- ⚡ **Lightning Fast** - Sub-second finality on Solana
- 💰 **Cost Effective** - $0.01 per query, 100x cheaper than traditional oracles
- 🔒 **Cryptographically Secure** - Economic incentives backed by bonding mechanisms
- 🌐 **Multi-Purpose** - Supports DeFi pricing, prediction markets, event verification, IoT data
- 🔄 **Dispute Resolution** - Transparent challenge mechanism with economic penalties
- 📈 **Scalable** - Built for Web3 scale with high throughput
- 💳 **X402 Payment Protocol** - HTTP 402 Payment Required for seamless micropayments
- 🔗 **PayAI Integration** - Automated payment verification and settlement
- 💱 **Auto Conversion** - USDC to SOL conversion for all payments

---

## 🛠 Tech Stack

### Smart Contracts
- **Rust** - Program logic
- **Anchor Framework** - Solana development framework
- **Solana** - Blockchain network (Devnet)

### Frontend
- **React** + **TypeScript** - UI framework
- **Vite** - Build tool
- **CSS3** - Styling with animations

### Backend
- **Node.js** + **Express** - REST API
- **TypeScript** - Type safety

### SDK
- **TypeScript** - Client library for interacting with smart contracts

---

## 📦 Project Structure
```
optimistic_oracle/
├── programs/
│   └── optimistic_oracle/     # Rust smart contract
│       ├── src/
│       │   ├── lib.rs         # Main program logic
│       │   ├── constants.rs   # Program constants
│       │   └── error.rs       # Custom errors
│       └── Cargo.toml
├── packages/
│   ├── api-x402/              # X402-enabled REST API 
│   │   ├── src/
│   │   │   ├── routes/        # API endpoints
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # X402 payment middleware
│   │   │   └── index.ts
│   │   └── package.json
│   ├── sdk-x402/              # TypeScript SDK 
│   │   ├── src/
│   │   │   ├── client/        # API client
│   │   │   ├── payments/      # X402 payment handler
│   │   │   ├── types/         # Type definitions
│   │   │   └── utils/         # Utilities
│   │   └── package.json
│   ├── dashboard-x402/        # React Dashboard 
│   │   ├── src/
│   │   │   ├── components/    # UI components
│   │   │   ├── App.tsx        # Main app
│   │   │   └── WalletProvider.tsx
│   │   └── package.json
│   └── landing/               # Landing page
│       ├── src/
│       │   ├── App.tsx
│       │   └── App.css
│       └── package.json
├── docs/                      # Documentation
├── scripts/                   # Deployment scripts
├── Anchor.toml
├── package.json
└── README.md
```

---

## 🏃 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Rust** >= 1.70.0
- **Solana CLI** >= 1.18.0
- **Anchor CLI** >= 0.30.0

### Installation

```bash
# Clone the repository
git clone https://github.com/optimisticoracle/optimistic-oracle.git
cd optimistic-oracle

# Install dependencies
npm install

# Build smart contract
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Running Locally

#### 1. Start the X402 API Server
```bash
cd packages/api-x402
npm install
npm run dev
```

API will run on `http://localhost:3000`

#### 2. Start the Dashboard
```bash
cd packages/dashboard-x402
npm install
npm run dev
```

Dashboard will run on `http://localhost:5175`

#### 3. Start the Landing Page
```bash
cd packages/landing
npm install
npm run dev
```

Landing page will run on `http://localhost:5174`

---

## 💳 X402 Payment Integration

The Optimistic Oracle now supports **HTTP 402 Payment Required** protocol for seamless micropayments!

### Architecture
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │────────▶│  API Server  │────────▶│   Solana    │
│  (X-PAYMENT)│         │  (Express)   │         │  (Devnet)   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    PayAI     │
                        │ Facilitator  │
                        └──────────────┘
```

### Packages

**📦 api-x402** - REST API Server with X402 support
- HTTP 402 Payment Required flows
- PayAI facilitator integration  
- USDC to SOL conversion
- Bond-based security
- [View Documentation](./packages/api-x402/README.md)

**📦 sdk-x402** - TypeScript SDK
- Type-safe API client
- X402 payment handler
- Automatic payment flows
- Wallet adapter integration
- [View Documentation](./packages/sdk-x402/README.md)

**📦 dashboard-x402** - React Dashboard
- Solana wallet connection (Phantom, Solflare)
- Create/Propose/Dispute UI
- Real-time request tracking
- Responsive modern design
- [View Documentation](./packages/dashboard-x402/README.md)

### Payment Flow

1. **Client makes request** → API returns 402 Payment Required
2. **SDK creates payment** → User signs Solana transaction
3. **PayAI verifies** → Payment confirmed on-chain
4. **API processes** → Returns successful result

All payments are economically secured with bonds and escrows!

---

## 🌐 Deployment

### Deploy to Vercel (Landing Page)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Set Environment Variables**
   
   Copy `.env.example` files:
   ```bash
   cp packages/landing/.env.example packages/landing/.env
   cp packages/dashboard/.env.example packages/dashboard/.env
   cp packages/api/.env.example packages/api/.env
   ```

   Update with your production values.

3. **Deploy**
   ```bash
   # From project root
   vercel --prod
   ```

4. **Configure Custom Domain**
   - Add domain in Vercel dashboard
   - Update DNS records
   - Set environment variables in Vercel dashboard

### Deploy API (Separate Hosting)

The API needs to be deployed separately (e.g., Railway, Render, Fly.io):

```bash
cd packages/api
npm run build
npm start
```

---

## 🔧 Environment Variables

### Landing Page (`packages/landing/.env`)
```env
VITE_DASHBOARD_URL=https://dashboard.optimisticoracle.com
VITE_DOCS_URL=https://docs.optimisticoracle.com
VITE_GITHUB_URL=https://github.com/optimisticoracle/optimistic-oracle
VITE_API_URL=https://api.optimisticoracle.com
```

### Dashboard (`packages/dashboard/.env`)
```env
VITE_API_URL=https://api.optimisticoracle.com
```

### API (`packages/api/.env`)
```env
PORT=3000
NODE_ENV=production
BASE_URL=https://api.optimisticoracle.com
CORS_ORIGIN=https://optimisticoracle.com,https://dashboard.optimisticoracle.com
```

---

## 📖 Using the SDK

```typescript
import { OptimisticOracleSDK } from '@optimistic-oracle/sdk';

// Initialize SDK
const sdk = new OptimisticOracleSDK('devnet', './wallet.json');

// Create a request
const request = await sdk.createRequest(
  "Will BTC reach $100k by end of 2025?",
  60,    // expiry in minutes
  0.1,   // reward in SOL
  0.05,  // bond in SOL
  1      // challenge period in hours
);

// Get all requests
const requests = await sdk.getAllRequests();

// Get specific request
const request = await sdk.getRequest(1);
```

---

## 🧪 Testing

```bash
# Run smart contract tests
anchor test

# Run SDK tests
cd packages/sdk
npm test

# Run API tests
cd packages/api
npm test
```

---

## 📝 Smart Contract Details

**Program ID (Devnet):** `4qdXVoVkqjHWXKTMii1kk98e8mCw3Ps7ctsgGNMgdkFU`

**Key Features:**
- Create oracle requests with customizable parameters
- Propose answers with bond requirements
- Challenge incorrect proposals
- Automatic resolution after challenge period
- Economic incentives for honest behavior

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write clean, documented code
- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Website:** [optimisticoracle.com](https://optimisticoracle.com)
- **Dashboard:** [Work in Progress]
- **Documentation:** [optimisticoracle.com/docs](https://optimisticoracle.com/docs)
- **GitHub:** [github.com/optimisticoracle/optimistic-oracle](https://github.com/optimisticoracle/optimistic-oracle)
- **Twitter:** [@OptimOracle](https://twitter.com/OptimOracle)
- **Solscan:** [$OPTIM](https://solscan.io/token/86BMwo29TgobuYTCFU7tf3DBhgNvgeCkNTQXbAvUpump)

---

## 🙏 Acknowledgments

- Built on [Solana](https://solana.com)
- Inspired by [UMA Protocol](https://umaproject.org)
- Powered by [Anchor Framework](https://www.anchor-lang.com)

---

## 📞 Support

For questions or support, please:
- Open an issue on GitHub
- Join our [Discord]
- Follow us on [Twitter](https://twitter.com/OptimOracle)

---

**Built with ⚡ by the Optimistic Oracle Team**
