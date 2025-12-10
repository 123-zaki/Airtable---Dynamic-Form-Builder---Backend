import express from "express";
import { getAirtableBases, getAirtableFields, getAirtableTables } from "../controllers/airtable.controllers.js";

const router = express.Router();

router.get('/bases', getAirtableBases);

router.get('/bases/:baseId/tables', getAirtableTables);

router.get("/bases/:baseId/tables/:tableId/fields", getAirtableFields);

export default router;