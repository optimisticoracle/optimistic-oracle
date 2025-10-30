# Optimistic Oracle Dashboard

React dashboard for interacting with the Optimistic Oracle X402 API. Features wallet connection, request creation, proposal submission, and dispute resolution with integrated X402 payments.

## 🚀 Features

- **Wallet Integration** - Connect Phantom, Solflare, and other Solana wallets
- **Create Requests** - Submit oracle questions with rewards and bonds
- **Propose Answers** - Submit answers to pending requests
- **Dispute Mechanism** - Challenge incorrect proposals
- **X402 Payments** - Automatic payment handling for all operations
- **Real-time Updates** - Live status tracking for all requests
- **Responsive Design** - Works on desktop and mobile

## 📦 Installation
```bash
npm install
```

## 🔧 Configuration

No configuration needed! The dashboard automatically connects to:
- API: `http://localhost:3000`
- Network: Solana Devnet

## 🚀 Usage

### Development
```bash
npm run dev
```

Dashboard will run on `http://localhost:5175`

### Production Build
```bash
npm run build
npm run preview
```

## 🎨 Features Walkthrough

### Connect Wallet

Click "Select Wallet" button to connect your Solana wallet (Phantom, Solflare, etc.)

### Create Oracle Request

1. Click "+ Create Request" button
2. Fill in the form:
   - Question (e.g., "Will BTC reach $100k?")
   - Answer Type (Yes/No, Multiple Choice, Numeric)
   - Reward amount in USDC
   - Bond amount in USDC
   - Expiry time and challenge period
3. Click "Create Request (Payment Required)"
4. Approve X402 payment in your wallet
5. Wait for confirmation

### Propose Answer

1. Find a "Created" status request
2. Click "Propose Answer" button
3. Enter your answer
4. Approve bond payment
5. Wait for challenge period to expire

### Dispute Answer

1. Find a "Proposed" status request
2. Click "Dispute Answer" button
3. Enter counter-answer
4. Approve bond payment
5. Resolution process begins

## 🎯 Request Status Flow
```
Created → Proposed → Disputed/Resolved
   ↓          ↓           ↓
 Propose   Dispute    Resolution
```

- **Created**: Waiting for proposals
- **Proposed**: In challenge period
- **Disputed**: Under resolution
- **Resolved**: Final answer confirmed
- **Cancelled**: Request cancelled

## 🔐 Security

- All payments go through X402 protocol
- Economic security via bonds
- Wallet signatures required
- No private keys stored

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Solana Wallet Adapter** - Wallet connection
- **@solana/web3.js** - Solana integration

## 📱 Responsive Design

Fully responsive layout that works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🧪 Testing

Connect to local API:
```bash
# Terminal 1: Start API
cd ../api-x402
npm run dev

# Terminal 2: Start Dashboard
cd ../dashboard-x402
npm run dev
```

## 🔗 Links

- **API Documentation:** [../api-x402/README.md](../api-x402/README.md)
- **SDK Documentation:** [../sdk-x402/README.md](../sdk-x402/README.md)

## 📄 License

MIT

---

**Built with ⚡ for the Solana ecosystem**
