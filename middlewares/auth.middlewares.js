import User from "../models/User.model.js";

export const requireAirtableUser = async (req, res, next) => {
  try {
    const accessToken = req.signedCookies["airtableAccessToken"];
    if (!accessToken) {
      return res.status(401).json({ message: "Not logged in" });
    }

    // Call Airtable whoami
    const whoamiRes = await fetch("https://api.airtable.com/v0/meta/whoami", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const whoamiData = await whoamiRes.json();

    if (!whoamiRes.ok) {
      console.error("whoami error:", whoamiData);
      return res
        .status(500)
        .json({ message: "Failed to fetch Airtable user info" });
    }

    const airtableUserId = whoamiData.id;
    const email = whoamiData.email;
    const name =
      whoamiData.name ||
      whoamiData.fullName ||
      whoamiData.user?.name ||
      undefined;

    if (!airtableUserId || !email) {
      return res
        .status(500)
        .json({ message: "Invalid whoami response", whoamiData });
    }

    // Upsert Mongo user
    const user = await User.findOneAndUpdate(
      { airtableUserId },
      {
        email,
        name,
        accessToken, // latest token
      },
      { new: true, upsert: true }
    );

    req.user = user;

    return next();
  } catch (err) {
    console.error("requireAirtableUser error:", err);
    return res
      .status(500)
      .json({ message: "Auth middleware failed", error: err.message });
  }
};