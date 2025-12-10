import express from "express";
import { requireAirtableUser } from "../middlewares/auth.middlewares.js";
import { listFormResponses, submitResponses } from "../controllers/response.controllers.js";

const router = express.Router();

router.post("/:formId/submit", requireAirtableUser, submitResponses);

router.get("/:formId/get-all-responses", listFormResponses);

export default router;