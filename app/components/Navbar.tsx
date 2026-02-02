"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Github, Twitter } from "lucide-react";

export function Navbar() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering wallet button on client
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="border-b border-[#1e1e2e] bg-[#12121a]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-lg font-semibold text-white tracking-tight">
                OrderBook
              </Link>
              <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-[10px] font-medium uppercase tracking-wider">
                Devnet
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="text-zinc-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md text-sm transition-colors"
              >
                Markets
              </Link>
              <Link
                href="/create"
                className="text-zinc-400 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-md text-sm transition-colors"
              >
                Create
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1">
              <a
                href="https://x.com/HKsoldev"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                title="Follow on X/Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/MrBlackGhostt"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                title="GitHub Profile"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>

            {mounted && connected && (
              <div className="hidden lg:flex items-center gap-1.5 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-zinc-400">Connected</span>
              </div>
            )}
            {mounted ? (
              <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !rounded-lg !h-9 !text-sm !font-medium" />
            ) : (
              <div className="h-9 w-32 bg-blue-600/50 rounded-lg animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
