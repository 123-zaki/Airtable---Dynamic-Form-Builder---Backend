import User from "../models/User.model.js";

export const requireAirtableUser = async (req, res, next) => {
  try {
    // 1. Get token from cookie (if present)
    const cookieToken = req.cookies?.airtableAccessToken;

    // 2. Or from Authorization header: "Bearer <token>"
    const authHeader = req.headers?.authorization;
    const headerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    // 3. Prefer cookie, fallback to header
    const accessToken = cookieToken || headerToken;

    if (!accessToken) {
      return res.status(401).json({ message: "Not logged in" });
    }

    // 4. Call Airtable whoami
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

    // 5. Upsert Mongo user
    const user = await User.findOneAndUpdate(
      { airtableUserId },
      {
        email,
        name,
        accessToken, // latest token we just used
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
