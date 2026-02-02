"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Navbar() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering wallet button on client
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-white">
              OrderBook DEX
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white px-3 py-2 text-sm"
              >
                Markets
              </Link>
              <Link
                href="/create"
                className="text-gray-300 hover:text-white px-3 py-2 text-sm"
              >
                Create Market
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {mounted && connected && (
              <span className="text-green-400 text-sm">Connected</span>
            )}
            {mounted ? (
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
            ) : (
              <div className="h-10 w-32 bg-purple-600 rounded-lg animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
