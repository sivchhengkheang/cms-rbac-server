import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import {
  getAllContent,
  getContentById,
  createContent,
  deleteContent,
  updateContent,
} from "../contollers/content.js";

const route = express.Router();

// List contents (supports optional query: status, tag)
route.get(
  "/contents",
  verifyToken,
  checkRole("Admin", "Manager", "User"),
  getAllContent,
);

// Get single content by id
route.get(
  "/content/:id",
  verifyToken,
  checkRole("Admin", "Manager", "User"),
  getContentById,
);

// Create content (Admin, Manager)
route.post(
  "/content",
  verifyToken,
  checkRole("Admin", "Manager"),
  createContent,
);

// Delete content (Admin only)
route.delete("/content/:id", verifyToken, checkRole("Admin"), deleteContent);

// Update content (author, Admin, or Manager)
route.put("/content/:id", verifyToken, checkRole("Admin"), updateContent);

export default route;
