// Script to airdrop test tokens to users
// Usage: npx ts-node scripts/airdrop-tokens.ts <WALLET_ADDRESS>

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  mintToInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const CLUSTER = "https://api.devnet.solana.com";
const BASE_MINT = new PublicKey("DeRQ3edcNvwH8XjEVtFiqLN8uiABcojbyjxhcE5LLj8x");
const QUOTE_MINT = new PublicKey("D3VykNoT3ne9Rkn6tSy7ssGvhSq3NGN7mWtqQss4jADM");

// You need to be the mint authority to run this script
// Load your wallet that has mint authority
const WALLET_PATH = path.join(
  process.env.HOME || "~",
  ".config/solana/id.json"
);

async function airdropTokens(recipientAddress: string) {
  const connection = new Connection(CLUSTER, "confirmed");

  // Load wallet (must be mint authority)
  const walletData = JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8"));
  const payer = Keypair.fromSecretKey(new Uint8Array(walletData));

  const recipient = new PublicKey(recipientAddress);

  console.log(`Airdropping tokens to: ${recipientAddress}`);
  console.log(`From wallet: ${payer.publicKey.toBase58()}`);

  // Airdrop amounts (in display units)
  const BASE_AIRDROP = 1000; // 1000 base tokens
  const QUOTE_AIRDROP = 10000; // 10000 quote tokens

  // Base decimals = 9, Quote decimals = 6
  const baseAmount = BigInt(BASE_AIRDROP * 10 ** 9);
  const quoteAmount = BigInt(QUOTE_AIRDROP * 10 ** 6);

  // Get or create recipient ATAs
  const recipientBaseAta = getAssociatedTokenAddressSync(BASE_MINT, recipient);
  const recipientQuoteAta = getAssociatedTokenAddressSync(
    QUOTE_MINT,
    recipient
  );

  // Check and create ATAs if needed
  try {
    await getAccount(connection, recipientBaseAta);
    console.log("Base ATA exists");
  } catch {
    console.log("Creating Base ATA...");
    // Note: In production, you'd need to send this transaction
    console.log(
      "Run: spl-token create-account",
      BASE_MINT.toBase58(),
      "--owner",
      recipientAddress
    );
  }

  try {
    await getAccount(connection, recipientQuoteAta);
    console.log("Quote ATA exists");
  } catch {
    console.log("Creating Quote ATA...");
    console.log(
      "Run: spl-token create-account",
      QUOTE_MINT.toBase58(),
      "--owner",
      recipientAddress
    );
  }

  // Mint tokens (you need to be the mint authority)
  console.log("\n📝 To airdrop tokens, run these commands:\n");
  console.log(
    `spl-token mint ${BASE_MINT.toBase58()} ${BASE_AIRDROP} ${recipientBaseAta.toBase58()}`
  );
  console.log(
    `spl-token mint ${QUOTE_MINT.toBase58()} ${QUOTE_AIRDROP} ${recipientQuoteAta.toBase58()}`
  );
  console.log("\n✅ Copy and paste the commands above to airdrop tokens\n");
}

// Run the script
const recipient = process.argv[2];
if (!recipient) {
  console.error("Usage: npx ts-node scripts/airdrop-tokens.ts <WALLET_ADDRESS>");
  process.exit(1);
}

airdropTokens(recipient).catch(console.error);
