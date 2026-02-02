import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export const PROGRAM_ID = new PublicKey(
  "Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg"
);

// export const CLUSTER = "http://localhost:8899"; // localnet
export const CLUSTER = "https://api.devnet.solana.com"; // devnet

export const BASE_DECIMALS = 9;
export const QUOTE_DECIMALS = 6;

// Convert display amount to raw units (returns BN for Anchor)
export const toRawAmount = (amount: number, decimals: number): BN => {
  return new BN(Math.floor(amount * Math.pow(10, decimals)));
};

// Convert raw units to display amount
export const fromRawAmount = (
  amount: BN | bigint | string,
  decimals: number
): number => {
  const num =
    typeof amount === "bigint"
      ? Number(amount)
      : new BN(amount.toString()).toNumber();
  return num / Math.pow(10, decimals);
};

// PDA derivation helpers
export const getMarketPda = (
  baseMint: PublicKey,
  quoteMint: PublicKey
): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), baseMint.toBuffer(), quoteMint.toBuffer()],
    PROGRAM_ID
  );
  return pda;
};

export const getOrderBookPda = (market: PublicKey): PublicKey => {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market_orderBook"), market.toBuffer()],
    PROGRAM_ID
  );
  return pda;
};
