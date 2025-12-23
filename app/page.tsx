"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import Header from "../components/Header";
import { DIDRegistry, CredentialRegistry } from "../constants";

/* ---------- On-chain Types ---------- */

interface OnChainDID {
  owner: `0x${string}`;
  didDocHash: string;
  active: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}

interface OnChainCredential {
  credentialHash: string; // IPFS CID
  issuer: `0x${string}`;
  subject: `0x${string}`;
  revoked: boolean;
  issuedAt: bigint;
}

/* ---------- IPFS Types ---------- */

interface DIDDocument {
  name: string;
  description: string;
  publicKey: string;
}

interface CredentialDocument {
  name: string;
  collegeName: string;
  passingYear: number;
  degree: string;
  branch: string;
}

/* ---------- Component ---------- */

export default function Home() {
  const { address, isConnected } = useAccount();

  const [didDoc, setDidDoc] = useState<DIDDocument | null>(null);
  const [credentialDoc, setCredentialDoc] =
  useState<CredentialDocument | null>(null);

  const [issuer, setIssuer] = useState<`0x${string}` | "">("");
  const [_hash, setHash] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
  useWaitForTransactionReceipt({
    hash: txHash,
  });

  /* -------- Resolve DID (ON-CHAIN) -------- */
  const { data: didStruct } = useReadContract({
    address: DIDRegistry.address,
    abi: DIDRegistry.abi,
    functionName: "resolveDID",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  }) as { data?: OnChainDID };

  /* -------- Get Credentials by Subject -------- */
  const { data: credentialHashes } = useReadContract({
    address: CredentialRegistry.address,
    abi: CredentialRegistry.abi,
    functionName: "getCredentialsBySubject",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  }) as { data?: readonly string[] };

  /* -------- Fetch DID Document from IPFS -------- */
  useEffect(() => {
    if (!didStruct || !didStruct.active) return;

    const fetchDID = async () => {
      const res = await fetch(
        `https://ipfs.io/ipfs/${didStruct.didDocHash}`
      );
      const json: DIDDocument = await res.json();
      setDidDoc(json);
    };

    fetchDID();
  }, [didStruct]);

  /* -------- First Credential (if exists) -------- */
  const firstCredentialHash = credentialHashes?.[0];

  const { data: onChainCredential } = useReadContract({
    address: CredentialRegistry.address,
    abi: CredentialRegistry.abi,
    functionName: "getCredential",
    args: firstCredentialHash ? [firstCredentialHash] : undefined,
    query: { enabled: !!firstCredentialHash },
  }) as { data?: OnChainCredential };

  /* -------- Fetch Credential from IPFS -------- */
  useEffect(() => {
    if (!onChainCredential || onChainCredential.revoked) return;

    const fetchCredential = async () => {
      const res = await fetch(
        `https://ipfs.io/ipfs/${onChainCredential.credentialHash}`
      );
      const json = await res.json();

      setCredentialDoc(json);
      setIssuer(onChainCredential.issuer);
    };

    fetchCredential();
  }, [onChainCredential]);

  /* -------- Create DID (IPFS only) -------- */
  const handleCreateDID = async () => {
    if (!address || !name || !description) return;

    /* -------- 1. Store DID document on IPFS -------- */
    const resp = await fetch("/api/store-did", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        publicKey: address,
      }),
    });

    if (!resp.ok) {
      throw new Error("Failed to upload DID to IPFS");
    }

    const { hash } = await resp.json();
    setHash(hash);

    /* -------- 2. Register DID on-chain -------- */
    writeContract({
      address: DIDRegistry.address,
      abi: DIDRegistry.abi,
      functionName: "registerDID",
      args: [hash],
    });
  };

  useEffect(() => {
    if (!isSuccess || !txHash) return;

    const fetchDID = async () => {
      const res = await fetch(`https://ipfs.io/ipfs/${_hash}`);
      const json: DIDDocument = await res.json();
      setDidDoc(json);
    };

    fetchDID();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {!isConnected && (
        <main className="flex justify-center mt-20 text-gray-600">
          Please connect your wallet to continue.
        </main>
      )}

      {isConnected && (
        <main className="max-w-3xl mx-auto p-8 space-y-8">
          {/* DID Section */}
          {didStruct?.active && didDoc ? (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-bold mb-4">Your DID</h2>
              <p><b>Name:</b> {didDoc.name}</p>
              <p><b>Description:</b> {didDoc.description}</p>
              <p><b>Public Key:</b> {didDoc.publicKey}</p>
              <p className="text-sm text-gray-500 mt-2">
                Created: {new Date(Number(didStruct.createdAt) * 1000).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-bold mb-4">Create DID</h2>

              <input
                className="w-full mb-3 p-2 border rounded"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <textarea
                className="w-full mb-3 p-2 border rounded"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <button
                onClick={handleCreateDID}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Create DID
              </button>
            </div>
          )}

          {/* Credential Section */}
          {credentialDoc && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-bold mb-4">Your Credential</h2>
              <p><b>Issuer:</b> {issuer}</p>
              <pre className="mt-3 text-sm bg-gray-100 p-3 rounded">
                {JSON.stringify(credentialDoc, null, 2)}
              </pre>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
