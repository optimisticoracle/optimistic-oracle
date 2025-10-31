import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  SDKConfig,
  ApiResponse,
  CreateRequestParams,
  CreateRequestResponse,
  ProposeAnswerParams,
  ProposeAnswerResponse,
  DisputeAnswerParams,
  DisputeAnswerResponse,
  RequestDetails,
  X402PaymentRequirement,
  WalletAdapter,
} from '../types';
import { X402PaymentHandler } from '../payments';
import { parseErrorMessage } from '../utils';

/**
 * Optimistic Oracle SDK Client
 */
export class OptimisticOracleClient {
  private api: AxiosInstance;
  private config: SDKConfig;
  private wallet?: WalletAdapter;
  private paymentHandler?: X402PaymentHandler;

  constructor(config: SDKConfig, wallet?: WalletAdapter) {
    this.config = {
      timeout: 30000,
      network: 'solana-devnet',
      ...config,
    };

    this.api = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (wallet) {
      this.setWallet(wallet);
    }
  }

  /**
   * Set wallet for payment transactions
   */
  setWallet(wallet: WalletAdapter): void {
    this.wallet = wallet;
    const rpcUrl =
      this.config.network === 'solana'
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com';
    
    this.paymentHandler = new X402PaymentHandler(
      new (require('@solana/web3.js').Connection)(rpcUrl, 'confirmed'),
      wallet
    );
  }

  // =========================================================================
  // Health Check
  // =========================================================================

  /**
   * Check API health status
   */
  async getHealth(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // =========================================================================
  // Request Operations
  // =========================================================================

  /**
   * Create a new oracle request
   */
  async createRequest(
    params: CreateRequestParams
  ): Promise<CreateRequestResponse> {
    if (!this.wallet || !this.paymentHandler) {
      throw new Error('Wallet not configured. Call setWallet() first.');
    }

    try {
      // Initial request without payment
      const response = await this.api.post('/api/requests', params);
      return response.data.data;
    } catch (error) {
      // Handle 402 Payment Required
      if (this.is402Error(error)) {
        const paymentRequirements = this.extractPaymentRequirements(error);
        return await this.retryWithPayment(
          '/api/requests',
          'POST',
          params,
          paymentRequirements
        );
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get request by ID
   */
  async getRequest(requestId: number): Promise<RequestDetails> {
    try {
      const response = await this.api.get(`/api/requests/${requestId}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all requests
   */
  async getAllRequests(): Promise<RequestDetails[]> {
    try {
      const response = await this.api.get('/api/requests');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // =========================================================================
  // Proposal Operations
  // =========================================================================

  /**
   * Propose an answer to a request
   */
  async proposeAnswer(
    params: ProposeAnswerParams
  ): Promise<ProposeAnswerResponse> {
    if (!this.wallet || !this.paymentHandler) {
      throw new Error('Wallet not configured. Call setWallet() first.');
    }

    try {
      const response = await this.api.post('/api/proposals', params);
      return response.data.data;
    } catch (error) {
      if (this.is402Error(error)) {
        const paymentRequirements = this.extractPaymentRequirements(error);
        return await this.retryWithPayment(
          '/api/proposals',
          'POST',
          params,
          paymentRequirements
        );
      }
      throw this.handleError(error);
    }
  }

  // =========================================================================
  // Dispute Operations
  // =========================================================================

  /**
   * Dispute a proposed answer
   */
  async disputeAnswer(
    params: DisputeAnswerParams
  ): Promise<DisputeAnswerResponse> {
    if (!this.wallet || !this.paymentHandler) {
      throw new Error('Wallet not configured. Call setWallet() first.');
    }

    try {
      const response = await this.api.post('/api/disputes', params);
      return response.data.data;
    } catch (error) {
      if (this.is402Error(error)) {
        const paymentRequirements = this.extractPaymentRequirements(error);
        return await this.retryWithPayment(
          '/api/disputes',
          'POST',
          params,
          paymentRequirements
        );
      }
      throw this.handleError(error);
    }
  }

  // =========================================================================
  // Private Helper Methods
  // =========================================================================

  /**
   * Check if error is 402 Payment Required
   */
  private is402Error(error: any): boolean {
    return error.response?.status === 402;
  }

  /**
   * Extract payment requirements from 402 error
   */
  private extractPaymentRequirements(error: any): X402PaymentRequirement {
    const paymentRequirements = error.response?.data?.paymentRequirements;
    if (!paymentRequirements) {
      throw new Error('Payment requirements not found in 402 response');
    }
    return paymentRequirements;
  }

  /**
   * Retry request with X402 payment
   */
  private async retryWithPayment(
    endpoint: string,
    method: string,
    data: any,
    paymentRequirements: X402PaymentRequirement
  ): Promise<any> {
    if (!this.paymentHandler) {
      throw new Error('Payment handler not initialized');
    }

    // Create payment
    const paymentHeader = await this.paymentHandler.createPayment(
      paymentRequirements
    );

    // Retry request with payment header
    try {
      const response = await this.api.request({
        method,
        url: endpoint,
        data,
        headers: {
          'X-Payment': paymentHeader,
        },
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    const message = parseErrorMessage(error);
    const apiError = new Error(message);
    (apiError as any).originalError = error;
    return apiError;
  }
}

/**
 * Create SDK client instance
 */
export function createClient(
  apiUrl: string,
  wallet?: WalletAdapter,
  config?: Partial<SDKConfig>
): OptimisticOracleClient {
  return new OptimisticOracleClient(
    {
      apiUrl,
      ...config,
    },
    wallet
  );
}
