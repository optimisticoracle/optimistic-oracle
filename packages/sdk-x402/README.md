# Optimistic Oracle SDK

TypeScript SDK for interacting with the Optimistic Oracle X402 API. Provides type-safe client methods, automatic X402 payment handling, and Solana wallet integration.

## 🚀 Features

- **Type-Safe API Client** - Full TypeScript support with comprehensive types
- **Automatic X402 Payments** - Handles HTTP 402 flows seamlessly
- **Wallet Integration** - Works with any Solana wallet adapter
- **Payment Helpers** - Utilities for USDC/SOL conversions
- **Error Handling** - Comprehensive error messages and retry logic
- **Zero Configuration** - Simple setup with sensible defaults

## 📦 Installation
```bash
npm install @optimistic-oracle/sdk-x402
```

## 🔧 Quick Start
```typescript
import { createClient } from '@optimistic-oracle/sdk-x402';

// Initialize client
const client = createClient('http://localhost:3000', wallet);

// Create a request
const request = await client.createRequest({
  question: "Will BTC reach $100k by end of 2025?",
  answerType: 'YesNo',
  rewardAmount: 1000000,  // $1 USDC
  bondAmount: 10000000,   // $10 USDC
  expiryTimestamp: 1735689600,
  challengePeriod: 86400,
  creator: wallet.publicKey,
});

console.log('Request created:', request.requestId);
```

## 📖 Usage

### Initialize Client
```typescript
import { createClient } from '@optimistic-oracle/sdk-x402';

const client = createClient(
  'https://api.optimisticoracle.com',
  wallet,
  {
    network: 'solana-devnet',
    timeout: 30000
  }
);
```

### Create Oracle Request
```typescript
const request = await client.createRequest({
  question: "Will ETH reach $5k?",
  answerType: 'YesNo',
  rewardAmount: 500000,    // $0.50 USDC
  bondAmount: 5000000,     // $5 USDC
  expiryTimestamp: Date.now() / 1000 + 86400,  // 24 hours
  challengePeriod: 3600,   // 1 hour
  creator: wallet.publicKey,
  dataSource: 'https://coinmarketcap.com',
  metadata: JSON.stringify({ category: 'crypto' })
});
```

### Propose Answer
```typescript
const proposal = await client.proposeAnswer({
  requestId: 1,
  answer: "Yes",
  proposer: wallet.publicKey
});

console.log('Proposal submitted:', proposal.proposalTxSignature);
```

### Dispute Answer
```typescript
const dispute = await client.disputeAnswer({
  requestId: 1,
  counterAnswer: "No",
  disputer: wallet.publicKey,
  resolutionBounty: {
    amount: "5000000",  // $5 USDC
    asset: 'USDC'
  }
});
```

### Get Request Details
```typescript
const request = await client.getRequest(1);

console.log('Question:', request.question);
console.log('Status:', request.status);
console.log('Answer:', request.answer);
```

### List All Requests
```typescript
const requests = await client.getAllRequests();

requests.forEach(req => {
  console.log(`#${req.requestId}: ${req.question}`);
});
```

## 🔐 Wallet Integration

The SDK works with any Solana wallet that implements the `WalletAdapter` interface:
```typescript
interface WalletAdapter {
  publicKey: string;
  signTransaction: (transaction: any) => Promise<any>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}
```

### Example with Phantom
```typescript
import { createClient } from '@optimistic-oracle/sdk-x402';

const wallet = {
  publicKey: window.solana.publicKey.toString(),
  signTransaction: async (tx) => {
    return await window.solana.signTransaction(tx);
  }
};

const client = createClient('http://localhost:3000', wallet);
```

## 💳 X402 Payment Flow

The SDK automatically handles HTTP 402 Payment Required responses:

1. **Initial Request** - SDK makes API call
2. **402 Response** - API returns payment requirements
3. **Create Payment** - SDK creates Solana transaction
4. **Sign & Send** - User signs, SDK sends to network
5. **Retry Request** - SDK retries with payment header
6. **Success** - Returns result

All this happens automatically - you just call the method!

## 🛠️ Utilities

### Convert USD to USDC micro-units
```typescript
import { usdToUsdc } from '@optimistic-oracle/sdk-x402';

const microUnits = usdToUsdc(10.50);  // "10500000"
```

### Convert USDC micro-units to USD
```typescript
import { usdcToUsd } from '@optimistic-oracle/sdk-x402';

const usd = usdcToUsd("10500000");  // 10.5
```

### Calculate expiry timestamp
```typescript
import { calculateExpiry } from '@optimistic-oracle/sdk-x402';

const expiry = calculateExpiry(60);  // 60 minutes from now
```

### Validate Solana address
```typescript
import { isValidSolanaAddress } from '@optimistic-oracle/sdk-x402';

const valid = isValidSolanaAddress('4qdXVo...');  // true/false
```

## 🎯 API Reference

### OptimisticOracleClient

Main SDK client class.

#### Methods

- `setWallet(wallet: WalletAdapter)` - Set wallet for payments
- `getHealth()` - Get API health status
- `createRequest(params)` - Create new oracle request
- `getRequest(id)` - Get request by ID
- `getAllRequests()` - Get all requests
- `proposeAnswer(params)` - Propose answer to request
- `disputeAnswer(params)` - Dispute proposed answer

### X402PaymentHandler

Payment handler for X402 protocol.

#### Methods

- `createPayment(requirements)` - Create payment transaction
- `verifyPayment(signature)` - Verify payment on-chain

## 🔧 Configuration

### SDKConfig
```typescript
interface SDKConfig {
  apiUrl: string;              // API base URL
  network?: 'solana-devnet' | 'solana';  // Default: 'solana-devnet'
  timeout?: number;            // Request timeout (ms), Default: 30000
}
```

## 🧪 Testing
```bash
npm test
```

## 📄 License

MIT

## 🔗 Links

- **API Documentation:** [GitHub](https://github.com/optimisticoracle/optimistic-oracle)
- **Website:** [optimisticoracle.com](https://optimisticoracle.com)

---

**Built with ⚡ for the Solana ecosystem**
