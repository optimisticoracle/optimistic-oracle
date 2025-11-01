import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  asset: string;
}

interface X402Response {
  error?: any;
  paymentRequirements?: {
    x402Version: number;
    accepts: PaymentRequirement[];
  };
}

/**
 * Handle 402 Payment Required response
 * Constructs Solana payment and returns X-PAYMENT header
 */
export async function handlePaymentRequired(
  response402: X402Response,
  wallet: any,
  connection: Connection
): Promise<string | null> {
  try {
    const paymentReq = response402.paymentRequirements?.accepts[0];
    
    if (!paymentReq) {
      throw new Error('No payment requirements in response');
    }

    console.log('Processing payment:', paymentReq);

    // Parse addresses
    const fromPubkey = new PublicKey(wallet.publicKey);
    const toPubkey = new PublicKey(paymentReq.payTo);
    const mintPubkey = new PublicKey(paymentReq.asset);
    const amount = parseInt(paymentReq.maxAmountRequired);

    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      fromPubkey
    );
    
    const toTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      toPubkey
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      amount
    );

    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Sign transaction
    const signedTx = await wallet.signTransaction(transaction);
    
    // Serialize to base64
    const serialized = signedTx.serialize().toString('base64');

    // Construct X-PAYMENT header (PayAI format)
    const paymentPayload = {
      x402Version: 1,
      scheme: 'exact',
      network: paymentReq.network,
      payload: {
        transaction: serialized,
      },
    };

     // Return base64 encoded JSON (browser-safe)
    return btoa(JSON.stringify(paymentPayload));
    
  } catch (error) {
    console.error('Payment construction failed:', error);
    return null;
  }
}