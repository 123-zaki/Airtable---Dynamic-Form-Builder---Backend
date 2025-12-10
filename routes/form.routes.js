import express from "express";
import { requireAirtableUser } from "../middlewares/auth.middlewares.js";
import { createForm, getFormById } from "../controllers/form.controllers.js";

const router = express.Router();

router.post('/create-form', requireAirtableUser, createForm);

router.get('/:formId',requireAirtableUser, getFormById);

export default router;