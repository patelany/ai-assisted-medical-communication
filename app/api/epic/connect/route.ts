import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const EPIC_AUTH_URL =
  "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize";

const CLIENT_ID = process.env.EPIC_CLIENT_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/epic/callback`;

const SCOPES = [
  "openid",
  "fhirUser",
  "user/Patient.read",
  "user/Observation.read",
  "user/Condition.read",
  "user/DocumentReference.read",
  "user/ServiceRequest.read",
  "user/RelatedPerson.read",
  "user/Encounter.read",
  "user/MedicationRequest.read",
].join(" ");

export async function GET(request: NextRequest) {
  const state = randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    aud: "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
  });

  const authUrl = `${EPIC_AUTH_URL}?${params.toString()}`;

  console.log("=== EPIC AUTH DEBUG ===");
  console.log("CLIENT_ID:", CLIENT_ID);
  console.log("REDIRECT_URI:", REDIRECT_URI);
  console.log("SCOPES:", SCOPES);
  console.log("FULL URL:", authUrl);
  console.log("======================");

  const response = NextResponse.redirect(authUrl);

  response.cookies.set("epic_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}