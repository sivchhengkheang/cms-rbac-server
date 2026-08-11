import mongoose from "mongoose";

export const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log("mongodb connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
};
