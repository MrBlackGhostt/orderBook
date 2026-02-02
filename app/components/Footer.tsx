"use client";

import Link from "next/link";
import { Github, Twitter, ExternalLink, Code } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">LimitDEX</h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-3">
              On-chain limit order trading on Solana. Create trading pairs,
              place limit orders, and trade with full on-chain transparency.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-600/20 border border-orange-600/50 rounded text-orange-400 text-xs font-medium">
                DEVNET DEMO
              </span>
              <span className="text-gray-500 text-xs">
                For testing purposes only
              </span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Markets
                </Link>
              </li>
              <li>
                <Link
                  href="/create"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Create Market
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/MrBlackGhostt/orderBook/blob/main/AIRDROP_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
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
                  className="text-gray-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
                >
                  Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Developer */}
          <div>
            <h3 className="text-white font-semibold mb-3">Developer</h3>
            <p className="text-gray-400 text-sm mb-3">
              Built by <span className="text-purple-400 font-medium">@HKsoldev</span>
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/HKsoldev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white text-sm transition-colors"
              >
                <Twitter className="w-4 h-4" />
                <span>Twitter</span>
              </a>
              <a
                href="https://github.com/MrBlackGhostt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white text-sm transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </div>
            <a
              href="https://github.com/MrBlackGhostt/orderBook"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 text-gray-400 hover:text-purple-400 text-sm transition-colors"
            >
              <Code className="w-4 h-4" />
              <span>View Source Code</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 LimitDEX. Built with Anchor on Solana.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <a
                href={`https://solscan.io/account/Gvv7atyen9oY1TccNVDb76btjUKwXi6bgmhQZDnaryGg?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition-colors inline-flex items-center gap-1"
              >
                Program on Solscan
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <span className="font-mono">Devnet</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
