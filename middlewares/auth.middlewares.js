export const airtableMe = async (req, res) => {
  const airtableAccessToken = req.cookies["airtableAccessToken"];
  const airtableRefreshToken = req.cookies["airtableRefreshToken"];

  if (!airtableAccessToken) {
    return res.status(401).json({
      message: "Unauthorized - Not Logged In",
    });
  }

  try {
    const response = await fetch("https://api.airtable.com/v0/meta/whoami", {
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
    const name =
      data.name || data.fullName || data.user?.name || undefined;

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
        accessTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
        refreshTokenExpiry: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
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
    return res.status(500).json({
      message: "Failed to load current user",
      error: error.message,
    });
  }
};
