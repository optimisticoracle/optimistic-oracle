const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair, Connection } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com");
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  const idl = JSON.parse(
    fs.readFileSync("./target/idl/optimistic_oracle.json", "utf-8")
  );
  
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, provider);

  const requestId = process.argv[2];

  if (!requestId) {
    console.log("\n📋 ===== ALL ORACLE REQUESTS =====\n");
    
    const [oracleStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("oracle_state")],
      program.programId
    );
    
    const oracleState = await program.account.oracleState.fetch(oracleStatePDA);
    console.log("📊 Oracle Stats:");
    console.log("   Total Requests:", oracleState.requestCount.toString());
    console.log("   Total Volume:", oracleState.totalVolume.toNumber() / 1e9, "SOL");
    console.log("   Admin:", oracleState.admin.toString());
    console.log();

    for (let i = 1; i <= oracleState.requestCount.toNumber(); i++) {
      const [requestPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("request"), new anchor.BN(i).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      try {
        const request = await program.account.request.fetch(requestPDA);
        console.log(`📝 Request #${i}`);
        console.log("   Question:", request.question.slice(0, 60) + "...");
        console.log("   Status:", Object.keys(request.status)[0].toUpperCase());
        console.log("   Answer:", request.answer || "N/A");
        console.log("   Reward:", request.rewardAmount.toNumber() / 1e9, "SOL");
        console.log("   Bond:", request.bondAmount.toNumber() / 1e9, "SOL");
        console.log("   Expiry:", new Date(request.expiryTimestamp.toNumber() * 1000).toLocaleString());
        console.log("   🔗", `https://explorer.solana.com/address/${requestPDA.toString()}?cluster=devnet`);
        console.log();
      } catch (e) {
        console.log(`❌ Request #${i}: Not found\n`);
      }
    }
  } else {
    console.log(`\n📋 Request #${requestId} Details\n`);
    
    const [requestPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("request"), new anchor.BN(requestId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const request = await program.account.request.fetch(requestPDA);
    const now = Math.floor(Date.now() / 1000);
    
    console.log("Question:", request.question);
    console.log("Creator:", request.creator.toString());
    console.log("Status:", Object.keys(request.status)[0].toUpperCase());
    console.log();
    console.log("💰 Economics:");
    console.log("   Reward:", request.rewardAmount.toNumber() / 1e9, "SOL");
    console.log("   Bond:", request.bondAmount.toNumber() / 1e9, "SOL");
    console.log();
    console.log("⏰ Timeline:");
    console.log("   Created:", new Date(request.createdAt.toNumber() * 1000).toLocaleString());
    console.log("   Expiry:", new Date(request.expiryTimestamp.toNumber() * 1000).toLocaleString());
    console.log("   Expired:", now > request.expiryTimestamp.toNumber() ? "✅ YES" : "❌ NO");
    console.log();
    
    if (request.answer) {
      console.log("📝 Proposal:");
      console.log("   Answer:", request.answer);
      console.log("   Proposer:", request.proposer.toString());
      console.log("   Proposed:", new Date(request.proposalTime.toNumber() * 1000).toLocaleString());
      
      const challengeEnd = request.proposalTime.toNumber() + request.challengePeriod.toNumber();
      console.log("   Challenge ends:", new Date(challengeEnd * 1000).toLocaleString());
      console.log("   Can resolve:", now > challengeEnd ? "✅ YES" : "❌ NO");
    }
    
    console.log("\n🔗 Explorer:", `https://explorer.solana.com/address/${requestPDA.toString()}?cluster=devnet\n`);
  }
}

main();
