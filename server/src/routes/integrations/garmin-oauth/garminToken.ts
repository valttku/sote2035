const GARMIN_TOKEN_URL =
  "https://diauth.garmin.com/di-oauth2-service/oauth/token";

export async function exchangeGarminCodeForToken(
  code: string,
  verifier: string,
) {
  const clientId = process.env.GARMIN_CLIENT_ID;
  const clientSecret = process.env.GARMIN_CLIENT_SECRET;
  const redirectUri = process.env.GARMIN_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "GARMIN_CLIENT_ID, GARMIN_CLIENT_SECRET and GARMIN_REDIRECT_URI must be set",
    );
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(GARMIN_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Garmin token exchange failed:", response.status, text);
    throw new Error(`Token exchange failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data;
}

export async function fetchGarminUserProfile(accessToken: string) {
  const response = await fetch(
    "https://apis.garmin.com/wellness-api/rest/user/id",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Garmin user profile: ${text}`);
  }

  const data = await response.json();
  return data; // contains Garmin userId
}

export async function refreshGarminToken(refreshToken: string) {
  const clientId = process.env.GARMIN_CLIENT_ID;
  const clientSecret = process.env.GARMIN_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("GARMIN_CLIENT_ID and GARMIN_CLIENT_SECRET must be set");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(GARMIN_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Garmin token refresh failed:", response.status, text);
    throw new Error(`Token refresh failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data; // Contains new access_token, refresh_token, expires_in
}
