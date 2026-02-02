"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { IDL, OrderbookDex } from "@/lib/idl";
import { PROGRAM_ID } from "@/lib/constants";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      AnchorProvider.defaultOptions()
    );

    return new Program<OrderbookDex>(IDL, provider);
  }, [connection, wallet]);

  return { program, programId: PROGRAM_ID };
}
