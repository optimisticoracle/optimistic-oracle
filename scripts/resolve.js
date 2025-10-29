const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, Keypair, Connection } = require("@solana/web3.js");
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

  const requestId = process.argv[2] || "1";

  console.log("\n🎯 Resolving Request (Undisputed)\n");
  console.log("Request ID:", requestId);

  const [requestPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("request"), new anchor.BN(requestId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  try {
    const request = await program.account.request.fetch(requestPDA);
    
    console.log("📋 Request Info:");
    console.log("   Question:", request.question);
    console.log("   Status:", Object.keys(request.status)[0]);
    console.log("   Answer:", request.answer || "N/A");
    
    if (Object.keys(request.status)[0] !== "proposed") {
      console.log("\n❌ Error: Request must be in 'proposed' status!");
      process.exit(1);
    }

    const now = Math.floor(Date.now() / 1000);
    const challengeEnd = request.proposalTime.toNumber() + request.challengePeriod.toNumber();
    
    console.log("\n⏰ Time Check:");
    console.log("   Current:", new Date().toLocaleString());
    console.log("   Challenge ends:", new Date(challengeEnd * 1000).toLocaleString());
    
    if (now <= challengeEnd) {
      const remaining = Math.floor((challengeEnd - now) / 60);
      console.log("\n❌ Error: Challenge period not ended yet!");
      console.log("   Time remaining:", remaining, "minutes");
      process.exit(1);
    }

    console.log("\n✅ Challenge period ended. Resolving...\n");

    const [requestEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("request_escrow"), requestPDA.toBuffer()],
      program.programId
    );

    const [proposalEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal_escrow"), requestPDA.toBuffer()],
      program.programId
    );

    const proposerKey = request.proposer;

    const tx = await program.methods
      .resolveUndisputed()
      .accounts({
        request: requestPDA,
        requestEscrow: requestEscrowPDA,
        proposalEscrow: proposalEscrowPDA,
        proposerAccount: proposerKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Request Resolved!");
    console.log("   Transaction:", tx);
    console.log("   Winner:", proposerKey.toString());
    console.log("   Payout:", (request.rewardAmount.toNumber() + request.bondAmount.toNumber()) / 1e9, "SOL");
    console.log("\n🔗 Explorer:", `https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.logs) {
      console.log("\nLogs:", error.logs);
    }
  }
}

main();
