# Token Airdrop Guide for Testing

This guide helps you get test tokens for trading on the DEX.

## Quick Start: Get Test Tokens

### Option 1: Use the Airdrop Script (Recommended)

1. **Connect your wallet** to the app and copy your wallet address
2. **Run the airdrop script:**

```bash
cd scripts
npx ts-node airdrop-tokens.ts <YOUR_WALLET_ADDRESS>
```

3. **Copy the commands** shown in the output and run them in your terminal

### Option 2: Manual Airdrop (Using spl-token CLI)

#### Step 1: Get the Token Addresses

- **Base Token (9 decimals):** `DeRQ3edcNvwH8XjEVtFiqLN8uiABcojbyjxhcE5LLj8x`
- **Quote Token (6 decimals):** `D3VykNoT3ne9Rkn6tSy7ssGvhSq3NGN7mWtqQss4jADM`

#### Step 2: Create Token Accounts (if needed)

```bash
# Create account for Base token
spl-token create-account DeRQ3edcNvwH8XjEVtFiqLN8uiABcojbyjxhcE5LLj8x

# Create account for Quote token
spl-token create-account D3VykNoT3ne9Rkn6tSy7ssGvhSq3NGN7mWtqQss4jADM
```

#### Step 3: Mint Tokens to Your Account

**Note:** You need to be the **mint authority** to mint tokens. If you're not the mint authority, contact the market creator.

```bash
# Mint 1000 Base tokens (9 decimals)
spl-token mint DeRQ3edcNvwH8XjEVtFiqLN8uiABcojbyjxhcE5LLj8x 1000

# Mint 10000 Quote tokens (6 decimals)
spl-token mint D3VykNoT3ne9Rkn6tSy7ssGvhSq3NGN7mWtqQss4jADM 10000
```

#### Step 4: Check Your Balance

```bash
# Check Base token balance
spl-token balance DeRQ3edcNvwH8XjEVtFiqLN8uiABcojbyjxhcE5LLj8x

# Check Quote token balance
spl-token balance D3VykNoT3ne9Rkn6tSy7ssGvhSq3NGN7mWtqQss4jADM
```

## For Demo/CEO Presentations

If you're demoing this to potential users or investors, here's the best UX flow:

### Option A: Pre-funded Demo Wallets

1. Create 2-3 demo wallet keypairs
2. Fund them with test tokens ahead of time
3. Import them into Phantom/Solflare for the demo
4. Show smooth trading without setup friction

```bash
# Create demo wallet
solana-keygen new -o demo-wallet-1.json

# Airdrop SOL for transaction fees
solana airdrop 2 <DEMO_WALLET_ADDRESS> --url devnet

# Follow steps above to mint tokens
```

### Option B: Faucet Page (Future Enhancement)

For a production-ready demo, consider building a simple faucet page:

```typescript
// app/faucet/page.tsx
// Users click "Get Test Tokens" button
// Backend service with mint authority airdrops tokens
// Much better UX than manual CLI commands
```

## Troubleshooting

### "Error: Insufficient funds"

- **Cause:** You don't have enough tokens in your wallet
- **Solution:** Follow the airdrop steps above

### "Error: Account not found"

- **Cause:** Token account (ATA) doesn't exist
- **Solution:** Run `spl-token create-account <MINT_ADDRESS>` first

### "Error: Invalid mint authority"

- **Cause:** You're not the mint authority
- **Solution:** Contact the market creator or use a different wallet

### Balance shows 0 after airdrop

- **Solution:** Click the refresh button or wait 5-10 seconds for the UI to update

## Production Recommendations

For a professional demo or mainnet deployment:

1. **Build a faucet service** - Backend API that airdrops small amounts
2. **Welcome modal** - Detect new users and offer auto-airdrop
3. **Better error messages** - Show "Get Tokens" button instead of raw errors
4. **Demo mode** - Allow users to try without connecting wallet

## Contact

For issues or questions about getting test tokens, please open an issue on GitHub.
