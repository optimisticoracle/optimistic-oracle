# Optimistic Oracle X402 API

X402-enabled REST API server for Optimistic Oracle on Solana. This API provides HTTP 402 Payment Required flows for creating oracle requests, submitting proposals, and disputing answers with built-in micropayment support via PayAI.

## 🌟 Features

- **X402 Payment Protocol**: HTTP 402 Payment Required implementation with PayAI facilitator
- **USDC → SOL Conversion**: Automatic payment conversion from USDC to SOL
- **Bond-based Security**: Economic incentives via proposer and disputer bonds
- **Anti-spam Protection**: Configurable anti-spam bonds for request creation
- **Real-time Price Oracle**: Live SOL/USD price feeds for accurate conversions
- **RESTful API**: Clean REST endpoints with comprehensive error handling
- **TypeScript**: Full type safety with Zod validation
- **Production Ready**: Logging, CORS, rate limiting, and error handling

## 🏗️ Architecture
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

## 📦 Installation
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Generate server wallet
solana-keygen new -o server-wallet.json

# Update .env with your configuration
```

## ⚙️ Configuration

Create a `.env` file with the following variables:
```bash
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_COMMITMENT=confirmed
PROGRAM_ID=4qdXVoVkqjHWXKTMii1kk98e8mCw3Ps7ctsgGNMgdkFU
SERVER_WALLET_PATH=./server-wallet.json

# X402 Configuration
TREASURY_WALLET_ADDRESS=YOUR_TREASURY_WALLET_ADDRESS
PAYAI_FACILITATOR_URL=https://facilitator.payai.network
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Payment Amounts (in micro-units: 1 USDC = 1,000,000)
ANTISPAM_BOND_AMOUNT=100000          # $0.10 USDC
PROPOSER_BOND_AMOUNT=10000000        # $10.00 USDC
DISPUTER_BOND_AMOUNT=10000000        # $10.00 USDC

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=3600000

# Logging
LOG_LEVEL=info
```

## 🚀 Usage

### Development
```bash
# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Production
```bash
# Build
npm run build

# Set environment
export NODE_ENV=production

# Start server
npm start
```

## 📡 API Endpoints

### Health Check

**GET** `/health`

Returns server health status and configuration.
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": 1234567890,
    "version": "1.0.0",
    "services": {
      "facilitator": "healthy",
      "solana": "healthy",
      "priceOracle": "healthy"
    },
    "serverBalance": 1.5,
    "exchangeRate": {
      "solUsd": 180.0,
      "usdcSol": 0.00555
    }
  }
}
```

---

### Create Oracle Request

**POST** `/api/requests`

Create a new oracle request with X402 payment.

**Headers:**
```
Content-Type: application/json
X-Payment: <base64-encoded-payment-header>
```

**Body:**
```json
{
  "question": "Will BTC reach $100k by end of 2025?",
  "answerType": "YesNo",
  "rewardAmount": 1000000,
  "bondAmount": 10000000,
  "expiryTimestamp": 1735689600,
  "challengePeriod": 86400,
  "creator": "USER_WALLET_ADDRESS",
  "dataSource": "https://coinmarketcap.com",
  "metadata": "{\"category\":\"crypto\"}"
}
```

**Response (without payment - 402):**
```json
{
  "error": {
    "code": "PAYMENT_REQUIRED",
    "message": "Payment required to access this resource"
  },
  "paymentRequirements": {
    "version": "1.0",
    "schemes": [
      {
        "scheme": "exact",
        "network": "solana-devnet",
        "asset": {
          "address": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
          "decimals": 6
        },
        "recipient": "TREASURY_WALLET_ADDRESS",
        "amount": "100000"
      }
    ],
    "description": "Payment required to create oracle request",
    "resource": "http://localhost:3000/api/requests"
  }
}
```

**Response (with valid payment - 201):**
```json
{
  "success": true,
  "data": {
    "requestId": 1,
    "requestPda": "REQUEST_PDA_ADDRESS",
    "escrowPda": "ESCROW_PDA_ADDRESS",
    "txSignature": "TRANSACTION_SIGNATURE",
    "paymentId": "payment_id_hex",
    "antispamBondRefundable": true,
    "capabilityToken": "capability_token_hash"
  },
  "meta": {
    "timestamp": 1234567890
  }
}
```

---

### Propose Answer

**POST** `/api/proposals`

Submit a proposal answer with bond payment.

**Headers:**
```
Content-Type: application/json
X-Payment: <base64-encoded-payment-header>
```

**Body:**
```json
{
  "requestId": 1,
  "answer": "Yes",
  "proposer": "PROPOSER_WALLET_ADDRESS"
}
```

**Response (402 without payment, 201 with valid payment)**

---

### Dispute Answer

**POST** `/api/disputes`

Dispute a proposed answer with bond payment.

**Headers:**
```
Content-Type: application/json
X-Payment: <base64-encoded-payment-header>
```

**Body:**
```json
{
  "requestId": 1,
  "counterAnswer": "No",
  "disputer": "DISPUTER_WALLET_ADDRESS",
  "resolutionBounty": {
    "amount": "5000000",
    "asset": "USDC"
  }
}
```

---

### Get Request Details

**GET** `/api/requests/:requestId`

Get details of a specific request.
```bash
curl http://localhost:3000/api/requests/1
```

---

### List All Requests

**GET** `/api/requests`

Get all oracle requests.
```bash
curl http://localhost:3000/api/requests
```

## 🔒 Security

- **Anti-spam Bonds**: Prevents spam requests with small refundable deposits
- **Economic Security**: Proposer and disputer bonds ensure honest behavior
- **Payment Verification**: PayAI facilitator verifies all payments on-chain
- **Rate Limiting**: Configurable rate limits prevent API abuse
- **CORS**: Configurable CORS origins for production security

## 🏛️ Project Structure
```
src/
├── config/           # Configuration management
├── middleware/       # Express middleware
│   ├── cors.ts      # CORS configuration
│   ├── errorHandler.ts
│   └── x402.ts      # X402 payment middleware
├── routes/          # API route handlers
│   ├── requests.ts
│   ├── proposals.ts
│   ├── disputes.ts
│   └── health.ts
├── services/        # Business logic
│   ├── facilitator.ts    # PayAI integration
│   ├── conversion.ts     # USDC/SOL conversion
│   └── solana.ts         # Solana blockchain
├── types/           # TypeScript types
├── utils/           # Utilities
│   ├── helpers.ts
│   └── logger.ts
└── index.ts         # Main entry point
```

## 🧪 Testing
```bash
# Run tests
npm test

# Test with curl
curl http://localhost:3000/health
curl http://localhost:3000/
```

## 📊 Monitoring

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## 🚢 Deployment

### Prerequisites
- Node.js 18+
- Solana CLI tools
- Access to Solana RPC
- PayAI facilitator access

### Environment
1. Set `NODE_ENV=production`
2. Use production RPC endpoint
3. Configure production CORS origins
4. Enable rate limiting
5. Use secure wallet management

## 🤝 Integration Guide

### Client Integration

To integrate with this API, clients need to:

1. **Make initial request** to endpoint
2. **Receive 402 response** with payment requirements
3. **Create X402 payment** using user's wallet
4. **Retry request** with `X-Payment` header
5. **Receive success response** with capability token

Example flow:
```javascript
// 1. Initial request (gets 402)
const response = await fetch('http://localhost:3000/api/requests', {
  method: 'POST',
  body: JSON.stringify(requestData)
});

// 2. If 402, get payment requirements
if (response.status === 402) {
  const { paymentRequirements } = await response.json();
  
  // 3. Create payment with user's wallet
  const payment = await createX402Payment(paymentRequirements);
  
  // 4. Retry with payment header
  const paidResponse = await fetch('http://localhost:3000/api/requests', {
    method: 'POST',
    headers: {
      'X-Payment': payment.header
    },
    body: JSON.stringify(requestData)
  });
  
  // 5. Success!
  const result = await paidResponse.json();
}
```

## 📚 Resources

- [X402 Protocol Specification](https://github.com/coinbase/x402)
- [PayAI Documentation](https://facilitator.payai.network/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Anchor Framework](https://www.anchor-lang.com/)

## 📄 License

MIT

## 🙏 Acknowledgments

- PayAI Network for X402 facilitator
- Solana Foundation
- Anchor Framework team

---

**Built with ❤️ for the Solana ecosystem**
