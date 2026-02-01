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

    // 4. Mint tokens to baseMintVaultAta
    await mintTo(
      provider.connection,
      market_creator,
      base_mint,
      base_mint_valut,
      market_creator,
      1000 * 10 ** 9 // 1000 Base tokens
    );

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
      quote_mint_valut,
      market_creator,
      1000 * 10 ** 6
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

  // it("Place order (Bid)", async () => {
  //   // amount = 1 (1 unit of base)
  //   // price = 10 (10 units of quote)
  //   let amount = new anchor.BN(1);
  //   let price = new anchor.BN(10);
  //   let side = { bid: {} };
  //
  //   const tx = await program.methods
  //     .placeOrder(price, amount, side)
  //     .accounts({
  //       trader: trader.publicKey,
  //       baseMint: base_mint,
  //       quoteMint: quote_mint,
  //       traderBaseMintAccount: trader_base_mint_acc,
  //       traderQuoteMintAccount: trader_quote_mint_acc,
  //       // The rest are PDAs resolved by Anchor or inferred
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //     })
  //     .signers([trader])
  //     .rpc();
  //
  //   console.log("Place Order signature", tx);
  //
  //   let orderBookAccount = await program.account.orderBook.fetch(orderBookPda);
  //   console.log("orderBookBids", orderBookAccount.bids[0]);
  //
  //   assert.equal(orderBookAccount.bids.length, 1);
  //   assert.equal(
  //     orderBookAccount.bids[0].owner.toBase58(),
  //     trader.publicKey.toBase58()
  //   );
  //   assert.equal(orderBookAccount.bids[0].price.toNumber(), 10);
  // });
  //
  // it("Place order (Ask)", async () => {
  //   // amount = 1 (1 unit of base)
  //   // price = 12 (12 units of quote) - Selling higher than the bid
  //   let amount = new anchor.BN(1);
  //   let price = new anchor.BN(12);
  //   let side = { ask: {} };
  //
  //   const tx = await program.methods
  //     .placeOrder(price, amount, side)
  //     .accountsPartial({
  //       trader: trader.publicKey,
  //       baseMint: base_mint,
  //       quoteMint: quote_mint,
  //       traderBaseMintAccount: trader_base_mint_acc,
  //       traderQuoteMintAccount: trader_quote_mint_acc,
  //       market: marketPda,
  //       orderBook: orderBookPda,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //     })
  //     .signers([trader])
  //     .rpc();
  //
  //   console.log("Place Ask Order signature", tx);
  //
  //   let orderBookAccount = await program.account.orderBook.fetch(orderBookPda);
  //   console.log("orderBookAsks", orderBookAccount.asks[0]);
  //
  //   assert.equal(orderBookAccount.asks.length, 1);
  //   assert.equal(
  //     orderBookAccount.asks[0].owner.toBase58(),
  //     trader.publicKey.toBase58()
  //   );
  //   assert.equal(orderBookAccount.asks[0].price.toNumber(), 12);
  // });
  //
  // it("Stress Test", async () => {
  //   let amount = new anchor.BN(1);
  //   let price = new anchor.BN(1);
  //   let side = { bid: {} };
  //
  //   for (let i = 1; i <= 49; i++) {
  //     console.log(`The bid trade no ${i}`);
  //     const tx = await program.methods
  //       .placeOrder(price, amount, side)
  //       .accounts({
  //         trader: trader.publicKey,
  //         baseMint: base_mint,
  //         quoteMint: quote_mint,
  //         traderBaseMintAccount: trader_base_mint_acc,
  //         traderQuoteMintAccount: trader_quote_mint_acc,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //       })
  //       .signers([trader])
  //       .rpc();
  //
  //     await provider.connection.confirmTransaction(tx);
  //   }
  //   let orderBookAccount = await program.account.orderBook.fetch(orderBookPda);
  //
  //   //See is the orderBookBids are 50 or not
  //   assert.equal(orderBookAccount.bids.length, 50);
  //
  //   try {
  //     const tx = await program.methods
  //       .placeOrder(price, amount, side)
  //       .accounts({
  //         trader: trader.publicKey,
  //         baseMint: base_mint,
  //         quoteMint: quote_mint,
  //         traderBaseMintAccount: trader_base_mint_acc,
  //         traderQuoteMintAccount: trader_quote_mint_acc,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //       })
  //       .signers([trader])
  //       .rpc();
  //     await provider.connection.confirmTransaction(tx);
  //
  //     assert.fail("Should have failed with OrderBookFull");
  //   } catch (error) {
  //     console.log(`ERROR :- {error}`);
  //     assert.equal(error.error.errorCode.code, "OrderBookFull");
  //   }
  // });
  // it("Cancel Order", async () => {
  //   let orderId = new anchor.BN(4);
  //   let side = { bid: {} };
  //
  //   let traderQuoteAtaBefore = await provider.connection.getTokenAccountBalance(
  //     trader_quote_mint_acc
  //   );
  //
  //   const tx = await program.methods
  //     .cancelOrder(side, orderId)
  //     .accountsPartial({
  //       trader: trader.publicKey,
  //       market: marketPda,
  //       orderBook: orderBookPda,
  //       baseMint: base_mint,
  //       quoteMint: quote_mint,
  //
  //       quoteMintVault: quote_mint_valut,
  //       baseMintVault: base_mint_valut,
  //       traderBaseMintAccount: trader_base_mint_acc,
  //       traderQuoteMintAccount: trader_quote_mint_acc,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //     })
  //     .signers([trader])
  //     .rpc();
  //   await provider.connection.confirmTransaction(tx);
  //
  //   let orderBookAccount = await program.account.orderBook.fetch(orderBookPda);
  //
  //   assert.equal(orderBookAccount.bids.length, 49);
  //
  //   let traderQuoteAtaAfter = await provider.connection.getTokenAccountBalance(
  //     trader_quote_mint_acc
  //   );
  //
  //   assert.isAbove(
  //     Number(traderQuoteAtaAfter.value.amount),
  //     Number(traderQuoteAtaBefore.value.amount),
  //     "token balance is not increase mean refund not happen"
  //   );
  // });
  //
  it("Match Orders - Full Fill (Bid and Ask same amount)", async () => {
    // Create a second trader (asker)
    const asker = anchor.web3.Keypair.generate();

    // Fund the asker
    const transferTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: asker.publicKey,
        lamports: 2 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(transferTx);

    // Create asker's token accounts
    const askerBaseAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      asker,
      base_mint,
      asker.publicKey
    );
    const askerQuoteAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      asker,
      quote_mint,
      asker.publicKey
    );

    // Mint tokens to asker
    await mintTo(
      provider.connection,
      market_creator,
      base_mint,
      askerBaseAta.address,
      market_creator,
      100 * 10 ** 9 // 10 Base tokens for asker
    );
    await mintTo(
      provider.connection,
      market_creator,
      quote_mint,
      askerQuoteAta.address,
      market_creator,
      100 * 10 ** 6 // 100 Quote tokens for asker
    );

    // Get initial balances
    const traderBaseBefore = await provider.connection.getTokenAccountBalance(
      trader_base_mint_acc
    );
    const traderQuoteBefore = await provider.connection.getTokenAccountBalance(
      trader_quote_mint_acc
    );
    const askerBaseBefore = await provider.connection.getTokenAccountBalance(
      askerBaseAta.address
    );
    const askerQuoteBefore = await provider.connection.getTokenAccountBalance(
      askerQuoteAta.address
    );

    // Place BID: price=12, amount=5 (trader wants to buy 5 base tokens)
    const bidAmount = new anchor.BN(5);
    const bidPrice = new anchor.BN(12);
    const bidSide = { bid: {} };

    await program.methods
      .placeOrder(bidPrice, bidAmount, bidSide)
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

    // Place ASK: price=10, amount=5 (asker wants to sell 5 base tokens)
    // Price 10 is less than bid price 12, so they should match!
    const askAmount = new anchor.BN(5);
    const askPrice = new anchor.BN(10);
    const askSide = { ask: {} };

    //put the ask order here

    await program.methods
      .placeOrder(askPrice, askAmount, askSide)
      .accountsPartial({
        trader: asker.publicKey,
        baseMint: base_mint,
        quoteMint: quote_mint,
        traderBaseMintAccount: askerBaseAta.address,
        traderQuoteMintAccount: askerQuoteAta.address,
        market: marketPda,
        orderBook: orderBookPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([asker])
      .rpc();

    // Verify ask was placed
    const afterPlace = await program.account.orderBook.fetch(orderBookPda);
    console.log("Asks after placing:", afterPlace.asks.length);
    console.log("Top ask after place:", afterPlace.asks[0]);

    // Create cranker account (who calls match_orders)
    const cranker = anchor.web3.Keypair.generate();
    const transferCranker = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: cranker.publicKey,
        lamports: 10 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(transferCranker);

    // Create cranker's quote ATA (to receive fee reward)
    const crankerQuoteAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      cranker,
      quote_mint,
      cranker.publicKey
    );

    // Create fee collector account (market creator's quote ATA)
    const feeCollectorAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      market_creator,
      quote_mint,
      market_creator.publicKey
    );

    // Get orderbook before match
    const orderBookBefore = await program.account.orderBook.fetch(orderBookPda);
    console.log("Bids before match:", orderBookBefore.bids.length);
    console.log("Asks before match:", orderBookBefore.asks.length);
    console.log("Top bid:", orderBookBefore.bids[0]);
    console.log("Top ask:", orderBookBefore.asks[0]);

    // Debug: Trace all balances
    const vaultBaseBefore = await provider.connection.getTokenAccountBalance(
      base_mint_valut
    );
    const vaultQuoteBefore = await provider.connection.getTokenAccountBalance(
      quote_mint_valut
    );
    const traderBaseBeforeLog =
      await provider.connection.getTokenAccountBalance(trader_base_mint_acc);
    const traderQuoteBeforeLog =
      await provider.connection.getTokenAccountBalance(trader_quote_mint_acc);
    const askerBaseBeforeLog = await provider.connection.getTokenAccountBalance(
      askerBaseAta.address
    );
    const askerQuoteBeforeLog =
      await provider.connection.getTokenAccountBalance(askerQuoteAta.address);

    console.log("--- BEFORE MATCH ---");
    console.log("Vault Base:", vaultBaseBefore.value.amount);
    console.log("Vault Quote:", vaultQuoteBefore.value.amount);
    console.log("Trader Base:", traderBaseBeforeLog.value.amount);
    console.log("Trader Quote:", traderQuoteBeforeLog.value.amount);
    console.log("Asker Base:", askerBaseBeforeLog.value.amount);
    console.log("Asker Quote:", askerQuoteBeforeLog.value.amount);

    // Call match_orders with remaining_accounts
    const matchTx = await program.methods
      .matchOrder()
      .accountsPartial({
        cranker: cranker.publicKey,
        baseMint: base_mint,
        quoteMint: quote_mint,
        baseMintVault: base_mint_valut,
        quoteMintVault: quote_mint_valut,
        market: marketPda,
        orderBook: orderBookPda,
        feeCollector: feeCollectorAta.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts([
        {
          pubkey: trader_base_mint_acc,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: askerQuoteAta.address,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: crankerQuoteAta.address,
          isSigner: false,
          isWritable: true,
        },
      ])
      .signers([cranker])
      .rpc();

    console.log("Match transaction:", matchTx);

    // Get orderbook after match
    const orderBookAfter = await program.account.orderBook.fetch(orderBookPda);
    console.log("Bids after match:", orderBookAfter.bids.length);
    console.log("Asks after match:", orderBookAfter.asks.length);

    // Debug: Trace all balances AFTER
    const vaultBaseAfter = await provider.connection.getTokenAccountBalance(
      base_mint_valut
    );
    const vaultQuoteAfter = await provider.connection.getTokenAccountBalance(
      quote_mint_valut
    );
    const traderBaseAfterLog = await provider.connection.getTokenAccountBalance(
      trader_base_mint_acc
    );
    const traderQuoteAfterLog =
      await provider.connection.getTokenAccountBalance(trader_quote_mint_acc);
    const askerBaseAfterLog = await provider.connection.getTokenAccountBalance(
      askerBaseAta.address
    );
    const askerQuoteAfterLog = await provider.connection.getTokenAccountBalance(
      askerQuoteAta.address
    );

    console.log("--- AFTER MATCH ---");
    console.log("Vault Base:", vaultBaseAfter.value.amount);
    console.log("Vault Quote:", vaultQuoteAfter.value.amount);
    console.log("Trader Base:", traderBaseAfterLog.value.amount);
    console.log("Trader Quote:", traderQuoteAfterLog.value.amount);
    console.log("Asker Base:", askerBaseAfterLog.value.amount);
    console.log("Asker Quote:", askerQuoteAfterLog.value.amount);

    // Assertions:
    // 1. Bid count should decrease by 1 (our matched bid removed)
    assert.equal(
      orderBookAfter.bids.length,
      orderBookBefore.bids.length - 1,
      "One bid should be removed after full fill"
    );
    // 2. Ask should be removed (we only had 1 ask, now 0)
    assert.equal(
      orderBookAfter.asks.length,
      orderBookBefore.asks.length - 1,
      "Ask should be removed after full fill"
    );

    // 2. Trader (bidder) should receive 5 base tokens
    const traderBaseAfter = await provider.connection.getTokenAccountBalance(
      trader_base_mint_acc
    );
    console.log("Trader Base Before:", traderBaseBefore.value.amount);
    console.log("Trader Base After:", traderBaseAfter.value.amount);

    assert.equal(
      Number(traderBaseAfter.value.amount),
      Number(traderBaseBefore.value.amount) + 5,
      "Bidder should receive base tokens"
    );

    // 3. Asker should receive quote tokens (price 10 * amount 5 = 50) minus fee
    const askerQuoteAfter = await provider.connection.getTokenAccountBalance(
      askerQuoteAta.address
    );
    const expectedQuote = 50; // 50 quote tokens
    const feeBps = 30; // 0.3%
    // Use integer math to match program
    const expectedFee = Math.floor((expectedQuote * feeBps) / 10000); // = 0
    const askerFee = Math.floor(expectedFee / 2); // = 0

    console.log("Asker Quote Before:", askerQuoteBefore.value.amount);
    console.log("Asker Quote After:", askerQuoteAfter.value.amount);

    assert.equal(
      Number(askerQuoteAfter.value.amount),
      Number(askerQuoteBefore.value.amount) + expectedQuote - askerFee,
      "Asker should receive quote tokens minus fee"
    );

    // 4. Cranker should receive fee reward (10% of total fee)
    const crankerQuoteAfter = await provider.connection.getTokenAccountBalance(
      crankerQuoteAta.address
    );
    const crankerReward = Math.floor(expectedFee / 10); // = 0

    assert.equal(
      Number(crankerQuoteAfter.value.amount),
      crankerReward,
      "Cranker should receive 10% fee reward"
    );

    // 5. Market creator should receive remaining fee (90%)
    const feeCollectorBefore = await provider.connection.getTokenAccountBalance(
      feeCollectorAta.address
    );
    const feeCollectorAfter = await provider.connection.getTokenAccountBalance(
      feeCollectorAta.address
    );
    const marketCreatorFee = expectedFee - crankerReward; // = 0

    assert.equal(
      Number(feeCollectorAfter.value.amount),
      Number(feeCollectorBefore.value.amount) + marketCreatorFee,
      "Market creator should receive 90% of fee"
    );
  });
});
