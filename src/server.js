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
const PORT = process.env.PORT || 5000;
app.use(express.json());
// Configure CORS to allow credentials and only echo back allowed origins
const rawClientUrls = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = rawClientUrls
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (like curl or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS policy: Origin not allowed"));
    },
    credentials: true,
  }),
);
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

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection error");
    process.exit(1);
  }
};

start();
