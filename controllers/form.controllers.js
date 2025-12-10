import Form from "../models/Form.model.js";

export const createForm = async (req, res) => {
  const airtableAccessToken = req.signedCookies["airtableAccessToken"];
  if (!airtableAccessToken) {
    return res.status(401).json({
      message: "Unauthorized - Not Logged In",
    });
  }

  try {
    const userId = req.user._id;
    const { name, description, airtableBaseId, airtableTableId, questions } =
      req.body;

    if (!name || !airtableBaseId || !airtableTableId) {
      return res.status(400).json({
        message: "Name, airtable base id and airtable table id are required",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "Invalid or empty questions array",
      });
    }

    const allowedTypes = [
      "shortText",
      "longText",
      "singleSelect",
      "multiSelect",
      "attachment",
    ];

    for (const q of questions) {
      if (!q.questionKey || !q.airtableFieldId || !q.label || !q.type) {
        return res.status(400).json({
          message:
            "Each question must have questionKey, airtableFieldId, label and type",
        });
      }

      if (!allowedTypes.includes(q.type)) {
        return res.status(400).json({
          message: `Unsupported question type: ${q.type}`,
        });
      }

      if (
        (q.type === "singleSelect" || q.type === "multiSelect") &&
        (!Array.isArray(q.options) || q.options.length === 0)
      ) {
        return res.status(400).json({
          message: `Select question "${q.questionKey}" must have options array`,
        });
      }
    }

    const form = await Form.create({
      ownerUserid: userId,
      name,
      description,
      airtableBaseId,
      airtableTableId,
      questions,
    });

    return res.status(201).json({
      message: "Form created successfully",
      //   formId: form._id,
      form,
    });
  } catch (error) {
    console.error("createForm error:", error);
    return res.status(500).json({
      message: "Failed to create form",
      error: error.message,
    });
  }
};

export const getFormById = async (req, res) => {
  const { formId } = req.params;
  if (!formId) {
    return res.status(400).json({
      message: "Form Id is required!",
    });
  }

  try {
    const form = await Form.findById(formId);
    if(!form) {
        return res.status(404).json({
            message: 'Form not found'
        });
    }

    return res.status(200).json({
        message: 'Form fetched successfully',
        form
    });
  } catch (error) {
    console.error("getFormById error:", error);
    return res.status(500).json({
      message: "Failed to load form",
      error: error.message,
    });
  }
};
