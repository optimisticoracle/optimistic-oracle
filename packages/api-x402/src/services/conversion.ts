import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { solana, pyth } from '../config';
import { PriceInfo, ConversionResult } from '../types';
import logger from '../utils/logger';
import { sleep } from '../utils/helpers';

// Price cache
let priceCache: PriceInfo | null = null;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get SOL/USD price from Jupiter Price API
 */
export async function getSolPrice(): Promise<PriceInfo> {
  // Return cached price if valid
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
    return priceCache;
  }
  
  try {
    logger.info('Fetching SOL/USD price from Jupiter');
    
    const response = await axios.get(
      'https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112',
      { 
        timeout: 15000,
        headers: { 'Accept': 'application/json' }
      }
    );
    
    const priceData = response.data?.data?.So11111111111111111111111111111111111111112;
    
    if (!priceData || !priceData.price) {
      throw new Error('Invalid response from Jupiter API');
    }
    
    const price = parseFloat(priceData.price);
    
    if (!price || isNaN(price) || price <= 0) {
      throw new Error('Invalid price from Jupiter API');
    }
    
    priceCache = {
      price,
      confidence: 0.01,
      timestamp: Date.now(),
      source: 'pyth',
    };
    
    logger.info('SOL/USD price fetched successfully', { price, source: 'Jupiter' });
    
    return priceCache;
  } catch (error: any) {
    logger.error('Error fetching SOL price from Jupiter', { error: error.message });
    
    if (priceCache) {
      logger.warn('Using cached SOL price');
      return priceCache;
    }
    
    const fallbackPrice = await getSolPriceFallback();
    priceCache = {
      price: fallbackPrice,
      confidence: 0.05,
      timestamp: Date.now(),
      source: 'cache',
    };
    return priceCache;
  }
}

/**
 * Fallback method to get SOL price (CoinGecko API)
 */
async function getSolPriceFallback(): Promise<number> {
  try {
    logger.info('Using fallback price source (CoinGecko)');
    
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: { ids: 'solana', vs_currencies: 'usd', precision: 2 },
        timeout: 15000,
        headers: { 'Accept': 'application/json' }
      }
    );
    
    const price = response.data?.solana?.usd;
    
    if (!price || isNaN(price) || price <= 0) {
      throw new Error('Invalid price from CoinGecko');
    }
    
    logger.info('Fallback price fetched successfully', { price, source: 'CoinGecko' });
    return price;
  } catch (error: any) {
    logger.error('All price sources failed', { error: error.message });
    const defaultPrice = 180.0;
    logger.warn('Using default SOL price', { price: defaultPrice });
    return defaultPrice;
  }
}

/**
 * Convert USDC to SOL amount
 */
export async function convertUsdcToSol(
  usdcAmount: string
): Promise<ConversionResult> {
  try {
    // Get current SOL price
    const priceInfo = await getSolPrice();
    
    // Parse USDC amount (micro-units)
    const usdcMicroUnits = parseInt(usdcAmount, 10);
    const usdAmount = usdcMicroUnits / 1_000_000; // Convert to USD
    
    // Calculate SOL amount
    const solAmount = usdAmount / priceInfo.price;
    
    logger.info('USDC to SOL conversion', {
      usdcAmount,
      usdAmount,
      solPrice: priceInfo.price,
      solAmount,
    });
    
    return {
      fromAmount: usdcAmount,
      fromAsset: 'USDC',
      toAmount: solAmount,
      toAsset: 'SOL',
      rate: priceInfo.price,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    logger.error('Error converting USDC to SOL', { error: error.message });
    throw new Error('Failed to convert USDC to SOL');
  }
}

/**
 * Convert SOL to USDC amount
 */
export async function convertSolToUsdc(solAmount: number): Promise<ConversionResult> {
  try {
    // Get current SOL price
    const priceInfo = await getSolPrice();
    
    // Calculate USDC amount
    const usdAmount = solAmount * priceInfo.price;
    const usdcMicroUnits = Math.floor(usdAmount * 1_000_000);
    
    logger.info('SOL to USDC conversion', {
      solAmount,
      solPrice: priceInfo.price,
      usdAmount,
      usdcMicroUnits,
    });
    
    return {
      fromAmount: solAmount.toString(),
      fromAsset: 'SOL',
      toAmount: usdcMicroUnits,
      toAsset: 'USDC',
      rate: priceInfo.price,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    logger.error('Error converting SOL to USDC', { error: error.message });
    throw new Error('Failed to convert SOL to USDC');
  }
}

/**
 * Calculate slippage-adjusted amount
 */
export function applySlippage(amount: number, slippageBps: number = 100): number {
  // slippageBps = basis points (100 = 1%)
  const slippageFactor = 1 - slippageBps / 10000;
  return amount * slippageFactor;
}

/**
 * Validate conversion amount
 */
export function validateConversionAmount(
  amount: string | number,
  minAmount: number = 0.000001
): boolean {
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(parsed) && parsed >= minAmount;
}

/**
 * Get exchange rate for display
 */
export async function getExchangeRate(): Promise<{
  solUsd: number;
  usdcSol: number;
  timestamp: number;
}> {
  const priceInfo = await getSolPrice();
  
  return {
    solUsd: priceInfo.price,
    usdcSol: 1 / priceInfo.price,
    timestamp: priceInfo.timestamp,
  };
}

/**
 * Refresh price cache
 */
export async function refreshPriceCache(): Promise<void> {
  priceCache = null;
  await getSolPrice();
  logger.info('Price cache refreshed');
}

/**
 * Start price refresh interval
 */
export function startPriceRefreshInterval(intervalMs: number = 60000): NodeJS.Timeout {
  logger.info('Starting price refresh interval', { intervalMs });
  
  return setInterval(async () => {
    try {
      await refreshPriceCache();
    } catch (error) {
      logger.error('Error in price refresh interval', { error });
    }
  }, intervalMs);
}
