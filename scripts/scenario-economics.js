const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair, Connection } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
  console.log("\n💰 ===== ECONOMIC SIMULATION =====\n");
  console.log("Track profit/loss across multiple oracle requests!\n");

  const connection = new Connection("https://api.devnet.solana.com");
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  const idl = JSON.parse(fs.readFileSync("./target/idl/optimistic_oracle.json", "utf-8"));
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, provider);

  const myAddress = walletKeypair.publicKey;

  console.log("👤 Your Address:", myAddress.toString());
  console.log("\n📊 Analyzing your oracle activity...\n");

  const [oracleStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("oracle_state")],
    program.programId
  );

  const oracleState = await program.account.oracleState.fetch(oracleStatePDA);

  let totalCreated = 0;
  let totalProposed = 0;
  let totalWon = 0;
  let moneyLocked = 0;
  let potentialProfit = 0;

  console.log("═══════════════════════════════════════════════════════════════\n");

  for (let i = 1; i <= oracleState.requestCount.toNumber(); i++) {
    const [requestPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("request"), new anchor.BN(i).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    try {
      const request = await program.account.request.fetch(requestPDA);
      const status = Object.keys(request.status)[0];

      // Check if you're the creator
      if (request.creator.toString() === myAddress.toString()) {
        totalCreated++;
        if (status === "created" || status === "proposed") {
          moneyLocked += request.rewardAmount.toNumber();
        }
        console.log(`#${i} [CREATOR] ${request.question.slice(0, 40)}...`);
        console.log(`    Status: ${status.toUpperCase()}`);
        console.log(`    Reward locked: ${request.rewardAmount.toNumber() / 1e9} SOL`);
      }

      // Check if you're the proposer
      if (request.proposer && request.proposer.toString() === myAddress.toString()) {
        totalProposed++;
        if (status === "proposed") {
          moneyLocked += request.bondAmount.toNumber();
          potentialProfit += request.rewardAmount.toNumber();
        }
        if (status === "resolved") {
          totalWon++;
        }
        console.log(`#${i} [PROPOSER] ${request.question.slice(0, 40)}...`);
        console.log(`    Status: ${status.toUpperCase()}`);
        console.log(`    Your answer: ${request.answer}`);
        if (status === "proposed") {
          console.log(`    Potential profit: ${request.rewardAmount.toNumber() / 1e9} SOL`);
        }
      }

      console.log();

    } catch (e) {
      // Skip
    }
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("\n📈 YOUR STATISTICS:");
  console.log(`   Requests Created: ${totalCreated}`);
  console.log(`   Answers Proposed: ${totalProposed}`);
  console.log(`   Successful Resolutions: ${totalWon}`);
  console.log(`   Success Rate: ${totalProposed > 0 ? Math.round((totalWon / totalProposed) * 100) : 0}%`);
  console.log("\n💰 ECONOMICS:");
  console.log(`   Money Currently Locked: ${moneyLocked / 1e9} SOL`);
  console.log(`   Potential Profit (if resolved): ${potentialProfit / 1e9} SOL`);
  console.log(`   ROI: ${moneyLocked > 0 ? Math.round((potentialProfit / moneyLocked) * 100) : 0}%`);
  console.log("\n✨ Keep participating to increase your stats!\n");
}

main();
