import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const EPIC_AUTH_URL =
  "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize";

const CLIENT_ID = process.env.EPIC_CLIENT_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/epic/callback`;

const SCOPES = [
  "openid",
  "fhirUser",
  "patient/Patient.read",
  "patient/Observation.read",
  "patient/Condition.read",
  "patient/DocumentReference.read",
  "patient/ServiceRequest.read",
  "patient/RelatedPerson.read",
  "patient/Encounter.read",
  "patient/MedicationRequest.read",
].join(" ");

export async function GET(request: NextRequest) {
  // Generate state parameter to prevent CSRF on the OAuth flow
  const state = randomBytes(32).toString("hex");

  // Store state in a cookie for verification on callback
  const response = NextResponse.redirect(
    `${EPIC_AUTH_URL}?` +
      new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        state,
        aud: "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
      }).toString()
  );

  response.cookies.set("epic_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}