import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(400).json({ message: "User unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "User token not signed" });
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
