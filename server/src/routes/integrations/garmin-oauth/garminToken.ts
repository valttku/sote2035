const GARMIN_TOKEN_URL = "https://apis.garmin.com/oauth2/token";

export async function exchangeGarminCodeForToken(
  code: string,
  verifier: string,
) {
  console.log("Exchanging Garmin code for token...");
  console.log("code:", code);
  console.log("verifier:", verifier);
  console.log("client_id:", process.env.GARMIN_CLIENT_ID);
  console.log("redirect_uri:", process.env.GARMIN_REDIRECT_URI);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.GARMIN_CLIENT_ID!,
    redirect_uri: process.env.GARMIN_REDIRECT_URI!,
    code,
    code_verifier: verifier,
  });

  const basic = Buffer.from(
    `${process.env.GARMIN_CLIENT_ID}:${process.env.GARMIN_CLIENT_SECRET}`,
  ).toString("base64");

  try {
    const response = await fetch(GARMIN_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Garmin token exchange failed:",
        response.status,
        errorData,
      );
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Garmin token response:", data);
    return data;
  } catch (err) {
    console.error("Error exchanging Garmin code for token:", err);
    throw err;
  }
}
