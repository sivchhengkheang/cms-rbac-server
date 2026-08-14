import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: "User unauthorized" });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decodePayload) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = decodePayload;
    next();
  });
};

export default verifyToken;
