import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OptimisticOracle } from "../target/types/optimistic_oracle";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("Demo Workflow (Realistic Timing)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OptimisticOracle as Program<OptimisticOracle>;
  const admin = provider.wallet.publicKey;
  
  const proposer = Keypair.generate();
  
  let requestPDA: PublicKey;
  let oracleStatePDA: PublicKey;

  console.log("\n🎯 ===== OPTIMISTIC ORACLE DEMO =====");
  console.log("⚠️  This demo shows the complete flow with REAL timing requirements\n");

  it("Setup: Fund Proposer", async () => {
    console.log("💰 Funding proposer wallet...");
    
    const signature = await provider.connection.requestAirdrop(
      proposer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    
    await provider.connection.confirmTransaction(signature);
    console.log("✅ Proposer funded:", proposer.publicKey.toString(), "\n");
  });

  it("Step 1: Create Oracle Request", async () => {
    console.log("📝 ===== CREATING ORACLE REQUEST =====\n");

    [oracleStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("oracle_state")],
      program.programId
    );

    const oracleState = await program.account.oracleState.fetch(oracleStatePDA);
    const nextRequestId = oracleState.requestCount.toNumber() + 1;

    [requestPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("request"),
        new anchor.BN(nextRequestId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [requestEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("request_escrow"), requestPDA.toBuffer()],
      program.programId
    );

    const question = "Will Bitcoin reach $100,000 by December 31, 2025?";
    const rewardAmount = new anchor.BN(100_000_000); // 0.1 SOL
    const bondAmount = new anchor.BN(50_000_000); // 0.05 SOL
    
    // Expiry: 20 seconds from now (quick for demo)
    const expiryTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 20);
    
    // Challenge period: 1 hour (minimum required by contract)
    const challengePeriod = new anchor.BN(3600);

    console.log("📋 Request Configuration:");
    console.log("   Question:", question);
    console.log("   Reward:", rewardAmount.toNumber() / 1e9, "SOL");
    console.log("   Bond Required:", bondAmount.toNumber() / 1e9, "SOL");
    console.log("   Expiry:", new Date(expiryTimestamp.toNumber() * 1000).toLocaleString());
    console.log("   Challenge Period:", challengePeriod.toNumber(), "seconds (1 hour)");

    const tx = await program.methods
      .createRequest(
        question,
        { yesNo: {} },
        rewardAmount,
        bondAmount,
        expiryTimestamp,
        challengePeriod,
        "Check Bitcoin price on CoinGecko",
        JSON.stringify({ source: "coingecko", symbol: "BTC" })
      )
      .accounts({
        request: requestPDA,
        oracleState: oracleStatePDA,
        requestEscrow: requestEscrowPDA,
        creator: admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("\n✅ Request Created Successfully!");
    console.log("   Transaction:", tx);
    console.log("   Request PDA:", requestPDA.toString());
    console.log("   Request ID:", nextRequestId);

    const request = await program.account.request.fetch(requestPDA);
    console.log("\n📊 Request Details:");
    console.log("   Status:", Object.keys(request.status)[0]);
    console.log("   Creator:", request.creator.toString());
    console.log("   Reward Locked:", request.rewardAmount.toNumber() / 1e9, "SOL");
    
    console.log("\n⏳ Request will be ready for proposals in 20 seconds...\n");
  });

  it("Step 2: Wait for Expiry", async () => {
    console.log("⏰ Waiting for request to expire (20 seconds)...");
    
    for (let i = 20; i > 0; i -= 5) {
      process.stdout.write(`   ${i} seconds remaining...\r`);
      await sleep(5000);
    }
    
    console.log("\n✅ Request expired! Now accepting proposals.\n");
  });

  it("Step 3: Propose Answer", async () => {
    console.log("✍️  ===== PROPOSING ANSWER =====\n");

    const [proposalEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal_escrow"), requestPDA.toBuffer()],
      program.programId
    );

    const answer = "YES";
    console.log("📝 Proposing answer:", answer);
    console.log("💰 Bond required: 0.05 SOL\n");

    const proposerBalanceBefore = await provider.connection.getBalance(proposer.publicKey);
    console.log("💵 Proposer balance before:", proposerBalanceBefore / 1e9, "SOL");

    const tx = await program.methods
      .proposeAnswer(answer)
      .accounts({
        request: requestPDA,
        proposalEscrow: proposalEscrowPDA,
        proposer: proposer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([proposer])
      .rpc();

    const proposerBalanceAfter = await provider.connection.getBalance(proposer.publicKey);
    console.log("💵 Proposer balance after:", proposerBalanceAfter / 1e9, "SOL");
    console.log("💸 Bond locked:", (proposerBalanceBefore - proposerBalanceAfter) / 1e9, "SOL");

    console.log("\n✅ Answer Proposed Successfully!");
    console.log("   Transaction:", tx);

    const updatedRequest = await program.account.request.fetch(requestPDA);
    console.log("\n📊 Updated Request:");
    console.log("   Status:", Object.keys(updatedRequest.status)[0]);
    console.log("   Answer:", updatedRequest.answer);
    console.log("   Proposer:", proposer.publicKey.toString());
    console.log("   Proposal Time:", new Date(updatedRequest.proposalTime.toNumber() * 1000).toLocaleString());

    const challengeEnd = updatedRequest.proposalTime.toNumber() + updatedRequest.challengePeriod.toNumber();
    console.log("\n⏰ Challenge Period Info:");
    console.log("   Duration: 1 hour (3600 seconds)");
    console.log("   Ends at:", new Date(challengeEnd * 1000).toLocaleString());
    console.log("\n   ⚠️  Anyone can dispute within this time by putting down 0.05 SOL bond!");
    console.log("   💡 To dispute, run: anchor run dispute <request_id>\n");
  });

  it("Step 4: Explain Resolution Process", async () => {
    console.log("📖 ===== RESOLUTION PROCESS =====\n");
    
    const request = await program.account.request.fetch(requestPDA);
    const challengeEnd = request.proposalTime.toNumber() + request.challengePeriod.toNumber();
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = challengeEnd - now;
    
    console.log("⏰ Time Status:");
    console.log("   Current time:", new Date().toLocaleString());
    console.log("   Challenge ends:", new Date(challengeEnd * 1000).toLocaleString());
    console.log("   Time remaining:", Math.floor(timeRemaining / 60), "minutes");
    
    console.log("\n📋 What Happens Next:");
    console.log("   1️⃣  Wait for challenge period to end (1 hour)");
    console.log("   2️⃣  If no dispute: Anyone can call 'resolve_undisputed'");
    console.log("   3️⃣  If dispute occurs: Admin resolves via voting");
    console.log("   4️⃣  Winner receives: 0.1 SOL (reward) + 0.05 SOL (bond) = 0.15 SOL");
    
    console.log("\n⚠️  IMPORTANT:");
    console.log("   This is a REAL oracle request on Solana Devnet!");
    console.log("   After 1 hour, you can actually resolve it and claim the reward.");
    
    console.log("\n💡 To resolve after 1 hour:");
    console.log("   ts-node scripts/resolve.ts", requestPDA.toString());
    
    console.log("\n🔗 View on Explorer:");
    console.log(`   https://explorer.solana.com/address/${requestPDA.toString()}?cluster=devnet`);
  });

  it("Final Stats", async () => {
    console.log("\n📈 ===== ORACLE STATISTICS =====\n");

    const oracleState = await program.account.oracleState.fetch(oracleStatePDA);
    
    console.log("📊 Current Metrics:");
    console.log("   Total Requests:", oracleState.requestCount.toString());
    console.log("   Total Volume:", oracleState.totalVolume.toNumber() / 1e9, "SOL");
    console.log("   Admin:", oracleState.admin.toString());
    
    console.log("\n🎯 Oracle Program:");
    console.log("   Program ID:", program.programId.toString());
    console.log("   Explorer:", `https://explorer.solana.com/address/${program.programId.toString()}?cluster=devnet`);
    
    console.log("\n✅ DEMO COMPLETED!");
    console.log("   The oracle is now LIVE and waiting for resolution.\n");
  });
});
