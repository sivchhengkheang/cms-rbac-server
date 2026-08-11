import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";

export const register = async (req, res) => {
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

    res.status(201).json({ message: "User register account sucessfully!!" ,newUser });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", err });
    console.error(err);
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Invalid Username or Password" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid Username or Password" });
    }

    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "User login sucessful",
      user: {
        username: user.username,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Somthing went wrong!!" });
  }
};
