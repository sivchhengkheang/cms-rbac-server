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

app.use(
  cors({
    origin: process.env.CLIENT_URL, // Your Next.js frontend URL
    credentials: true, // CRITICAL: This allows the browser to accept and send the cookie
  }),
);
// Ensure preflight requests are handled: respond to OPTIONS after CORS sets headers
// app.use((req, res, next) => {
// if (req.method === "OPTIONS") return res.sendStatus(204);
// next();
// });

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
