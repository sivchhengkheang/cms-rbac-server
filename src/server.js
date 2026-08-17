import express from "express";
import dotenv from "dotenv";
import contentRoute from "./routers/contentRoute.js";
import authRoute from "./routers/authRoute.js";
import userRoute from "./routers/userRoute.js";
import { dbConnection } from "./config/dbConnection.js";
import errorHandler from "./middlewares/errorHandler.js";
import cors from "cors";
import { createServer } from "http";
import { initSocket } from "./socket.js";
import cookiesParser from "cookie-parser";

dotenv.config();

const app = express();
// When behind a proxy (Render, Heroku, nginx), trust the first proxy
// so that Express knows the original request protocol for secure cookies.
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;
app.use(express.json());

// Configure CORS to allow credentials and echo back allowed origins.
// Use a forgiving policy in non-production to avoid blocking local dev.
const rawClientUrls = process.env.CLIENT_URL || "http://localhost:3000,http://localhost:3001";
const allowedOrigins = rawClientUrls
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (like curl, Postman, or server-to-server)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, "");

    // Allow exact match against configured origins
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);

    // Allow local development origins (localhost or 127.0.0.1 on any port)
    if (
      normalizedOrigin.startsWith("http://localhost:") ||
      normalizedOrigin.startsWith("http://127.0.0.1:") ||
      normalizedOrigin === "http://localhost" ||
      normalizedOrigin === "http://127.0.0.1"
    ) {
      return callback(null, true);
    }

    // Optionally allow Vercel preview domains when explicitly enabled or matching .vercel.app
    if (
      process.env.ALLOW_VERCEL_PREVIEWS === "true" ||
      normalizedOrigin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    // Allow during development if NODE_ENV is not production
    if (process.env.NODE_ENV !== "production") return callback(null, true);

    // Not allowed — log for diagnostics and block
    console.debug("CORS blocked origin:", origin, "allowed:", allowedOrigins);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(cookiesParser());

// Content routes
app.use("/api", contentRoute);

// authentication route
app.use("/api/auth", authRoute);

//User Route
app.use("/api", userRoute);

// Global error handler (should be last middleware)
app.use(errorHandler);

const start = async () => {
  try {
    await dbConnection();

    const httpServer = createServer(app);
    const io = initSocket(httpServer);

    httpServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use by another process.`);
        console.error(`Run 'fuser -k ${PORT}/tcp' or stop the existing process before restarting.`);
      } else {
        console.error("HTTP Server Error:", err);
      }
      process.exit(1);
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection error");
    process.exit(1);
  }
};

start();
