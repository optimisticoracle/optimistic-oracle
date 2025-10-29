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
  const answer = process.argv[3] || "YES";

  console.log("\n🎯 Proposing Answer to Request\n");
  console.log("Request ID:", requestId);
  console.log("Answer:", answer);
  console.log("Proposer:", wallet.publicKey.toString());

  const [requestPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("request"), new anchor.BN(requestId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  console.log("Request PDA:", requestPDA.toString());

  try {
    const request = await program.account.request.fetch(requestPDA);
    console.log("\n📋 Request Info:");
    console.log("   Question:", request.question);
    console.log("   Status:", Object.keys(request.status)[0]);
    console.log("   Bond Required:", request.bondAmount.toNumber() / 1e9, "SOL");
    console.log("   Expiry:", new Date(request.expiryTimestamp.toNumber() * 1000).toLocaleString());

    const now = Math.floor(Date.now() / 1000);
    if (now < request.expiryTimestamp.toNumber()) {
      console.log("\n❌ Error: Request has not expired yet!");
      console.log("   Current time:", new Date().toLocaleString());
      console.log("   Wait until:", new Date(request.expiryTimestamp.toNumber() * 1000).toLocaleString());
      process.exit(1);
    }

    if (Object.keys(request.status)[0] !== "created") {
      console.log("\n❌ Error: Request is not in 'created' status!");
      console.log("   Current status:", Object.keys(request.status)[0]);
      process.exit(1);
    }

    const balance = await connection.getBalance(wallet.publicKey);
    console.log("\n💰 Your Balance:", balance / 1e9, "SOL");
    
    if (balance < request.bondAmount.toNumber()) {
      console.log("❌ Insufficient balance! Need", request.bondAmount.toNumber() / 1e9, "SOL");
      process.exit(1);
    }

    console.log("\n✅ All checks passed! Proposing answer...\n");

    const [proposalEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal_escrow"), requestPDA.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .proposeAnswer(answer)
      .accounts({
        request: requestPDA,
        proposalEscrow: proposalEscrowPDA,
        proposer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Answer Proposed Successfully!");
    console.log("   Transaction:", tx);
    console.log("   Explorer:", `https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    const updatedRequest = await program.account.request.fetch(requestPDA);
    console.log("\n📊 Updated Request:");
    console.log("   Status:", Object.keys(updatedRequest.status)[0]);
    console.log("   Answer:", updatedRequest.answer);
    console.log("   Proposer:", updatedRequest.proposer.toString());
    
    const challengeEnd = updatedRequest.proposalTime.toNumber() + updatedRequest.challengePeriod.toNumber();
    console.log("\n⏰ Challenge Period:");
    console.log("   Duration:", updatedRequest.challengePeriod.toNumber() / 3600, "hours");
    console.log("   Ends at:", new Date(challengeEnd * 1000).toLocaleString());
    console.log("\n💡 After challenge period, resolve with:");
    console.log("   node scripts/resolve.js", requestId);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.logs) {
      console.log("\nLogs:", error.logs);
    }
  }
}

main();
