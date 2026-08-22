import express from "express";
import {
  deleteUser,
  getAllUser,
  create,
  updateUser,
} from "../contollers/user.js";
import verifyToken from "../middlewares/verifyToken.js";
import checkRole from "../middlewares/checkRole.js";
import { cacheMiddleware } from "../middlewares/cacheMiddleware.js";

const route = express.Router();

route.get("/users", verifyToken, checkRole("Admin", "Manager"), getAllUser);
route.post("/create", verifyToken, checkRole("Admin", "Manager"), create);
route.put("/user/:id", verifyToken, checkRole("Admin"), updateUser);
route.delete("/user/:id", verifyToken, checkRole("Admin"), deleteUser);

export default route;
