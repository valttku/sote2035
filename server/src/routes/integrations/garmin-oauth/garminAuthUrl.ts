import { randomUUID } from "crypto";
import { generateCodeVerifier, generateCodeChallenge } from "./pkce";
import { saveOAuthState } from "./stateStore";

const GARMIN_AUTH_URL = "https://connect.garmin.com/oauth2Confirm";

export function buildGarminAuthUrl(userId: number) {
  const state = randomUUID();
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  saveOAuthState(state, verifier, userId); // save to DB

  const params = new URLSearchParams({
    client_id: process.env.GARMIN_CLIENT_ID!,
    response_type: "code",
    state,
    redirect_uri: process.env.GARMIN_REDIRECT_URI!,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return `${GARMIN_AUTH_URL}?${params.toString()}`;
}
