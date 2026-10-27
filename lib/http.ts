import { NextResponse } from "next/server";

export function jsonError(message: string, status: number, code = "error") {
  return NextResponse.json({ error: message, code }, { status });
}
