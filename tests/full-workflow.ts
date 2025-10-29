import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OptimisticOracle } from "../target/types/optimistic_oracle";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("Full Workflow Test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OptimisticOracle as Program<OptimisticOracle>;
  const admin = provider.wallet.publicKey;
  
  // Create a second wallet for proposer
  const proposer = Keypair.generate();
  
  let requestPDA: PublicKey;
  let oracleStatePDA: PublicKey;

  console.log("\n🎯 ===== OPTIMISTIC ORACLE FULL WORKFLOW TEST =====\n");

  it("Step 0: Setup - Airdrop SOL to Proposer", async () => {
    console.log("💰 Airdropping SOL to proposer wallet...");
    console.log("Proposer address:", proposer.publicKey.toString());
    
    const signature = await provider.connection.requestAirdrop(
      proposer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    
    await provider.connection.confirmTransaction(signature);
    
    const balance = await provider.connection.getBalance(proposer.publicKey);
    console.log("✅ Proposer balance:", balance / anchor.web3.LAMPORTS_PER_SOL, "SOL\n");
  });

  it("Step 1: Create Oracle Request", async () => {
    console.log("📝 Creating new oracle request...\n");

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

    const question = "Will Bitcoin reach $100,000 by end of 2025?";
    const rewardAmount = new anchor.BN(100_000_000); // 0.1 SOL
    const bondAmount = new anchor.BN(50_000_000); // 0.05 SOL
    
    // Set expiry to 5 seconds from now (for testing)
    const expiryTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 5);
    
    // Challenge period: 15 seconds (for testing)
    const challengePeriod = new anchor.BN(15);

    console.log("📋 Request Details:");
    console.log("   Question:", question);
    console.log("   Reward:", rewardAmount.toNumber() / 1e9, "SOL");
    console.log("   Bond Required:", bondAmount.toNumber() / 1e9, "SOL");
    console.log("   Expiry:", new Date(expiryTimestamp.toNumber() * 1000).toLocaleString());
    console.log("   Challenge Period:", challengePeriod.toNumber(), "seconds");

    const tx = await program.methods
      .createRequest(
        question,
        { yesNo: {} },
        rewardAmount,
        bondAmount,
        expiryTimestamp,
        challengePeriod,
        "Manual verification",
        null
      )
      .accounts({
        request: requestPDA,
        oracleState: oracleStatePDA,
        requestEscrow: requestEscrowPDA,
        creator: admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("\n✅ Request Created!");
    console.log("   TX:", tx);
    console.log("   Request PDA:", requestPDA.toString());

    const request = await program.account.request.fetch(requestPDA);
    console.log("\n📊 Request Status:");
    console.log("   ID:", request.requestId.toString());
    console.log("   Status:", Object.keys(request.status)[0]);
    console.log("   Creator:", request.creator.toString());
    console.log("\n⏳ Waiting for expiry timestamp (5 seconds)...\n");
  });

  it("Step 2: Wait for Expiry", async () => {
    console.log("⏰ Waiting 6 seconds for request to expire...");
    await sleep(6000);
    console.log("✅ Request should be expired now!\n");
  });

  it("Step 3: Propose Answer", async () => {
    console.log("✍️  Proposing answer to the request...\n");

    const [proposalEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal_escrow"), requestPDA.toBuffer()],
      program.programId
    );

    const answer = "YES";
    console.log("📝 Proposing answer:", answer);

    const request = await program.account.request.fetch(requestPDA);
    console.log("   Bond required:", request.bondAmount.toNumber() / 1e9, "SOL");

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

    console.log("\n✅ Answer Proposed!");
    console.log("   TX:", tx);
    console.log("   Proposer:", proposer.publicKey.toString());
    console.log("   Answer:", answer);

    const updatedRequest = await program.account.request.fetch(requestPDA);
    console.log("\n📊 Updated Request Status:");
    console.log("   Status:", Object.keys(updatedRequest.status)[0]);
    console.log("   Proposed Answer:", updatedRequest.answer);
    console.log("   Proposer:", updatedRequest.proposer.toString());
    console.log("\n⏳ Challenge period active for 15 seconds...");
    console.log("   Anyone can dispute within this time!");
    console.log("\n");
  });

  it("Step 4: Wait for Challenge Period", async () => {
    console.log("⏰ Waiting 16 seconds for challenge period to end...");
    console.log("   (In production, anyone could dispute during this time)\n");
    
    // Show countdown
    for (let i = 16; i > 0; i--) {
      process.stdout.write(`   ⏳ ${i} seconds remaining...\r`);
      await sleep(1000);
    }
    
    console.log("\n✅ Challenge period ended! No disputes received.\n");
  });

  it("Step 5: Resolve Request (No Dispute)", async () => {
    console.log("🎯 Resolving request (undisputed)...\n");

    const request = await program.account.request.fetch(requestPDA);

    const [requestEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("request_escrow"), requestPDA.toBuffer()],
      program.programId
    );

    const [proposalEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal_escrow"), requestPDA.toBuffer()],
      program.programId
    );

    console.log("💰 Payout calculation:");
    console.log("   Reward:", request.rewardAmount.toNumber() / 1e9, "SOL");
    console.log("   Bond returned:", request.bondAmount.toNumber() / 1e9, "SOL");
    console.log("   Total payout:", (request.rewardAmount.toNumber() + request.bondAmount.toNumber()) / 1e9, "SOL");

    const proposerBalanceBefore = await provider.connection.getBalance(proposer.publicKey);
    console.log("\n💵 Proposer balance before:", proposerBalanceBefore / 1e9, "SOL");

    const tx = await program.methods
      .resolveUndisputed()
      .accounts({
        request: requestPDA,
        requestEscrow: requestEscrowPDA,
        proposalEscrow: proposalEscrowPDA,
        proposerAccount: proposer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("\n✅ Request Resolved!");
    console.log("   TX:", tx);

    const proposerBalanceAfter = await provider.connection.getBalance(proposer.publicKey);
    console.log("💵 Proposer balance after:", proposerBalanceAfter / 1e9, "SOL");
    console.log("💰 Profit:", (proposerBalanceAfter - proposerBalanceBefore) / 1e9, "SOL");

    const resolvedRequest = await program.account.request.fetch(requestPDA);
    console.log("\n📊 Final Request Status:");
    console.log("   Status:", Object.keys(resolvedRequest.status)[0]);
    console.log("   Answer:", resolvedRequest.answer);
    console.log("   Winner:", resolvedRequest.proposer.toString());
  });

  it("Step 6: View Final Oracle Stats", async () => {
    console.log("\n📈 ===== FINAL ORACLE STATISTICS =====\n");

    const oracleState = await program.account.oracleState.fetch(oracleStatePDA);
    
    console.log("📊 Oracle Metrics:");
    console.log("   Total Requests:", oracleState.requestCount.toString());
    console.log("   Total Volume:", oracleState.totalVolume.toNumber() / 1e9, "SOL");
    console.log("   Admin:", oracleState.admin.toString());
    console.log("   Program ID:", program.programId.toString());

    console.log("\n🔗 View on Solana Explorer:");
    console.log(`   https://explorer.solana.com/address/${program.programId.toString()}?cluster=devnet`);
    
    console.log("\n✅ FULL WORKFLOW COMPLETED SUCCESSFULLY! 🎉\n");
  });
});
