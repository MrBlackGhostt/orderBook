import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";

export interface TokenPair {
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseMintKeypair: Keypair;
  quoteMintKeypair: Keypair;
}

/**
 * Creates a pair of SPL tokens (BASE and QUOTE) for testing
 * User becomes the mint authority for both tokens
 */
export async function createTokenPair(
  connection: Connection,
  publicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  baseDecimals: number = 9,
  quoteDecimals: number = 6
): Promise<TokenPair> {
  // Generate keypairs for both mints
  const baseMintKeypair = Keypair.generate();
  const quoteMintKeypair = Keypair.generate();

  const tx = new Transaction();

  // Get minimum balance for rent exemption
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  // Create BASE token mint account
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: publicKey,
      newAccountPubkey: baseMintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  // Initialize BASE token mint
  tx.add(
    createInitializeMintInstruction(
      baseMintKeypair.publicKey,
      baseDecimals,
      publicKey, // mint authority
      publicKey  // freeze authority
    )
  );

  // Create QUOTE token mint account
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: publicKey,
      newAccountPubkey: quoteMintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  // Initialize QUOTE token mint
  tx.add(
    createInitializeMintInstruction(
      quoteMintKeypair.publicKey,
      quoteDecimals,
      publicKey, // mint authority
      publicKey  // freeze authority
    )
  );

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = publicKey;

  // Partially sign with mint keypairs
  tx.partialSign(baseMintKeypair, quoteMintKeypair);

  // Sign with wallet and send
  const signed = await signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize());
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, "confirmed");

  return {
    baseMint: baseMintKeypair.publicKey,
    quoteMint: quoteMintKeypair.publicKey,
    baseMintKeypair,
    quoteMintKeypair,
  };
}

/**
 * Check if user has enough SOL for token creation
 */
export async function checkSolBalance(
  connection: Connection,
  publicKey: PublicKey,
  requiredSol: number = 0.01 // ~0.01 SOL should be enough
): Promise<{ hasEnough: boolean; balance: number }> {
  const balance = await connection.getBalance(publicKey);
  const balanceInSol = balance / 1e9;
  
  return {
    hasEnough: balanceInSol >= requiredSol,
    balance: balanceInSol,
  };
}
