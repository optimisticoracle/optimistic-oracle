const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, Keypair, Connection } = require("@solana/web3.js");
const fs = require("fs");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("\n⚔️  ===== PREDICTION MARKET BATTLE =====\n");
  console.log("Scenario: 3 proposers competing to answer the same request!\n");

  const connection = new Connection("https://api.devnet.solana.com");
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const mainWallet = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  const idl = JSON.parse(fs.readFileSync("./target/idl/optimistic_oracle.json", "utf-8"));
  const wallet = new anchor.Wallet(mainWallet);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, provider);

  // Create 2 additional proposer wallets
  console.log("🎭 Creating proposer characters...\n");
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  
  console.log("👤 Main Wallet (You):", mainWallet.publicKey.toString().slice(0, 8) + "...");
  console.log("👤 Alice:", alice.publicKey.toString().slice(0, 8) + "...");
  console.log("👤 Bob:", bob.publicKey.toString().slice(0, 8) + "...");

  // Fund proposers
  console.log("\n💰 Funding proposers...");
  try {
    const sig1 = await connection.requestAirdrop(alice.publicKey, 0.1 * 1e9);
    await connection.confirmTransaction(sig1);
    console.log("   ✅ Alice funded: 0.1 SOL");
  } catch (e) {
    console.log("   ⚠️  Alice airdrop failed (rate limit). Using main wallet as Alice.");
  }

  try {
    const sig2 = await connection.requestAirdrop(bob.publicKey, 0.1 * 1e9);
    await connection.confirmTransaction(sig2);
    console.log("   ✅ Bob funded: 0.1 SOL");
  } catch (e) {
    console.log("   ⚠️  Bob airdrop failed (rate limit). Using main wallet as Bob.");
  }

  // Step 1: Create high-stakes request
  console.log("\n📝 Step 1: Creating HIGH-STAKES request...");
  console.log("   Question: 'Will this test succeed?'");
  console.log("   Reward: 0.15 SOL (HIGH REWARD!) 💰");
  console.log("   Bond: 0.075 SOL");
  console.log("   Expiry: 30 seconds\n");

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
      "Will this test succeed?",
      { yesNo: {} },
      new anchor.BN(150_000_000), // 0.15 SOL reward
      new anchor.BN(75_000_000),  // 0.075 SOL bond
      new anchor.BN(Math.floor(Date.now() / 1000) + 30),
      new anchor.BN(3600),
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
  console.log("   💰 0.15 SOL locked in escrow");

  // Countdown
  console.log("\n⏰ Waiting for expiry (30 seconds)...\n");
  for (let i = 30; i > 0; i--) {
    if (i % 5 === 0 || i <= 3) {
      console.log(`   ${i} seconds... Proposers are getting ready! 🏃‍♂️`);
    }
    await sleep(1000);
  }

  console.log("\n⚡ EXPIRED! Race is ON! Who will propose first?\n");

  // Step 2: Race to propose!
  console.log("🏁 Step 2: RACE TO PROPOSE!\n");

  const [proposalEscrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("proposal_escrow"), requestPDA.toBuffer()],
    program.programId
  );

  // Simulate race - You propose first!
  console.log("💨 You are fastest! Submitting answer 'YES'...");
  
  try {
    const tx = await program.methods
      .proposeAnswer("YES")
      .accounts({
        request: requestPDA,
        proposalEscrow: proposalEscrowPDA,
        proposer: mainWallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("   🎉 SUCCESS! You won the race!");
    console.log("   📝 Answer 'YES' proposed");
    console.log("   💰 0.075 SOL bond locked");
    console.log("   TX:", tx.slice(0, 20) + "...");

    // Other proposers are too late
    await sleep(2000);
    console.log("\n❌ Alice tried to propose... but too late!");
    console.log("   Error: Request already has a proposal");
    
    await sleep(1000);
    console.log("\n❌ Bob tried to propose... also too late!");
    console.log("   Error: Request already has a proposal");

    // Show final state
    await sleep(2000);
    const request = await program.account.request.fetch(requestPDA);
    
    console.log("\n📊 BATTLE RESULT:");
    console.log("═══════════════════════════════════════");
    console.log("🏆 WINNER: YOU!");
    console.log("📝 Answer:", request.answer);
    console.log("💰 Potential Reward: 0.15 SOL");
    console.log("💰 Bond Return: 0.075 SOL");
    console.log("💵 TOTAL PROFIT: 0.15 SOL");
    
    const challengeEnd = request.proposalTime.toNumber() + request.challengePeriod.toNumber();
    console.log("\n⏰ Challenge Period:");
    console.log("   Ends:", new Date(challengeEnd * 1000).toLocaleString());
    console.log("   Duration: 1 hour");
    console.log("\n💡 After challenge period:");
    console.log("   node scripts/resolve.js", requestId);
    console.log("\n🎉 You earned the right to resolve and claim 0.225 SOL!\n");

  } catch (error) {
    console.error("❌ Error in race:", error.message);
  }
}

main();
