# OpenDEX - Permissionless Order Book DEX

A fully on-chain order book DEX on Solana that allows **anyone** to create trading pairs without permission. Built with Anchor framework featuring limit orders, order matching, and a Next.js frontend.

## Features

- **Permissionless Market Creation** - Any user can create trading pairs for any SPL token pair
- **Limit Order Book** - Place limit buy/sell orders with custom prices
- **Automated Order Matching** - Permissionless cranking mechanism with economic incentives
- **Fee System** - 50/50 fee split between traders, with cranker rewards (10%) and market creator revenue (90%)
- **Modern Frontend** - Next.js + Solana wallet adapter integration

## Architecture

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

### Frontend (Next.js)

- Market directory with all trading pairs
- Create market interface
- Order book visualization
- Trade panel for placing/canceling orders
- My Orders management

## Tech Stack

- **Blockchain:** Solana (Anchor Framework)
- **Frontend:** Next.js 15, React, TypeScript
- **Styling:** Tailwind CSS
- **Wallet:** Solana Wallet Adapter

## Deployment

**Program ID (Devnet):** `Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg`

**Test Tokens:**
- Base Token (9 decimals): `DeRQ3edcNvwH8XjEVtFiqLN8uiABcojbyjxhcE5LLj8x`
- Quote Token (6 decimals): `D3VykNoT3ne9Rkn6tSy7ssGvhSq3NGN7mWtqQss4jADM`

## Getting Started

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

### Run Frontend

```bash
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

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
│   ├── app/                              # App router pages
│   ├── components/                       # React components
│   ├── hooks/                            # Custom hooks
│   └── lib/                              # Utilities & IDL
├── Anchor.toml                           # Anchor configuration
└── Cargo.toml                            # Rust workspace
```

## Key Patterns Demonstrated

### Solana/Anchor Patterns
- **PDA Architecture** - Program Derived Addresses for market and orderbook accounts
- **Remaining Accounts Pattern** - Dynamic account resolution for trader token accounts
- **Token Program CPIs** - Cross-program invocations for token transfers
- **PDA Signing** - Using PDAs as vault authority for secure transfers

### DeFi/Trading Patterns
- **Order Book Data Structure** - Efficient Vec-based order storage
- **Price-Time Priority** - Proper order sorting and matching
- **Fee Distribution** - Economic incentives for decentralized cranking
- **Partial Fill Handling** - Support for partial order execution

### Advanced Rust/Anchor
- **Lifetime Management** - Complex Context lifetimes with remaining_accounts
- **Vector Manipulation** - Sorting, filtering, retaining orders
- **Error Handling** - Custom error types for better debugging
- **Account Constraints** - Proper validation and security checks

## Testing

The project includes comprehensive tests covering:
- Market creation and initialization
- Order placement (bid and ask)
- Stress testing (50 orders per side)
- Order cancellation with refund verification
- Order matching (full fills, partial fills, multiple matches)
- Fee calculation and distribution

Run tests with:
```bash
anchor test
```

## Security Considerations

- **Signer Validation** - All critical operations require proper signer accounts
- **PDA Authority** - Vaults are controlled by PDAs to prevent unauthorized access
- **Account Validation** - Proper ATA and account ownership checks
- **Integer Math** - Careful handling of token decimals to prevent overflow

## Known Limitations

- Maximum 50 orders per side (configurable via `MAX_ORDERS` const)
- Match orders must be called manually (permissionless but not automatic)
- No advanced order types (only limit orders currently)
- No order modification (must cancel and re-place)

## Future Enhancements

- [ ] Automated cranking incentives
- [ ] Stop-loss and take-profit orders
- [ ] Order modification without cancel
- [ ] Historical price charts
- [ ] Trade history and analytics
- [ ] Mobile-responsive UI improvements

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

Built as part of the 40-day Solana developer sprint. For questions or collaborations, reach out via GitHub issues.
