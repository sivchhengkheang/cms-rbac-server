import User from "../models/userSchema.js";
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
};
