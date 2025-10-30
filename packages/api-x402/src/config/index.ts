import dotenv from 'dotenv';
import { ServerConfig } from '../types';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'SOLANA_RPC_URL',
  'PROGRAM_ID',
  'SERVER_WALLET_PATH',
  'TREASURY_WALLET_ADDRESS',
  'PAYAI_FACILITATOR_URL',
  'USDC_MINT',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Export configuration
export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'],
  
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL!,
    commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
    programId: process.env.PROGRAM_ID!,
    serverWalletPath: process.env.SERVER_WALLET_PATH!,
  },
  
  x402: {
    treasuryAddress: process.env.TREASURY_WALLET_ADDRESS!,
    facilitatorUrl: process.env.PAYAI_FACILITATOR_URL!,
    usdcMint: process.env.USDC_MINT!,
  },
  
  payments: {
    antispamBondAmount: process.env.ANTISPAM_BOND_AMOUNT || '100000',
    proposerBondAmount: process.env.PROPOSER_BOND_AMOUNT || '10000000',
    disputerBondAmount: process.env.DISPUTER_BOND_AMOUNT || '10000000',
  },
  
  pyth: {
    priceFeedSolUsd: process.env.PYTH_PRICE_FEED_SOL_USD || 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG',
  },
  
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Export individual config sections for convenience
export const {
  port,
  nodeEnv,
  baseUrl,
  corsOrigin,
  solana,
  x402,
  payments,
  pyth,
  rateLimit,
  logging,
} = config;

// Validate configuration
export function validateConfig(): void {
  // Validate port
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${port}`);
  }
  
  // Validate Solana commitment
  const validCommitments = ['processed', 'confirmed', 'finalized'];
  if (!validCommitments.includes(solana.commitment)) {
    throw new Error(`Invalid SOLANA_COMMITMENT: ${solana.commitment}`);
  }
  
  // Validate URLs
  try {
    new URL(solana.rpcUrl);
    new URL(x402.facilitatorUrl);
  } catch (error) {
    throw new Error('Invalid URL in configuration');
  }
  
  console.log('✅ Configuration validated successfully');
}

// Log configuration (without sensitive data)
export function logConfig(): void {
  console.log('📋 Server Configuration:');
  console.log(`  Port: ${port}`);
  console.log(`  Environment: ${nodeEnv}`);
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Solana RPC: ${solana.rpcUrl}`);
  console.log(`  Program ID: ${solana.programId}`);
  console.log(`  Treasury: ${x402.treasuryAddress}`);
  console.log(`  Rate Limiting: ${rateLimit.enabled ? 'Enabled' : 'Disabled'}`);
}
