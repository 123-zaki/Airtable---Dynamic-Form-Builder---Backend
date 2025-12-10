import express from "express";
import {
  airtableCallback,
  airtableLogin,
  airtableLogout,
  airtableMe,
} from "../controllers/auth.controllers.js";

const router = express.Router();

router.get("/airtable/login", airtableLogin);

router.get("/airtable/callback", airtableCallback);

router.get("/airtable/me", airtableMe);

router.get("/airtable/logout", airtableLogout);

export default router;
