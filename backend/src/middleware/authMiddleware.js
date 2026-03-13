import jwt from "jsonwebtoken";
import env from "../config/env.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch (_error) {
    res.status(401).json({ message: "Token no valido" });
  }
}
