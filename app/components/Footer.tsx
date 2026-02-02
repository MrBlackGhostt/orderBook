"use client";

import Link from "next/link";
import { Github, Twitter, ExternalLink, Code } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#1e1e2e] bg-[#0a0a0f] mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">OpenDEX</h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-3">
              A permissionless order book DEX on Solana. Create trading pairs,
              place limit orders, and trade with full on-chain transparency.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-[10px] font-medium uppercase tracking-wider">
                Devnet
              </span>
              <span className="text-zinc-600 text-[10px]">
                For testing only
              </span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-zinc-500 hover:text-white text-xs transition-colors"
                >
                  Markets
                </Link>
              </li>
              <li>
                <Link
                  href="/create"
                  className="text-zinc-500 hover:text-white text-xs transition-colors"
                >
                  Create Market
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/MrBlackGhostt/orderBook/blob/main/AIRDROP_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-white text-xs transition-colors inline-flex items-center gap-1"
                >
                  Get Test Tokens
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/MrBlackGhostt/orderBook/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-white text-xs transition-colors inline-flex items-center gap-1"
                >
                  Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Developer */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">Developer</h3>
            <p className="text-zinc-500 text-xs mb-3">
              Built by <span className="text-blue-400">@HKsoldev</span>
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://x.com/HKsoldev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e1e2e] hover:bg-[#27272f] rounded-md text-zinc-400 hover:text-white text-xs transition-colors"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span>Twitter</span>
              </a>
              <a
                href="https://github.com/MrBlackGhostt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e1e2e] hover:bg-[#27272f] rounded-md text-zinc-400 hover:text-white text-xs transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            </div>
            <a
              href="https://github.com/MrBlackGhostt/orderBook"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-1.5 text-zinc-500 hover:text-blue-400 text-xs transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              <span>View Source Code</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1e1e2e] mt-8 pt-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-zinc-600 text-xs">
              2026 OpenDEX. Built with Anchor on Solana.
            </p>
            <div className="flex items-center gap-3 text-[10px] text-zinc-600">
              <a
                href={`https://solscan.io/account/Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-400 transition-colors inline-flex items-center gap-1"
              >
                Program on Solscan
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-zinc-700">|</span>
              <span className="font-mono text-zinc-500">Devnet</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
