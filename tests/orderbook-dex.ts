import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OrderbookDex } from "../target/types/orderbook_dex";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

describe("orderbook-dex", () => {
  // Configure the client to use the local cluster.
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OrderbookDex as Program<OrderbookDex>;

  const market_creator = anchor.web3.Keypair.generate();

  // 1. Derive Base Mint PDA
  const [baseMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market-mint-base"), market_creator.publicKey.toBuffer()],
    program.programId
  );

  // 2. Derive Quote Mint PDA
  const [quoteMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market-mint-quote"), market_creator.publicKey.toBuffer()],
    program.programId
  );

  // 3. Derive Market PDA
  // NOTE: Must match Rust seeds: [b"market", base_mint, quote_mint]
  const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("market"), baseMintPda.toBuffer(), quoteMintPda.toBuffer()],
    program.programId
  );

  before("Airdrop", async () => {
    // Airdrop SOL to the creator so theyor account rent
    const transaction = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: market_creator.publicKey,
        lamports: 10 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(transaction);
  });

  it("Is initialized!", async () => {
    let fee_bps = 30;

    const tx = await program.methods
      .createMarket(fee_bps)
      .accountsPartial({
        marketSigner: market_creator.publicKey,
        // Anchor will resolve the rest (market, mints, vaults) because they are PDAs
        baseMint: baseMintPda,
        quoteMint: quoteMintPda,
        market: marketPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([market_creator])
      .rpc();

    console.log("Your transaction signature", tx);

    // Fetch the account to verify
    const marketAccount = await program.account.market.fetch(marketPda);

    // Assertions
    assert.equal(marketAccount.feeBps, 30);
    assert.equal(
      marketAccount.creator.toBase58(),
      market_creator.publicKey.toBase58()
    );
    assert.equal(marketAccount.baseMint.toBase58(), baseMintPda.toBase58());
    assert.equal(marketAccount.quoteMint.toBase58(), quoteMintPda.toBase58());
  });
});
