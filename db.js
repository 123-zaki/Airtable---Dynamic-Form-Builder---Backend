import mongoose from "mongoose";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config();

const port = process.env.PORT || 4000;

const mongoDB_URI = process.env.MONGODB_URI;

export async function connectToDB() {
    try {
        await mongoose.connect(mongoDB_URI);
        console.log("Database connected successfully");
        app.listen(port, () => {
        console.log("Server is listening on port: ", port);
    });
    } catch (error) {
        console.log("Sorry, DB connection failed!", error);
    }
};