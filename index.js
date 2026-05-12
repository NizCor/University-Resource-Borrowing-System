//Import necessary modules
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import resourceRoute from "./routes/resourceRoute.js";
import borrowingRoute from "./routes/borrowingRoute.js";
import path from "path";
import { fileURLToPath } from "url";

// Load .env before reading process.env (required for MONGO_URL, PORT, etc.)
dotenv.config();

// Serve static frontend files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Initialize express app
const app = express();

//Middleware for parsing JSON request bodies
app.use(bodyParser.json());

//Define the port for the server to listen on
const PORT = process.env.PORT || 8000;

//Define MongoDB connection URL from environment variables
const MONGOURL = process.env.MONGO_URL;

app.use(express.static(path.join(__dirname, "public")));

//Connect to MongoDB database
if (!MONGOURL) {
    console.error("MONGO_URL is not set. Add it to your .env file.");
    process.exit(1);
}

mongoose
    .connect(MONGOURL)
    .then(() => {
        console.log("Database connected successfully.");
        
        //Mount routes
        app.use("/api/resources", resourceRoute);
        app.use("/api/borrowings", borrowingRoute);

        // Start server on specified port
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });




