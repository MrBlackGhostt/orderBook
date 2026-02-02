"use client";

import { AlertCircle } from "lucide-react";

export function NetworkBanner() {
  return (
    <div className="bg-amber-500/5 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
        <div className="flex items-center justify-center gap-2 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-amber-200/80">
            Devnet Demo - Use test tokens only
          </span>
          <span className="text-zinc-600">|</span>
          <a
            href="https://github.com/MrBlackGhostt/orderBook/blob/main/AIRDROP_GUIDE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            Get test tokens
          </a>
        </div>
      </div>
    </div>
  );
}
