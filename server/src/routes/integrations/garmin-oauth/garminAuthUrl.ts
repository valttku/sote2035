import { randomUUID } from "crypto";
import { generateCodeVerifier, generateCodeChallenge } from "./pkce.js";
import { saveOAuthState } from "./stateStore.js";

const GARMIN_AUTH_URL = "https://connect.garmin.com/oauth2Confirm";

export async function buildGarminAuthUrl(userId: number) {
  const state = randomUUID();
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  await saveOAuthState(state, verifier, userId);

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
