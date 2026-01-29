import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OrderbookDex } from "../target/types/orderbook_dex";
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("orderbook-dex", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OrderbookDex as Program<OrderbookDex>;

  const market_creator = anchor.web3.Keypair.generate();
  const trader = anchor.web3.Keypair.generate();

  // We will initialize these in the 'before' block
  let base_mint: anchor.web3.PublicKey;
  let quote_mint: anchor.web3.PublicKey;
  let base_mint_valut: anchor.web3.PublicKey;
  let quote_mint_valut: anchor.web3.PublicKey;
  let trader_base_mint_acc: anchor.web3.PublicKey;
  let trader_quote_mint_acc: anchor.web3.PublicKey;

  let marketPda: anchor.web3.PublicKey;
  let orderBookPda: anchor.web3.PublicKey;

  before("Setup environment", async () => {
    // 1. Fund creator and trader from provider wallet
    const transferTx1 = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: market_creator.publicKey,
        lamports: 2 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(transferTx1);

    const transferTx2 = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: trader.publicKey,
        lamports: 2 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(transferTx2);

    // 2. Create Mints
    // Note: createMint returns the PublicKey of the new mint
    base_mint = await createMint(
      provider.connection,
      market_creator,
      market_creator.publicKey,
      null,
      9
    );

    quote_mint = await createMint(
      provider.connection,
      market_creator,
      market_creator.publicKey,
      null,
      6
    );

    // Derive Market PDA
    [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("market"), base_mint.toBuffer(), quote_mint.toBuffer()],
      program.programId
    );

    // Derive OrderBook PDA
    [orderBookPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("market_orderBook"), marketPda.toBuffer()],
      program.programId
    );

    // 3. Create Trader Token Accounts
    const baseMintVaultAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      market_creator,
      base_mint,
      marketPda,
      true
    );
    base_mint_valut = baseMintVaultAta.address;

    const quoteMintVaultAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      market_creator,
      quote_mint,
      marketPda,
      true
    );
    quote_mint_valut = quoteMintVaultAta.address;

    const traderBaseAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      trader,
      base_mint,
      trader.publicKey
    );
    trader_base_mint_acc = traderBaseAta.address;

    const traderQuoteAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      trader,
      quote_mint,
      trader.publicKey
    );
    trader_quote_mint_acc = traderQuoteAta.address;

    // 4. Mint tokens to trader
    await mintTo(
      provider.connection,
      market_creator,
      base_mint,
      trader_base_mint_acc,
      market_creator,
      1000 * 10 ** 9 // 1000 Base tokens
    );

    await mintTo(
      provider.connection,
      market_creator,
      quote_mint,
      trader_quote_mint_acc,
      market_creator,
      1000 * 10 ** 6 // 1000 Quote tokens
    );
  });

  it("Is initialized!", async () => {
    let fee_bps = 30;

    const tx = await program.methods
      .createMarket(fee_bps)
      .accountsPartial({
        marketSigner: market_creator.publicKey,
        baseMint: base_mint,
        quoteMint: quote_mint,
        market: marketPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([market_creator])
      .rpc();

    console.log("Create Market signature", tx);

    // Fetch the account to verify
    const marketAccount = await program.account.market.fetch(marketPda);
    const orderBookAccount = await program.account.orderBook.fetch(
      orderBookPda
    );

    // Assertions
    assert.equal(marketAccount.feeBps, 30);
    assert.equal(
      marketAccount.creator.toBase58(),
      market_creator.publicKey.toBase58()
    );
    assert.equal(marketAccount.baseMint.toBase58(), base_mint.toBase58());
    assert.equal(marketAccount.quoteMint.toBase58(), quote_mint.toBase58());

    assert.equal(orderBookAccount.market.toBase58(), marketPda.toBase58());
  });

  it("Place order (Bid)", async () => {
    // amount = 1 (1 unit of base)
    // price = 10 (10 units of quote)
    let amount = new anchor.BN(1);
    let price = new anchor.BN(10);
    let side = { bid: {} };

    const tx = await program.methods
      .placeOrder(price, amount, side)
      .accounts({
        trader: trader.publicKey,
        baseMint: base_mint,
        quoteMint: quote_mint,
        traderBaseMintAccount: trader_base_mint_acc,
        traderQuoteMintAccount: trader_quote_mint_acc,
        // The rest are PDAs resolved by Anchor or inferred
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([trader])
      .rpc();

    console.log("Place Order signature", tx);

    let orderBookAccount = await program.account.orderBook.fetch(orderBookPda);
    console.log("orderBookBids", orderBookAccount.bids[0]);

    assert.equal(orderBookAccount.bids.length, 1);
    assert.equal(
      orderBookAccount.bids[0].owner.toBase58(),
      trader.publicKey.toBase58()
    );
    assert.equal(orderBookAccount.bids[0].price.toNumber(), 10);
  });

  it("Place order (Ask)", async () => {
    // amount = 1 (1 unit of base)
    // price = 12 (12 units of quote) - Selling higher than the bid
    let amount = new anchor.BN(1);
    let price = new anchor.BN(12);
    let side = { ask: {} };

    const tx = await program.methods
      .placeOrder(price, amount, side)
      .accountsPartial({
        trader: trader.publicKey,
        baseMint: base_mint,
        quoteMint: quote_mint,
        traderBaseMintAccount: trader_base_mint_acc,
        traderQuoteMintAccount: trader_quote_mint_acc,
        market: marketPda,
        orderBook: orderBookPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([trader])
      .rpc();

    console.log("Place Ask Order signature", tx);

    let orderBookAccount = await program.account.orderBook.fetch(orderBookPda);
    console.log("orderBookAsks", orderBookAccount.asks[0]);

    assert.equal(orderBookAccount.asks.length, 1);
    assert.equal(
      orderBookAccount.asks[0].owner.toBase58(),
      trader.publicKey.toBase58()
    );
    assert.equal(orderBookAccount.asks[0].price.toNumber(), 12);
  });

  it("Stress Test", async () => {
    let amount = new anchor.BN(1);
    let price = new anchor.BN(1);
    let side = { bid: {} };

    for (let i = 1; i <= 49; i++) {
      console.log(`The bid trade no ${i}`);
      const tx = await program.methods
        .placeOrder(price, amount, side)
        .accounts({
          trader: trader.publicKey,
          baseMint: base_mint,
          quoteMint: quote_mint,
          traderBaseMintAccount: trader_base_mint_acc,
          traderQuoteMintAccount: trader_quote_mint_acc,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([trader])
        .rpc();

      await provider.connection.confirmTransaction(tx);
    }
    let orderBookAccount = await program.account.orderBook.fetch(orderBookPda);

    //See is the orderBookBids are 50 or not
    assert.equal(orderBookAccount.bids.length, 50);

    try {
      const tx = await program.methods
        .placeOrder(price, amount, side)
        .accounts({
          trader: trader.publicKey,
          baseMint: base_mint,
          quoteMint: quote_mint,
          traderBaseMintAccount: trader_base_mint_acc,
          traderQuoteMintAccount: trader_quote_mint_acc,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([trader])
        .rpc();
      await provider.connection.confirmTransaction(tx);

      assert.fail("Should have failed with OrderBookFull");
    } catch (error) {
      console.log(`ERROR :- {error}`);
      assert.equal(error.error.errorCode.code, "OrderBookFull");
    }
  });
  it("Cancel Order", async () => {
    let orderId = new anchor.BN(4);
    let side = { bid: {} };

    let traderQuoteAtaBefore = await provider.connection.getTokenAccountBalance(
      trader_quote_mint_acc
    );

    const tx = await program.methods
      .cancelOrder(side, orderId)
      .accountsPartial({
        trader: trader.publicKey,
        market: marketPda,
        orderBook: orderBookPda,
        baseMint: base_mint,
        quoteMint: quote_mint,

        quoteMintVault: quote_mint_valut,
        baseMintVault: base_mint_valut,
        traderBaseMintAccount: trader_base_mint_acc,
        traderQuoteMintAccount: trader_quote_mint_acc,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([trader])
      .rpc();
    await provider.connection.confirmTransaction(tx);

    let orderBookAccount = await program.account.orderBook.fetch(orderBookPda);

    assert.equal(orderBookAccount.bids.length, 49);

    let traderQuoteAtaAfter = await provider.connection.getTokenAccountBalance(
      trader_quote_mint_acc
    );

    assert.isAbove(
      Number(traderQuoteAtaAfter.value.amount),
      Number(traderQuoteAtaBefore.value.amount),
      "token balance is not increase mean refund not happen"
    );
  });
});
