import dotenv from "dotenv";
import crypto from "crypto";
import { generatePkcePair, randomState } from "../utils/pkce.js";
import User from "../models/User.model.js";
dotenv.config();

export const airtableLogin = async (req, res) => {
  const clientId = process.env.AIRTABLE_CLIENT_ID;
  const clientSecret = process.env.AIRTABLE_CLIENT_SECRET;
  const redirectUri = process.env.AIRTABLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res
      .status(500)
      .json({ message: "Environment variables not set properly" });
  }

  const { codeVerifier, codeChallenge } = generatePkcePair();
  const state = randomState();
  const isProd = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
    signed: true,
  };
  const scopes = process.env.AIRTABLE_SCOPES;

  res.cookie("oauthState", state, options);
  res.cookie("codeVerifier", codeVerifier, options);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const airtableAuthUrl = `https://airtable.com/oauth2/v1/authorize?${params.toString()}`;

  res.redirect(airtableAuthUrl);
};

export const airtableCallback = async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).json({
      oAuthError: `${error} - ${error_description || ""}`,
    });
  }

  // Validate state
  const storedState = req.signedCookies["oauthState"];
  if (!state || !storedState || state !== storedState) {
    return res.status(400).json({
      error: `Invalid state - possible CSRF detected`,
    });
  }

  // Validate code
  const codeVerifier = req.signedCookies["codeVerifier"];
  if (!code) {
    return res.status(400).json({
      error: `Missing authorization code`,
    });
  }

  if (!codeVerifier) {
    return res.status(400).json({
      error: "Missing PKCE code verifier cookie",
    });
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
      code_verifier: codeVerifier,
      client_id: process.env.AIRTABLE_CLIENT_ID,
    });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };

    if (process.env.AIRTABLE_CLIENT_SECRET) {
      const basicAuth = Buffer.from(
        `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
      ).toString("base64");

      headers.Authorization = `Basic ${basicAuth}`;
    }

    const response = await fetch(`https://airtable.com/oauth2/v1/token`, {
      method: "POST",
      headers,
      body,
    });

    const data = await response.json();

    console.log("Data: ", data);

    if (!response.ok) {
      console.log("Token exchange error: ", data);

      return res.status(500).json({
        message: `Token exchange failed`,
        error: error,
        data,
      });
    }

    const isProd = process.env.NODE_ENV === "production";
    const options = {
      httpOnly: true,
      secure: isProd,
      sameSite: "none",
      signed: true,
    };

    res.clearCookie("oauthState", options);
    res.clearCookie("codeVerifier", options);

    // Store tokens in cookies
    res.cookie("airtableAccessToken", data.access_token, options);
    if (data.refresh_token) {
      res.cookie("airtableRefreshToken", data.refresh_token, options);
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(frontendUrl);
  } catch (error) {
    console.log("Error during token exchange: ", error);
    return res.status(500).json({
      message: `Token exchange crashed, ${error.message}`,
    });
  }
};

export const airtableMe = async (req, res) => {
  const airtableAccessToken = req.signedCookies["airtableAccessToken"];
  const airtableRefreshToken = req.signedCookies["airtableRefreshToken"];

  if (!airtableAccessToken) {
    // User is not logged in
    // return res.redirect('/airtable/login');
    return res.status(401).json({
      message: "Unauthorized - Not Logged In",
    });
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/whoami`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${airtableAccessToken}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();
    console.log("Data (Who-Am-I): ", data);

    if (!response.ok) {
      return res.status(500).json({
        message: "/meta/whoami hit failed",
        data,
      });
    }

    const airtableUserId = data.id;
    const email = data.email;
    const name = data.name || data.fullName || data.user?.name || undefined;

    if (!airtableUserId || !email) {
      return res
        .status(500)
        .json({ message: "Unexpected whoami response", data });
    }

    const user = await User.findOneAndUpdate(
      { airtableUserId },
      {
        email,
        name,
        accessToken: airtableAccessToken,
        refreshToken: airtableRefreshToken,
        accessTokenExpiry: new Date() + 10 * 60 * 1000,
        refreshTokenExpiry: new Date() + 7 * 24 * 60 * 60 * 1000,
      },
      { new: true, upsert: true }
    );

    return res.json({
      userId: user._id,
      airtableUserId: user.airtableUserId,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("get current user error:", error);
    return res
      .status(500)
      .json({ message: "Failed to load current user", error: error.message });
  }
};

export const airtableLogout = async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
    signed: true,
  };

  res.clearCookie("airtableAccessToken", options);
  res.clearCookie("airtableRefreshToken", options);
  res.clearCookie("oauthState", options);
  res.clearCookie("codeVerifier", options);

  return res.status(200).json({
    message: `Logged out successfully from airtable`,
  });
};
