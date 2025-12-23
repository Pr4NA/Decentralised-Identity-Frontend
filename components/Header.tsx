"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount} from "wagmi";

export default function Header() {
  const { isConnected } = useAccount();

  return (
    <nav className="flex items-center justify-between px-8 py-5 bg-white shadow-md">
      {/* Left */}
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-bold text-indigo-600">
          Decentralized ID
        </h1>

        {/* Always visible */}
        <Link
          href="/"
          className="text-gray-700 font-medium hover:text-indigo-600 transition"
        >
          Home
        </Link>

          {isConnected && (
            <>
              <Link
                href="/grant-access"
                className="text-gray-700 font-medium hover:text-indigo-600 transition"
              >
                Grant Access
              </Link>

              <Link
                href="/verify"
                className="text-gray-700 font-medium hover:text-indigo-600 transition"
              >
                Verify
              </Link>
            </>
          )}
      </div>

      {/* Right */}
      <ConnectButton />
    </nav>
  );
}
