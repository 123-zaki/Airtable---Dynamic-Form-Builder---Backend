import Form from "../models/Form.model.js";
import Response from "../models/Response.model.js"; // adjust name/path if needed
import { shouldShowQuestion } from "../utils/conditional.js";

export const submitResponses = async (req, res) => {
  const airtableAccessToken = req.signedCookies["airtableAccessToken"];
  if (!airtableAccessToken) {
    return res.status(401).json({
      message: `Unauthorized - Not Logged In`,
    });
  }

  try {
    const { formId } = req.params;
    const { answers } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({
        message: "answers object is required!",
      });
    }

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        message: "Form not found",
      });
    }

    const answersObj = answers || {};
    const fieldValuesForAirtable = {};
    const errors = [];

    for (const q of form.questions) {
      const visible = shouldShowQuestion(q.conditionalRules, answersObj);
      const value = answersObj[q.questionKey];

      // Required validation (only if visible)
      if (visible && q.required) {
        const empty =
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0);

        if (empty) {
          errors.push(`Missing required answer for "${q.questionKey}"`);
          continue;
        }
      }

      if (!visible || value === undefined || value === null) {
        continue;
      }

      if (q.type === "singleSelect") {
        if (!q.options || !q.options.includes(value)) {
          errors.push(
            `Invalid value for "${q.questionKey}", must be one of: ${q.options?.join(
              ", "
            )}`
          );
        } else {
          fieldValuesForAirtable[q.airtableFieldId] = value;
        }
      } else if (q.type === "multiSelect") {
        if (!Array.isArray(value)) {
          errors.push(`"${q.questionKey}" must be an array for multiSelect`);
        } else {
          const invalid = value.filter(
            (v) => !q.options || !q.options.includes(v)
          );
          if (invalid.length > 0) {
            errors.push(
              `Invalid values for "${q.questionKey}": ${invalid.join(", ")}`
            );
          } else {
            // Airtable multi-select: array of string option names
            fieldValuesForAirtable[q.airtableFieldId] = value;
          }
        }
      } else if (q.type === "shortText" || q.type === "longText") {
        fieldValuesForAirtable[q.airtableFieldId] = value;
      } else if (q.type === "attachment") {
        if (!Array.isArray(value)) {
          errors.push(
            `"${q.questionKey}" must be an array of URLs for attachment`
          );
        } else {
          const invalid = value.filter(
            (v) => typeof v !== "string" || v.trim() === ""
          );

          if (invalid.length > 0) {
            errors.push(`Invalid attachment URLs for "${q.questionKey}"`);
          } else {
            fieldValuesForAirtable[q.airtableFieldId] = value.map((url) => ({
              url,
            }));
          }
        }
      } else {
        // Unsupported type in schema
        errors.push(`Unsupported question type: "${q.type}"`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const baseId = form.airtableBaseId;
    const tableId = form.airtableTableId;

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${airtableAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: fieldValuesForAirtable,
        }),
      }
    );

    const airtableData = await airtableRes.json();

    if (!airtableRes.ok) {
      console.error("Airtable record create error:", airtableData);
      return res.status(500).json({
        message: "Failed to create record in Airtable",
        airtableError: airtableData,
      });
    }

    const airtableRecordId = airtableData.id;

    const responseDoc = await Response.create({
      formId: form._id,
      airtableRecordId,
      answers: answersObj,
      deletedInAirtable: false,
    });

    return res.status(201).json({
      message: "Form submitted successfully",
      responseId: responseDoc._id,
      airtableRecordId,
    });
  } catch (error) {
    console.error("submitResponses error:", error);
    return res.status(500).json({
      message: "Failed to submit form",
      error: error.message,
    });
  }
};

export const listFormResponses = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        message: "Form not found",
      });
    }

    const responses = await Response.find({ formId })
      .sort({ createdAt: -1 });

    const formatted = responses.map((r) => {
      const preview = Object.entries(r.answers || {})
        .slice(0, 3);

      return {
        _id: r._id,
        airtableRecordId: r.airtableRecordId,
        createdAt: r.createdAt,
        deletedInAirtable: r.deletedInAirtable,
        preview,
      };
    });

    return res.status(200).json({
      message: "Responses fetched successfully",
      responses: formatted,
    });
  } catch (error) {
    console.error("listFormResponses error:", error);
    return res.status(500).json({
      message: "Failed to load responses",
      error: error.message,
    });
  }
};
