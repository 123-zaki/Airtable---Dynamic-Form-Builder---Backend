export const getAirtableBases = async (req, res) => {
  const airtableAccessToken = req.signedCookies["airtableAccessToken"];
  if (!airtableAccessToken) {
    return res.status(401).json({
      message: "Unauthorized - Not Logged In",
    });
  }
  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${airtableAccessToken}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        message: "Fetching airtable bases failed",
        error: data,
      });
    }

    const bases = (data.bases || []).map((base) => ({
      id: base.id,
      name: base.name,
    }));

    return res.status(200).json({
      message: "Airtable bases fetched successfully",
      bases,
    });
  } catch (error) {
    console.error("getAirtableBases error:", error);
    return res.status(500).json({
      message: "Unexpected error while listing bases",
      error: error.message,
    });
  }
};

export const getAirtableTables = async (req, res) => {
  const airtableAccessToken = req.signedCookies["airtableAccessToken"];
  if (!airtableAccessToken) {
    return res.status(401).json({
      message: "Unauthorized - Not Logged In",
    });
  }

  const { baseId } = req.params;
  if (!baseId) {
    return res.status(400).json({ message: "Base Id is required!" });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${airtableAccessToken}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error fetching tables from Airtable:", data);
      return res.status(500).json({
        message: `Error while fetching tables`,
        error: data,
      });
    }

    const tables = (data.tables || []).map((table) => ({
      id: table.id,
      name: table.name,
    }));

    return res.status(200).json({
      message: "Tables fetched successfully",
      tables,
    });
  } catch (error) {
    console.log("Failed to fetch airtable tables: ", error);
    return res.status(500).json({
      message: `Unexpected error while listing tables`,
      error: error.message,
    });
  }
};

export const getAirtableFields = async (req, res) => {
  const airtableAccessToken = req.signedCookies["airtableAccessToken"];
  if (!airtableAccessToken) {
    return res.status(401).json({
      message: "Unauthorized - Not Logged In",
    });
  }

  const { tableId, baseId } = req.params;
  if (!tableId || !baseId) {
    return res.status(400).json({
      message: "Table Id and Base Id are required!",
    });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${airtableAccessToken}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("Data: ", data);

    if (!response.ok) {
      console.log("Error fetching tables/schema from Airtable: ", data);
      return res.status(500).json({
        message: `Failed to fetch airtable table schema`,
        error: data,
      });
    }

    const table = (data.tables || []).find((table) => table.id === tableId);
    if (!table) {
      return res.status(404).json({
        message: `Table ${tableId} not found in base ${baseId}`,
      });
    }

    const supportedFields = (table.fields || [])
      .map((field) => {
        const rawType = field.type;

        let mappedType = null;

        if (rawType === "singleLineText") mappedType = "shortText";
        else if (rawType === "multilineText") mappedType = "longText";
        else if (rawType === "singleSelect") mappedType = "singleSelect";
        else if (rawType === "multipleSelects") mappedType = "multiSelect";
        else if (rawType === "multipleAttachments") mappedType = "attachment";

        if (!mappedType) {
          return null;
        }

        let options = null;
        if (rawType === "singleSelect" || rawType === "multipleSelects") {
          const choices = field.options?.choices || [];
          options = choices.map((c) => c.name);
        }

        return {
          id: field.id,
          name: field.name,
          type: mappedType,
          options,
        };
      })
      .filter(Boolean); // remove nulls (unsupported types)

    return res.status(200).json({
        message: 'Fields fetched successfully',
        fields: supportedFields
    });
  } catch (error) {
    console.error("getAirtableFields error:", error);
    return res.status(500).json({
      message: "Unexpected error while listing fields",
      error: error.message,
    });
  }
};