import User from "../models/userSchema.js";
import { getIO } from "../socket.js";
import bcrypt from "bcrypt";
// Get Users
export const getAllUser = async (req, res) => {
  try {
    const user = await User.find({});

    if (!user) {
      return res
        .status(404)
        .json({ sucess: false, message: "Somthing went wrong" });
    }

    res.status(200).json({ sucess: true, data: user });
  } catch (error) {
    console.error("Error fetching user", error.message);
    // Return a 500 network erros,
    res.status(500).json({
      sucess: false,
      message: "Internal server error occurred",
      error: error.message,
    });
  }
};

// Create User
export const create = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ message: "User name and password is Required" });
    }

    // check if user already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({ message: "User is already exists" });
    }

    // Hash password
    const hashpassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username,
      password: hashpassword,
      role: role,
    });

    // save user to the database
    await newUser.save();
    try {
      getIO().emit("user:created", newUser);
      getIO().emit("user:changed");
    } catch (e) {}

    res
      .status(201)
      .json({ message: "User account create sucessfully!!", newUser });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", err });
    console.error(err);
  }
};
export const deleteUser = async (req, res) => {
  const userId = req.params.id;

  const user = await User.findByIdAndDelete({ _id: userId });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ message: "User deleted successfully" });
  try {
    getIO().emit("user:deleted", { id: userId });
    getIO().emit("user:changed");
  } catch (e) {}
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    const validRoles = ["Admin", "Manager", "User"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        message: "Role is required and must be Admin, Manager, or User",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    try {
      getIO().emit("user:updated", user);
      getIO().emit("user:changed");
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: user,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Error updating user role", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
