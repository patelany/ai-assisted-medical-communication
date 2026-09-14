import { NextRequest } from "next/server";

export function validateCSRF(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  const allowedOrigins = [
    `https://${host}`,
    `http://localhost:3000`,
    `http://localhost:3001`,
    "https://ai-assisted-medical-communication.vercel.app",
  ];

  return allowedOrigins.some((allowed) => origin.startsWith(allowed));
}