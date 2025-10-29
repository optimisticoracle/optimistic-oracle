import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, 'packages/api/.env') });

const IDL = require('./target/idl/optimistic_oracle.json');
const PROGRAM_ID = new PublicKey('4qdXVoVkqjHWXKTMii1kk98e8mCw3Ps7ctsgGNMgdkFU');

async function initialize() {
  try {
    console.log('🔧 Starting initialization...\n');

    const walletSecret = process.env.WALLET_SECRET_KEY;
    
    if (!walletSecret) {
      console.error('❌ WALLET_SECRET_KEY not found in .env!');
      process.exit(1);
    }

    console.log('📄 WALLET_SECRET_KEY found, parsing...');
    
    let secretKeyArray: number[];
    try {
      secretKeyArray = JSON.parse(walletSecret);
    } catch (err) {
      console.error('❌ Failed to parse WALLET_SECRET_KEY!');
      process.exit(1);
    }

    const keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
    console.log('💼 Wallet loaded:', keypair.publicKey.toBase58());
    
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new Program(IDL as any, provider);
    
    const balance = await connection.getBalance(keypair.publicKey);
    console.log('💰 Balance:', (balance / 1e9).toFixed(4), 'SOL\n');
    
    if (balance === 0) {
      console.log('🪂 Requesting airdrop...');
      try {
        const sig = await connection.requestAirdrop(keypair.publicKey, 2e9);
        await connection.confirmTransaction(sig);
        console.log('✅ Airdrop successful!\n');
      } catch (err: any) {
        console.error('❌ Airdrop failed:', err.message);
        console.log('💡 Get SOL from: https://faucet.solana.com');
        console.log('   Wallet:', keypair.publicKey.toBase58());
        process.exit(1);
      }
    }
    
    // ✅ FIXED: Use correct PDA seed "oracle_state"
    const [statePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('oracle_state')],  // ← CHANGED: 'state' → 'oracle_state'
      PROGRAM_ID
    );
    
    console.log('📍 State PDA:', statePDA.toBase58());
    
    // Check if already initialized
    try {
      const state: any = await (program.account as any).oracleState.fetch(statePDA);
      console.log('\n✅ State already initialized!');
      console.log('📊 Request count:', state.requestCount.toString());
      console.log('\n🎉 Ready to create requests!');
      return;
    } catch (err) {
      console.log('⚠️  State not initialized yet, initializing now...\n');
    }
    
    // ✅ FIXED: Use correct account names with underscores
    console.log('📝 Sending initialization transaction...');
    const tx = await (program.methods as any)
      .initialize()
      .accounts({
        oracleState: statePDA,      // ✅ camelCase
        authority: keypair.publicKey,
        systemProgram: SystemProgram.programId,  // ✅ camelCase
      })
      .rpc();
    
    console.log('\n✅ State initialized successfully!');
    console.log('📝 Transaction:', tx);
    console.log('🔗 Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    console.log('\n🎉 Ready to create requests!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.logs) {
      console.error('📋 Program logs:');
      error.logs.forEach((log: string) => console.error('  ', log));
    }
    process.exit(1);
  }
}

initialize();