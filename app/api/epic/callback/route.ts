import { NextRequest, NextResponse } from "next/server";

const EPIC_TOKEN_URL =
  "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token";

const CLIENT_ID = process.env.EPIC_CLIENT_ID!;
const CLIENT_SECRET = process.env.EPIC_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/epic/callback`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Epic OAuth error:", error);
      return NextResponse.redirect(
        `${APP_URL}?epic_error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(`${APP_URL}?epic_error=no_code`);
    }

    // Verify state
    const storedState = request.cookies.get("epic_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${APP_URL}?epic_error=invalid_state`);
    }

    // Get code verifier for PKCE
    const codeVerifier = request.cookies.get("epic_code_verifier")?.value;
    if (!codeVerifier) {
      return NextResponse.redirect(`${APP_URL}?epic_error=missing_verifier`);
    }

    // Exchange code for token with PKCE
    const tokenBody: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier,
    };

    // Only include client_secret if it exists
    if (CLIENT_SECRET) {
      tokenBody.client_secret = CLIENT_SECRET;
    }

    const tokenRes = await fetch(EPIC_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(tokenBody).toString(),
    });

    const tokenData = await tokenRes.json();
    console.log("Token exchange response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      console.error("Epic token exchange failed:", tokenData);
      return NextResponse.redirect(
        `${APP_URL}?epic_error=token_exchange_failed`
      );
    }

    const response = NextResponse.redirect(`${APP_URL}?epic_connected=true`);

    response.cookies.set("epic_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600,
      path: "/",
    });

    if (tokenData.refresh_token) {
      response.cookies.set("epic_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    response.cookies.delete("epic_oauth_state");
    response.cookies.delete("epic_code_verifier");

    return response;
  } catch (error: any) {
    console.error("Epic callback error:", error);
    return NextResponse.redirect(`${APP_URL}?epic_error=callback_failed`);
  }
}