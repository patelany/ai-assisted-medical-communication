import { NextRequest, NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";
import { v4 as uuidv4 } from "uuid";

const EPIC_TOKEN_URL =
  "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token";

const CLIENT_ID = process.env.EPIC_CLIENT_ID!;

async function getAccessToken(): Promise<string> {
  const privateKeyPem = process.env.EPIC_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const privateKey = await importPKCS8(privateKeyPem, "RS384");

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "RS384", kid: "clarityai-key-1" })
    .setIssuer(CLIENT_ID)
    .setSubject(CLIENT_ID)
    .setAudience(EPIC_TOKEN_URL)
    .setJti(uuidv4())
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: jwt,
  });

  const res = await fetch(EPIC_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(`Epic auth failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export async function GET() {
  try {
    const token = await getAccessToken();
    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error("Epic auth error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Epic", details: error.message },
      { status: 500 }
    );
  }
}

export { getAccessToken };