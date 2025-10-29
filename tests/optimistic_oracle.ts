import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OptimisticOracle } from "../target/types/optimistic_oracle";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("optimistic_oracle", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OptimisticOracle as Program<OptimisticOracle>;
  const admin = provider.wallet.publicKey;

  it("Initialize Oracle", async () => {
    const [oracleStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("oracle_state")],
      program.programId
    );

    console.log("Oracle State PDA:", oracleStatePDA.toString());
    console.log("Admin:", admin.toString());

    const tx = await program.methods
      .initialize(admin)
      .accounts({
        oracleState: oracleStatePDA,
        payer: admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize transaction signature:", tx);

    // Verify oracle state
    const oracleState = await program.account.oracleState.fetch(oracleStatePDA);
    console.log("Oracle State:", oracleState);
    
    expect(oracleState.admin.toString()).to.equal(admin.toString());
    expect(oracleState.requestCount.toString()).to.equal("0");
  });

  it("Create Request", async () => {
    const [oracleStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("oracle_state")],
      program.programId
    );

    const oracleState = await program.account.oracleState.fetch(oracleStatePDA);
    const nextRequestId = oracleState.requestCount.toNumber() + 1;

    const [requestPDA] = PublicKey.findProgramAddressSync(
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
    const expiryTimestamp = new anchor.BN(Date.now() / 1000 + 3600); // 1 hour from now
    const challengePeriod = new anchor.BN(7200); // 2 hours

    console.log("\nCreating request...");
    console.log("Question:", question);
    console.log("Reward:", rewardAmount.toNumber() / 1e9, "SOL");
    console.log("Bond:", bondAmount.toNumber() / 1e9, "SOL");

    const tx = await program.methods
      .createRequest(
        question,
        { yesNo: {} },
        rewardAmount,
        bondAmount,
        expiryTimestamp,
        challengePeriod,
        "CoinGecko",
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

    console.log("Create request transaction signature:", tx);

    // Verify request
    const request = await program.account.request.fetch(requestPDA);
    console.log("\nRequest created:");
    console.log("Request ID:", request.requestId.toString());
    console.log("Question:", request.question);
    console.log("Status:", Object.keys(request.status)[0]);
    console.log("Reward Amount:", request.rewardAmount.toNumber() / 1e9, "SOL");
    console.log("Bond Amount:", request.bondAmount.toNumber() / 1e9, "SOL");

    expect(request.question).to.equal(question);
    expect(request.rewardAmount.toString()).to.equal(rewardAmount.toString());
  });

  it("Propose Answer (Simulated)", async () => {
    console.log("\n=== Propose Answer Test ===");
    console.log("Note: This test requires waiting for expiry timestamp.");
    console.log("To test propose_answer:");
    console.log("1. Wait for request to expire");
    console.log("2. Call propose_answer with 'YES' or 'NO'");
    console.log("3. Anyone can propose by putting down the bond");
  });

  it("View Oracle Stats", async () => {
    const [oracleStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("oracle_state")],
      program.programId
    );

    const oracleState = await program.account.oracleState.fetch(oracleStatePDA);
    
    console.log("\n=== Oracle Statistics ===");
    console.log("Total Requests:", oracleState.requestCount.toString());
    console.log("Total Volume:", oracleState.totalVolume.toNumber() / 1e9, "SOL");
    console.log("Admin:", oracleState.admin.toString());
  });
});
