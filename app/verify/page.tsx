"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { isAddress } from "viem";
import Header from "../../components/Header";
import { CredentialRegistry,AccessConsent } from "../../constants";

/* ---------- Types ---------- */

interface CredentialDocument {
  name: string;
  collegeName: string;
  passingYear: number;
  degree: string;
  branch: string;
}

interface OnChainCredential {
  credentialHash: string;
  issuer: `0x${string}`;
  subject: `0x${string}`;
  revoked: boolean;
  issuedAt: bigint;
}

/* ---------- Component ---------- */

export default function VerifyPage() {
  const { address: verifier } = useAccount();

  const [subjectAddress, setSubjectAddress] = useState("");
  const [canVerify, setCanVerify] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [credentialDoc, setCredentialDoc] =
    useState<CredentialDocument | null>(null);
  const [issuer, setIssuer] = useState<`0x${string}` | null>(null);
  const [verifiedSubject, setVerifiedSubject] = useState<`0x${string}` | null>(null);




  /* -------- Check Access -------- */
  const { data: hasAccess, isFetching } = useReadContract({
  address: AccessConsent.address,
  abi: AccessConsent.abi,
  functionName: "hasAccess",
  args: verifiedSubject ? [verifiedSubject, verifier!] : undefined,
  query: {
    enabled: !!verifiedSubject,
  },
});


  useEffect(() => {
    console.log("hasAccess called, result:", hasAccess);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hasAccess === false) setCanVerify(false);
    if (hasAccess === true) setCanVerify(true);
  }, [hasAccess]);

  /* -------- Get Credentials -------- */
  const { data: credentialHashes } = useReadContract({
    address: CredentialRegistry.address,
    abi: CredentialRegistry.abi,
    functionName: "getCredentialsBySubject",
    args: canVerify ? [subjectAddress] : undefined,
    query: { enabled: canVerify === true },
  }) as { data?: readonly string[] };

  const firstHash = credentialHashes?.[0];

  /* -------- Get On-chain Credential -------- */
  const { data: onChainCredential } = useReadContract({
    address: CredentialRegistry.address,
    abi: CredentialRegistry.abi,
    functionName: "getCredential",
    args: firstHash ? [firstHash] : undefined,
    query: { enabled: !!firstHash },
  }) as { data?: OnChainCredential };

  /* -------- Fetch Credential from IPFS -------- */
  useEffect(() => {
    if (!onChainCredential || onChainCredential.revoked) return;

    const fetchCredential = async () => {
      const res = await fetch(
        `https://ipfs.io/ipfs/${onChainCredential.credentialHash}`
      );
      const json: CredentialDocument = await res.json();

      setCredentialDoc(json);
      setIssuer(onChainCredential.issuer);
    };

    fetchCredential();
  }, [onChainCredential]);

  /* -------- Verify Button -------- */
  const handleVerify = () => {
    setError(null);
    setCanVerify(null);
    setCredentialDoc(null);
    setIssuer(null);

    if (!isAddress(subjectAddress)) {
      setError("Invalid address");
      return;
    }
    if (!verifier) {
        setError("Wallet not connected");
        return;
    }

    // ✅ Freeze a VALID address for wagmi
    setVerifiedSubject(subjectAddress);
  };

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-xl mx-auto mt-16 bg-white p-8 rounded-xl shadow space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Verify Credential
        </h1>

        <input
          type="text"
          placeholder="Student Address"
          value={subjectAddress}
          onChange={(e) => setSubjectAddress(e.target.value)}
          className="w-full p-3 border rounded focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={handleVerify}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded"
        >
          Verify
        </button>

        {/* Error */}
        {error && <p className="text-red-600">❌ {error}</p>}

        {/* No Access */}
        {canVerify === false && (
          <p className="text-yellow-600 font-medium">
            ⚠️ Please ask the student for access
          </p>
        )}

        {/* Credential Display */}
        {canVerify === true && credentialDoc && issuer && (
          <div className="bg-gray-50 p-6 rounded-xl border space-y-2">
            <h2 className="text-xl font-bold">Credential Details</h2>

            <p><b>Name:</b> {credentialDoc.name}</p>
            <p><b>College:</b> {credentialDoc.collegeName}</p>
            <p><b>Passing Year:</b> {credentialDoc.passingYear}</p>
            <p><b>Degree:</b> {credentialDoc.degree}</p>
            <p><b>Branch:</b> {credentialDoc.branch}</p>

            <hr />

            <p className="text-sm">
              <b>Issuer:</b> {issuer}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
