"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress } from "viem";
import Header from "../../components/Header";
import { AccessConsent } from "../../constants";

export default function GrantAccessPage() {
  const [targetAddress, setTargetAddress] = useState("");
  const [grantedTo, setGrantedTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  /* -------- Grant Access -------- */
  const handleGrantAccess = () => {
    setError(null);
    setGrantedTo(null);

    if (!isAddress(targetAddress)) {
      setError("Invalid Ethereum address");
      return;
    }

    writeContract({
      address: AccessConsent.address,
      abi: AccessConsent.abi,
      functionName: "grantAccess",
      args: [targetAddress as `0x${string}`],
    });
  };

  /* -------- On success -------- */
  useEffect(() => {
    if (!isSuccess) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrantedTo(targetAddress);
    setTargetAddress(""); // reset for next grant
  }, [isSuccess, targetAddress]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-xl mx-auto mt-16 bg-white p-8 rounded-xl shadow space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Grant Access
        </h1>

        <input
          type="text"
          placeholder="0xRecipientAddress"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={handleGrantAccess}
          disabled={isPending || isConfirming}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded disabled:opacity-50"
        >
          {isPending
            ? "Waiting for Wallet..."
            : isConfirming
            ? "Granting Access..."
            : "Grant Access"}
        </button>

        {/* Error message */}
        {error && (
          <p className="text-red-600 font-medium">
            ❌ {error}
          </p>
        )}

        {/* Success message */}
        {grantedTo && (
          <p className="text-green-600 font-medium">
            ✅ Access granted to {grantedTo}
          </p>
        )}
      </main>
    </div>
  );
}
