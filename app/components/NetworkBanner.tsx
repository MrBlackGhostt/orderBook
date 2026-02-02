"use client";

import { AlertCircle } from "lucide-react";

export function NetworkBanner() {
  return (
    <div className="bg-orange-600/10 border-b border-orange-600/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-orange-400" />
          <span className="text-orange-300">
            <span className="font-semibold">Devnet Mode:</span> This is a demo
            on Solana Devnet. Use test tokens only.
          </span>
          <a
            href="https://github.com/MrBlackGhostt/orderBook/blob/main/AIRDROP_GUIDE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-200 hover:text-orange-100 underline ml-2"
          >
            Get test tokens →
          </a>
        </div>
      </div>
    </div>
  );
}
