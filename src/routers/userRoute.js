import express from "express";
import { deleteUser, getAllUser, create } from "../contollers/user.js";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";

const route = express.Router();

// route.get("/users", verifyToken, checkRole("Admin"), getAllUser);
route.get("/users", getAllUser);
route.post("/create", verifyToken, checkRole("Admin", "Manager"), create);
route.delete(
  "/user/:id",
  verifyToken,
  checkRole("Admin", "Manager", "User"),
  deleteUser,
);

export default route;
