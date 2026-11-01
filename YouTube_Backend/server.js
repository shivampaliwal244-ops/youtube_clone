import { fileURLToPath } from "node:url";
import process from "node:process";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { routes } from "./Routes/YoutubeData.routes.js";
import { userRoutes } from "./Routes/User.routes.js";
import { commentRoutes } from "./Routes/comment.routes.js";

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const localOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
]);
const allowedOrigins = process.env.CORS_ORIGINS
    ? new Set(process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean))
    : localOrigins;

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
}));
app.use(express.json({ limit: "1mb" }));

routes(app);
userRoutes(app);
commentRoutes(app);

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        youtubeApiConfigured: Boolean(process.env.YOUTUBE_API_KEY)
    });
});

app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
    void _next;
    if (error.type === "entity.parse.failed") return res.status(400).json({ message: "Request body must contain valid JSON." });
    if (error.message === "Origin not allowed by CORS") return res.status(403).json({ message: "This origin is not allowed." });
    console.error("Unhandled server error", { name: error.name || "Error" });
    return res.status(500).json({ message: "An unexpected server error occurred." });
});

const server = app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
});

if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI is not configured; MongoDB-backed features are unavailable.");
} else {
    mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
        .then(() => console.log("MongoDB connected."))
        .catch(() => console.warn("MongoDB is unavailable; video library, authentication, and comments will return 503."));
}

function shutdown() {
    server.close(() => {
        mongoose.disconnect().finally(() => process.exit(0));
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
