import { NextResponse } from "next/server";
import storeDID from "@/utils/storeDID.server";

export async function POST(req: Request) {
  const body = await req.json();
  const hash = await storeDID(body);
  return NextResponse.json({ hash });
}
