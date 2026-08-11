import express from "express";
import dotenv from "dotenv";
import contentRoute from "./routers/contentRoute.js";
import authRoute from "./routers/authRoute.js";
import userRoute from "./routers/userRoute.js";
import { dbConnection } from "./config/dbConnection.js";
import errorHandler from "./middlewares/errorHandler.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT;

// Content routes
app.use("/", contentRoute);

// authentication route
app.use("/api/auth", authRoute);

//User Route
app.use("/api", userRoute);

// Global error handler (should be last middleware)
app.use(errorHandler);

const start = async () => {
  try {
    await dbConnection();
    app.listen(PORT, () => {
      console.log(`server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection error");
    process.exit(1);
  }
};

start();
