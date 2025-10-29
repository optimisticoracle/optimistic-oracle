const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair, Connection } = require("@solana/web3.js");
const fs = require("fs");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function dashboard() {
  const connection = new Connection("https://api.devnet.solana.com");
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  const idl = JSON.parse(fs.readFileSync("./target/idl/optimistic_oracle.json", "utf-8"));
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, provider);

  while (true) {
    console.clear();
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║         🔮 OPTIMISTIC ORACLE LIVE DASHBOARD 🔮            ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const now = Math.floor(Date.now() / 1000);
    const currentTime = new Date().toLocaleTimeString();

    console.log(`⏰ Current Time: ${currentTime}\n`);

    try {
      const [oracleStatePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("oracle_state")],
        program.programId
      );

      const oracleState = await program.account.oracleState.fetch(oracleStatePDA);

      console.log("📊 ORACLE STATISTICS");
      console.log("─────────────────────────────────────────────────────────────");
      console.log(`   Total Requests: ${oracleState.requestCount.toString()}`);
      console.log(`   Total Volume: ${oracleState.totalVolume.toNumber() / 1e9} SOL`);
      console.log(`   Program ID: ${program.programId.toString().slice(0, 20)}...`);
      console.log();

      console.log("📋 ACTIVE REQUESTS");
      console.log("─────────────────────────────────────────────────────────────\n");

      let activeCount = 0;
      let pendingCount = 0;
      let proposedCount = 0;
      let resolvableCount = 0;

      for (let i = 1; i <= oracleState.requestCount.toNumber(); i++) {
        const [requestPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("request"), new anchor.BN(i).toArrayLike(Buffer, "le", 8)],
          program.programId
        );

        try {
          const request = await program.account.request.fetch(requestPDA);
          const status = Object.keys(request.status)[0];

          if (status === "resolved" || status === "cancelled") continue;

          activeCount++;

          const isExpired = now > request.expiryTimestamp.toNumber();
          const canPropose = status === "created" && isExpired;
          
          let canResolve = false;
          if (status === "proposed" && request.proposalTime) {
            const challengeEnd = request.proposalTime.toNumber() + request.challengePeriod.toNumber();
            canResolve = now > challengeEnd;
          }

          if (status === "created") pendingCount++;
          if (status === "proposed") proposedCount++;
          if (canResolve) resolvableCount++;

          console.log(`#${i} | ${status.toUpperCase().padEnd(8)} | ${request.question.slice(0, 35)}...`);
          console.log(`    Reward: ${request.rewardAmount.toNumber() / 1e9} SOL | Bond: ${request.bondAmount.toNumber() / 1e9} SOL`);
          
          if (status === "created") {
            if (canPropose) {
              console.log(`    🟢 READY TO PROPOSE!`);
            } else {
              const timeLeft = request.expiryTimestamp.toNumber() - now;
              console.log(`    ⏳ Expires in ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`);
            }
          } else if (status === "proposed") {
            const challengeEnd = request.proposalTime.toNumber() + request.challengePeriod.toNumber();
            const timeLeft = challengeEnd - now;
            
            if (canResolve) {
              console.log(`    🟢 READY TO RESOLVE!`);
            } else {
              console.log(`    ⏳ Challenge ends in ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`);
            }
          }
          console.log();

        } catch (e) {
          // Request not found
        }
      }

      console.log("─────────────────────────────────────────────────────────────");
      console.log(`📊 Summary: ${activeCount} active | ${pendingCount} pending | ${proposedCount} proposed | ${resolvableCount} resolvable`);
      console.log("\n🔄 Auto-refresh in 10 seconds... (Ctrl+C to exit)\n");

    } catch (error) {
      console.error("Error fetching data:", error.message);
    }

    await sleep(10000);
  }
}

dashboard();
