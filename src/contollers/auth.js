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

    res
      .status(201)
      .json({ message: "User register account sucessfully!!", newUser });
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

    // Generate Refresh token
    const refreshToken = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET_KEY,
      {
        expiresIn: "7d",
      },
    );

    // Generate access token and set both tokens as httpOnly cookies
    const accessToken = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    const cookieSecure = process.env.NODE_ENV === "production";
    const cookieSameSite = process.env.NODE_ENV === "production" ? "none" : "lax";

    // Set refresh token as an httpOnly cookie (longer expiry)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Set access token as an httpOnly cookie (short expiry)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      maxAge: 1 * 60 * 60 * 1000,
      path: "/",
    });

    // Return only non-sensitive user info
    res.status(200).json({
      message: "User login successful",
      user: {
        username: user.username,
        role: user.role,
      },
      token: accessToken,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Somthing went wrong!!" });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: "User not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    // issue a fresh token so client can use updated role in token if desired
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      message: "Current user",
      user: { username: user.username, role: user.role },
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: "User not found" });

    const { username, password } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists && exists._id.toString() !== userId) {
        return res.status(409).json({ message: "Username already taken" });
      }
      user.username = username;
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      user.password = hash;
    }

    await user.save();

    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      message: "Profile updated",
      user: { username: user.username, role: user.role },
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "Refresh token not found. Please log in." });
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET_KEY,
    (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Invalid or expired refresh token." });
      }

      const refreshPayload = {
        id: decoded?.id || decoded?._id,
        username: decoded?.username,
        role: decoded?.role,
      };

      const newAccessToken = jwt.sign(refreshPayload, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });

      const cookieSecure = process.env.NODE_ENV === "production";
      const cookieSameSite = process.env.NODE_ENV === "production" ? "none" : "lax";

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: 1 * 60 * 60 * 1000,
        path: "/",
      });

      // Optionally return user info so frontend can update UI
      return res.json({
        user: { username: refreshPayload.username, role: refreshPayload.role },
      });
    },
  );
};

export const logOut = async (req, res) => {
  const cookieSecure = process.env.NODE_ENV === "production";

  const cookieSameSite = process.env.NODE_ENV === "production" ? "none" : "lax";

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    path: "/",
  });

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    path: "/",
  });

  res.status(200).json({ message: "Logged out successfully." });
};
