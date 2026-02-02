#!/bin/bash

# Script to mint tokens to a specific wallet
# Usage: ./mint-to-wallet.sh [WALLET_ADDRESS] [BASE_AMOUNT] [QUOTE_AMOUNT]

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
RECIPIENT="${1:-BpXDRDojQWcP2njqKSLdTstwPgfQkqLzaEctkXVeb9hL}"
BASE_AMOUNT="${2:-1000}"
QUOTE_AMOUNT="${3:-10000}"

# Token mints (from your deployment)
BASE_MINT="DeRQ3edcNvwH8XjEVtFiqLN8uiABcojbyjxhcE5LLj8x"
QUOTE_MINT="D3VykNoT3ne9Rkn6tSy7ssGvhSq3NGN7mWtqQss4jADM"

echo -e "${YELLOW}🚀 Token Airdrop Script${NC}"
echo "================================"
echo "Recipient: $RECIPIENT"
echo "BASE Amount: $BASE_AMOUNT"
echo "QUOTE Amount: $QUOTE_AMOUNT"
echo "================================"
echo ""

# Ensure we're on devnet
echo -e "${YELLOW}📡 Switching to devnet...${NC}"
solana config set --url devnet

# Check current wallet
CURRENT_WALLET=$(solana address)
echo -e "${GREEN}✓ Using wallet: $CURRENT_WALLET${NC}"

# Check SOL balance
BALANCE=$(solana balance | awk '{print $1}')
echo -e "${GREEN}✓ SOL Balance: $BALANCE${NC}"

if (( $(echo "$BALANCE < 0.01" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Low SOL balance, requesting airdrop...${NC}"
    solana airdrop 2
fi

echo ""
echo -e "${YELLOW}📦 Minting BASE tokens...${NC}"

# Mint BASE tokens
if spl-token mint $BASE_MINT $BASE_AMOUNT $RECIPIENT --fund-recipient 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully minted $BASE_AMOUNT BASE tokens${NC}"
else
    echo -e "${RED}✗ Failed to mint BASE tokens${NC}"
    echo "   Possible reasons:"
    echo "   - You are not the mint authority"
    echo "   - Network error"
    exit 1
fi

echo ""
echo -e "${YELLOW}📦 Minting QUOTE tokens...${NC}"

# Mint QUOTE tokens
if spl-token mint $QUOTE_MINT $QUOTE_AMOUNT $RECIPIENT --fund-recipient 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully minted $QUOTE_AMOUNT QUOTE tokens${NC}"
else
    echo -e "${RED}✗ Failed to mint QUOTE tokens${NC}"
    echo "   Possible reasons:"
    echo "   - You are not the mint authority"
    echo "   - Network error"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Airdrop complete!${NC}"
echo ""
echo -e "${YELLOW}📊 Checking balances...${NC}"

# Check balances
BASE_BALANCE=$(spl-token balance $BASE_MINT --owner $RECIPIENT 2>/dev/null || echo "N/A")
QUOTE_BALANCE=$(spl-token balance $QUOTE_MINT --owner $RECIPIENT 2>/dev/null || echo "N/A")

echo "BASE balance:  $BASE_BALANCE"
echo "QUOTE balance: $QUOTE_BALANCE"

echo ""
echo -e "${GREEN}✓ All done! The wallet can now trade on your DEX.${NC}"

# Show Solscan links
echo ""
echo "🔗 View on Solscan:"
echo "Wallet: https://solscan.io/account/$RECIPIENT?cluster=devnet"
