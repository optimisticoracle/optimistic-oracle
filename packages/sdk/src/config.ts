import { Connection, PublicKey } from '@solana/web3.js';

// CRITICAL: Never hardcode API keys!
// Always use environment variables
export const connection = new Connection(
  process.env.RPC_URL || 'https://api.devnet.solana.com', // Fallback to public RPC
  'confirmed'
);

// Program ID (deployed smart contract)
export const PROGRAM_ID = new PublicKey(
  '4qdXVoVkqjHWXKTMii1kk98e8mCw3Ps7ctsgGNMgdkFU'
);

// Network config
export const NETWORK = process.env.NETWORK || 'devnet';

// Log connection (without exposing API key)
const rpcUrl = process.env.RPC_URL || 'default';
console.log('🔌 Config using RPC:', rpcUrl.split('?')[0]);

// Export for use in other files
export default {
  connection,
  PROGRAM_ID,
  NETWORK,
};