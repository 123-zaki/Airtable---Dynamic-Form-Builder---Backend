import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
// app.use(express.json({
//     limit: '16kb'
// }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
// app.use(session({
//     secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
//     resave: false,
//     saveUninitialized: true,
// }));

// Routes Imports
import authRouter from "./routes/auth.routes.js";
import formRouter from "./routes/form.routes.js";
import airtableRouter from "./routes/airtable.routes.js";
import responseRouter from "./routes/response.routes.js";

// Routing
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/forms", formRouter);
app.use("/api/v1/airtable", airtableRouter);
app.use("/api/v1/responses", responseRouter);

export {app};