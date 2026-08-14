import express from "express";
import {
  register,
  login,
  me,
  updateProfile,
  refreshToken,
  logOut,
} from "../contollers/auth.js";
import verifyToken from "../middlewares/verifyToken.js";

const auth = express.Router();

auth.post("/register", register);
auth.post("/login", login);
auth.get("/me", verifyToken, me);
auth.put("/me", verifyToken, updateProfile);
auth.post("/logout", logOut);

// refresh token route
auth.post("/refresh", refreshToken);

export default auth;
