import pinataSDK from "@pinata/sdk";
import dotenv from "dotenv";

dotenv.config();

const pinataApiKey = process.env.PINATA_API_KEY || "";
const pinataApiSecret = process.env.PINATA_API_SECRET || "";

if (!pinataApiKey || !pinataApiSecret) {
  throw new Error("Pinata API credentials are missing");
}

const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

/* ---------- Types ---------- */

interface DIDMetadata {
  name: string;
  description: string;
  publicKey: string;
}

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/* ---------- Function ---------- */

export default async function storeDID(
  metadata: DIDMetadata
): Promise<string> {
  const options = {
    pinataMetadata: {
      name: metadata.name,
    },
  };

  try {
    const response: PinataResponse =
      await pinata.pinJSONToIPFS(metadata, options);

    return response.IpfsHash;
  } catch (error) {
    console.error("Pinata DID upload failed:", error);
    throw error;
  }
}
