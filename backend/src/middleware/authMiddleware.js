import jwt from "jsonwebtoken";
import env from "../config/env.js";

function parseCookieHeader(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separatorIndex = item.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();

      if (key) {
        try {
          cookies[key] = decodeURIComponent(value);
        } catch (_error) {
          cookies[key] = value;
        }
      }

      return cookies;
    }, {});
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookies = parseCookieHeader(req.headers.cookie);
  const cookieToken = cookies.donostigo_token;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : cookieToken;

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch (_error) {
    res.status(401).json({ message: "Token no valido" });
  }
}
