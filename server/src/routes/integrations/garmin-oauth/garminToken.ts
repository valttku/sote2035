import axios from "axios";

const GARMIN_TOKEN_URL = "https://apis.garmin.com/oauth2/token";

export async function exchangeGarminCodeForToken(
  code: string,
  verifier: string,
) {
  // Log everything first
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
    const response = await axios.post(GARMIN_TOKEN_URL, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
    });

    console.log("Garmin token response:", response.data);
    return response.data;
  } catch (err: any) {
    console.error(
      "Garmin token exchange failed:",
      err.response?.status,
      err.response?.data,
    );
    throw err; // rethrow to let callback handle
  }
}
