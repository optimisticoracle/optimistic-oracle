const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, Keypair, Connection } = require("@solana/web3.js");
const fs = require("fs");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("\n⚔️  ===== DISPUTE DRAMA SCENARIO =====\n");
  console.log("Story: Alice proposes 'YES', but Bob disputes with 'NO'!\n");

  const connection = new Connection("https://api.devnet.solana.com");
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const mainWallet = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  const idl = JSON.parse(fs.readFileSync("./target/idl/optimistic_oracle.json", "utf-8"));
  const wallet = new anchor.Wallet(mainWallet);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, provider);

  console.log("🎭 Characters:");
  console.log("   👤 You: The creator (neutral judge)");
  console.log("   👤 Alice: Optimistic proposer");
  console.log("   👤 Bob: Skeptical disputer\n");

  // Step 1: Create controversial request
  console.log("📝 Act 1: Creating CONTROVERSIAL question...");
  console.log("   Question: 'Is pineapple acceptable on pizza?'");
  console.log("   (This will cause drama!) 🍕🍍\n");

  const [oracleStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("oracle_state")],
    program.programId
  );

  const oracleState = await program.account.oracleState.fetch(oracleStatePDA);
  const requestId = oracleState.requestCount.toNumber() + 1;

  const [requestPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("request"), new anchor.BN(requestId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const [requestEscrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("request_escrow"), requestPDA.toBuffer()],
    program.programId
  );

  await program.methods
    .createRequest(
      "Is pineapple acceptable on pizza?",
      { yesNo: {} },
      new anchor.BN(100_000_000),
      new anchor.BN(50_000_000),
      new anchor.BN(Math.floor(Date.now() / 1000) + 20), // 20 seconds
      new anchor.BN(30), // Short 30 second challenge for demo
      null,
      null
    )
    .accounts({
      request: requestPDA,
      oracleState: oracleStatePDA,
      requestEscrow: requestEscrowPDA,
      creator: mainWallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("   ✅ Request created! ID:", requestId);
  console.log("   ⏰ Expires in 20 seconds...\n");

  // Countdown
  for (let i = 20; i > 0; i -= 5) {
    console.log(`   ${i} seconds remaining...`);
    await sleep(5000);
  }

  // Step 2: Alice proposes YES
  console.log("\n🎬 Act 2: Alice's Bold Move");
  console.log("   💭 Alice: 'Of course YES! Pineapple pizza is delicious!'");
  console.log("   💰 Alice puts down 0.05 SOL bond\n");

  const [proposalEscrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("proposal_escrow"), requestPDA.toBuffer()],
    program.programId
  );

  await program.methods
    .proposeAnswer("YES")
    .accounts({
      request: requestPDA,
      proposalEscrow: proposalEscrowPDA,
      proposer: mainWallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("   ✅ Alice proposed: YES");
  console.log("   📊 Status: PROPOSED");
  console.log("   ⏰ Challenge period: 30 seconds\n");

  await sleep(3000);

  // Step 3: Bob disputes!
  console.log("🎬 Act 3: Bob's Challenge!");
  console.log("   💭 Bob: 'NO WAY! This is an OUTRAGE!'");
  console.log("   ⚔️  Bob disputes the answer!");
  console.log("   💰 Bob puts down 0.05 SOL bond\n");

  const [disputeEscrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("dispute_escrow"), requestPDA.toBuffer()],
    program.programId
  );

  await program.methods
    .disputeAnswer(null)
    .accounts({
      request: requestPDA,
      disputeEscrow: disputeEscrowPDA,
      disputer: mainWallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("   ⚡ DISPUTED!");
  console.log("   📊 Status: DISPUTED");
  console.log("   💰 Total at stake: 0.2 SOL");
  console.log("      • Reward: 0.1 SOL");
  console.log("      • Alice's bond: 0.05 SOL");
  console.log("      • Bob's bond: 0.05 SOL\n");

  await sleep(2000);

  // Step 4: Resolution
  console.log("🎬 Act 4: The Resolution");
  console.log("   ⚖️  You (Admin) must decide the winner...\n");
  
  const request = await program.account.request.fetch(requestPDA);
  
  console.log("📊 DISPUTE DETAILS:");
  console.log("═══════════════════════════════════════");
  console.log("Question:", request.question);
  console.log("Alice's Answer: YES (pineapple OK)");
  console.log("Bob's Challenge: NO (pineapple NOT OK)");
  console.log("\n💰 Economics:");
  console.log("   Reward Pool: 0.1 SOL");
  console.log("   Alice's Bond: 0.05 SOL");
  console.log("   Bob's Bond: 0.05 SOL");
  console.log("   TOTAL: 0.2 SOL");
  console.log("\n🏆 Winner takes: 0.2 SOL");
  console.log("💸 Loser loses: 0.05 SOL bond");
  console.log("\n⚖️  To resolve this dispute:");
  console.log("   # If Alice wins (YES is correct):");
  console.log("   node scripts/resolve-dispute.js", requestId, "true");
  console.log("\n   # If Bob wins (NO is correct):");
  console.log("   node scripts/resolve-dispute.js", requestId, "false");
  console.log("\n🎭 The drama awaits your judgment!\n");
}

main();
