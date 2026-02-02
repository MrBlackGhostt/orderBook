# OpenDEX - Permissionless Order Book DEX

A fully on-chain order book DEX on Solana that allows **anyone** to create trading pairs without permission. Built with Anchor framework featuring limit orders, order matching, and a modern Next.js frontend with **one-click token creation**.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://solscan.io/account/Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg?cluster=devnet)
[![Anchor](https://img.shields.io/badge/Anchor-0.30+-663399)](https://www.anchor-lang.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)

> **🚀 Try it now!** No CLI required - create tokens and markets directly in the browser.

## ✨ Features

### Core Trading Features
- **Permissionless Market Creation** - Create trading pairs in 2 clicks (no CLI required!)
- **One-Click Token Creation** - Auto-generate BASE and QUOTE tokens with mint authority
- **Limit Order Book** - Place limit buy/sell orders with custom prices
- **Automated Order Matching** - Permissionless cranking mechanism with economic incentives
- **Fee System** - Split fees between traders, crankers (10%), and market creators (90%)

### Modern UX Features
- **Token Balance Display** - Real-time balance tracking in header
- **One-Click Token Airdrop** - Mint test tokens instantly (if you're mint authority)
- **Step-by-Step Onboarding** - Clear visual flow for new users
- **Network Warnings** - Prominent DEVNET badges to prevent confusion
- **Professional UI** - Tailwind CSS with dark mode, responsive design

### Developer Features
- **Full Documentation** - Comprehensive guides for all features
- **Helper Scripts** - Automated token minting and setup scripts
- **Social Integration** - Links to developer Twitter and GitHub
- **Solscan Integration** - Direct links to view tokens and transactions

## 🎯 Quick Start for Users

**No CLI knowledge required!** Try the DEX in 3 clicks:

1. **Connect Wallet** → Use Phantom or Solflare
2. **Create Market** → Click "Create Token Pair" → Auto-fills form → Create Market
3. **Trade** → Click "Get Test Tokens" → Start trading!

**Total time: ~2 minutes** ⏱️

## 🛠️ Tech Stack

- **Blockchain:** Solana (Anchor Framework 0.30+)
- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Wallet:** Solana Wallet Adapter
- **State Management:** React Hooks
- **Icons:** Lucide React

## 📦 Deployment Info

**Program ID (Devnet):** `Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg`

**View on Solscan:** [Program Explorer](https://solscan.io/account/Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg?cluster=devnet)

## 🚀 Getting Started (Developers)

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor (0.30+)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Node.js (v18+)
# Use nvm or download from nodejs.org
```

### Build & Test Smart Contract

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
solana config set --url devnet
anchor deploy
```

### Run Frontend Locally

```bash
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app!

### Mint Tokens to a Specific Wallet

```bash
# Use the helper script
./scripts/mint-to-wallet.sh YOUR_WALLET_ADDRESS 1000 10000

# Or manually
spl-token mint BASE_MINT 1000 YOUR_WALLET --fund-recipient
spl-token mint QUOTE_MINT 10000 YOUR_WALLET --fund-recipient
```

## 📁 Project Structure

```
orderbook-dex/
├── programs/
│   └── orderbook-dex/
│       └── src/
│           ├── lib.rs                    # Program entry point
│           ├── states.rs                 # Account structures
│           ├── errors.rs                 # Custom errors
│           └── instructions/
│               ├── create_market.rs      # Market creation
│               ├── place_order.rs        # Order placement
│               ├── cancel_order.rs       # Order cancellation
│               └── match_orders.rs       # Matching engine
├── tests/
│   └── orderbook-dex.ts                  # Integration tests
├── app/                                  # Next.js frontend
│   ├── app/
│   │   ├── page.tsx                      # Market list
│   │   ├── create/page.tsx               # Create market (with token creation!)
│   │   └── trade/[marketId]/page.tsx     # Trading interface
│   ├── components/
│   │   ├── TokenBalances.tsx             # Balance display
│   │   ├── AirdropButton.tsx             # One-click token minting
│   │   ├── TradePanel.tsx                # Order placement
│   │   ├── OrderBook.tsx                 # Order book display
│   │   ├── Footer.tsx                    # Site footer
│   │   └── NetworkBanner.tsx             # Devnet warning
│   ├── hooks/
│   │   ├── useProgram.ts                 # Anchor program hook
│   │   ├── useMarket.ts                  # Market data hook
│   │   └── useOrderBook.ts               # Order book hook
│   └── lib/
│       ├── tokenCreation.ts              # Token creation utilities
│       ├── constants.ts                  # Config and helpers
│       └── idl.ts                        # Program IDL
├── scripts/
│   ├── mint-to-wallet.sh                 # Batch mint tokens
│   └── airdrop-tokens.ts                 # Airdrop helper
├── Anchor.toml                           # Anchor configuration
└── Cargo.toml                            # Rust workspace
```

## 🎨 Architecture Overview

### Smart Contract (Anchor/Rust)

**Core Instructions:**
- `create_market` - Initialize a new trading pair
- `place_order` - Place limit buy/sell orders
- `cancel_order` - Cancel pending orders with refunds
- `match_orders` - Permissionless crank to execute matching trades

**Key Features:**
- Price-priority matching (bids: highest first, asks: lowest first)
- Partial and full fill support
- Dynamic account resolution using remaining accounts pattern
- PDA-based vault system for secure asset custody
- Cranker incentives (10% of fees)
- Market creator revenue (90% of fees)

### Frontend Features

**Pages:**
- **Market List** - Browse all created markets
- **Create Market** - Two-step token + market creation
- **Trading** - Full order book with trade panel

**Components:**
- Token balance display (compact header mode)
- One-click token airdrop button
- Order book visualization
- Trade panel (buy/sell)
- My orders management
- Crank button for matching

## 🔑 Key Technical Patterns

### Solana/Anchor Patterns
- **PDA Architecture** - Program Derived Addresses for markets and order books
- **Remaining Accounts Pattern** - Dynamic account resolution for trader ATAs
- **Token Program CPIs** - Cross-program invocations for token transfers
- **PDA Signing** - Using PDAs as vault authority for secure transfers
- **Partial Transaction Signing** - Multi-signature transactions for token creation

### DeFi/Trading Patterns
- **Order Book Data Structure** - Efficient Vec-based order storage
- **Price-Time Priority** - Proper order sorting and matching
- **Fee Distribution** - Economic incentives for decentralized cranking
- **Partial Fill Handling** - Support for partial order execution

### Frontend Patterns
- **Wallet Adapter Integration** - Seamless wallet connection
- **Real-time Balance Updates** - Auto-refresh every 10 seconds
- **Transaction State Management** - Loading, success, error states
- **Responsive Design** - Mobile-friendly layout

## 🧪 Testing

Comprehensive test coverage including:
- Market creation and initialization
- Order placement (bid and ask)
- Stress testing (50 orders per side)
- Order cancellation with refund verification
- Order matching (full fills, partial fills, multiple matches)
- Fee calculation and distribution

Run tests:
```bash
anchor test
```

## 🔐 Security Considerations

- **Signer Validation** - All critical operations require proper signer accounts
- **PDA Authority** - Vaults controlled by PDAs to prevent unauthorized access
- **Account Validation** - Proper ATA and account ownership checks
- **Integer Math** - Careful handling of token decimals to prevent overflow
- **Devnet Only** - Clear warnings that this is a test environment

## 📚 Documentation

- **[AIRDROP_GUIDE.md](AIRDROP_GUIDE.md)** - How to get test tokens
- **[HOW_TO_MINT_TOKENS.md](HOW_TO_MINT_TOKENS.md)** - Token minting guide
- **[TOKEN_CREATION_COMPLETE.md](TOKEN_CREATION_COMPLETE.md)** - One-click token creation feature
- **[UX_IMPROVEMENTS.md](UX_IMPROVEMENTS.md)** - UI/UX enhancement details
- **[LAYOUT_IMPROVEMENTS.md](LAYOUT_IMPROVEMENTS.md)** - Layout fix documentation
- **[AIRDROP_BUTTON_GUIDE.md](AIRDROP_BUTTON_GUIDE.md)** - Airdrop button usage

## ⚠️ Known Limitations

- Maximum 50 orders per side (configurable via `MAX_ORDERS` const)
- Match orders must be called manually (permissionless but not automatic)
- No advanced order types (only limit orders currently)
- No order modification (must cancel and re-place)
- Devnet only (not production-ready for mainnet)

## 🚧 Future Enhancements

**Trading Features:**
- [ ] Automated cranking bot
- [ ] Stop-loss and take-profit orders
- [ ] Order modification without cancel
- [ ] Market orders (instant execution)

**UI/UX Features:**
- [ ] Historical price charts (TradingView integration)
- [ ] Trade history and analytics
- [ ] Order book depth visualization
- [ ] Mobile app (React Native)

**Infrastructure:**
- [ ] Backend faucet service
- [ ] WebSocket real-time updates
- [ ] Mainnet deployment
- [ ] Token metadata support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Developer

Built by [@HKsoldev](https://x.com/HKsoldev)

- **Twitter/X:** [@HKsoldev](https://x.com/HKsoldev)
- **GitHub:** [@MrBlackGhostt](https://github.com/MrBlackGhostt)
- **Repository:** [orderBook](https://github.com/MrBlackGhostt/orderBook)

## 🙏 Acknowledgments

Built as part of a 40-day Solana developer sprint, targeting roles at:
- Helius, Anza, Jito, Ellipsis Labs, Drift Protocol

**Special thanks to:**
- Solana Foundation for excellent documentation
- Anchor framework team for the amazing developer experience
- Solana community for support and resources

---

**⚡ Built with Solana | 🦀 Powered by Rust | ⚛️ UI with React**

*For questions, feedback, or collaboration opportunities, reach out via [GitHub Issues](https://github.com/MrBlackGhostt/orderBook/issues) or [Twitter](https://x.com/HKsoldev).*
