import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import env from "../config/env.js";

const allowedRoles = new Set(["user", "business"]);
const SESSION_COOKIE_NAME = "donostigo_token";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: "7d"
  });
}

function setSessionCookie(res, token) {
  const isProduction = env.nodeEnv === "production";
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${60 * 60 * 24 * 7}`
  ];

  if (isProduction) {
    cookieParts.push("SameSite=None");
    cookieParts.push("Secure");
  } else {
    cookieParts.push("SameSite=Lax");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));
}

function clearSessionCookie(res) {
  const isProduction = env.nodeEnv === "production";
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0"
  ];

  if (isProduction) {
    cookieParts.push("SameSite=None");
    cookieParts.push("Secure");
  } else {
    cookieParts.push("SameSite=Lax");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio ?? "",
    avatarUrl: user.avatar_url ?? "",
    city: user.city ?? "",
    instagramUrl: user.instagram_url ?? "",
    tiktokUrl: user.tiktok_url ?? "",
    featuredPostUrl: user.featured_post_url ?? ""
  };
}

function normalizeOptionalText(value, maxLength) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("invalid_text");
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.length > maxLength) {
    throw new Error("invalid_text_length");
  }

  return trimmedValue;
}

function normalizeOptionalUrl(value) {
  const normalizedValue = normalizeOptionalText(value, 300);

  if (!normalizedValue) {
    return null;
  }

  if (!/^https?:\/\//i.test(normalizedValue)) {
    throw new Error("invalid_url");
  }

  return normalizedValue;
}

export async function register(req, res) {
  const { name, email, password, role = "user" } = req.body;

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Los datos de registro no tienen un formato valido" });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName || !emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ message: "Nombre o email no validos" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "La contrasena debe tener al menos 8 caracteres" });
  }

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ message: "Rol de usuario no valido" });
  }

  try {
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [
      normalizedEmail
    ]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "El email ya esta registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [trimmedName, normalizedEmail, hashedPassword, role]
    );

    const user = sanitizeUser(result.rows[0]);

    const token = createToken(user);
    setSessionCookie(res, token);

    res.status(201).json({ user, token });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al registrar usuario" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Los datos de acceso no tienen un formato valido" });
  }

  if (!email || !password) {
    return res.status(400).json({ message: "Email y password son obligatorios" });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const result = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const token = createToken(user);
    setSessionCookie(res, token);

    res.json({ user: sanitizeUser(user), token });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al iniciar sesion" });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, bio, avatar_url, city, instagram_url, tiktok_url,
              featured_post_url
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const sanitizedUser = sanitizeUser(user);
    const refreshedToken = createToken(sanitizedUser);

    setSessionCookie(res, refreshedToken);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({ user: sanitizedUser, token: refreshedToken });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al obtener la sesion" });
  }
}

export function logout(_req, res) {
  clearSessionCookie(res);
  res.json({ message: "Sesion cerrada correctamente" });
}

export async function updateCurrentUser(req, res) {
  const trimmedName = typeof req.body.name === "string" ? req.body.name.trim() : "";

  if (!trimmedName) {
    return res.status(400).json({ message: "El nombre no puede quedar vacio" });
  }

  if (trimmedName.length > 100) {
    return res.status(400).json({ message: "El nombre es demasiado largo" });
  }

  try {
    const bio = normalizeOptionalText(req.body.bio, 500);
    const city = normalizeOptionalText(req.body.city, 120);
    const avatarUrl = normalizeOptionalUrl(req.body.avatarUrl);
    const instagramUrl = normalizeOptionalUrl(req.body.instagramUrl);
    const tiktokUrl = normalizeOptionalUrl(req.body.tiktokUrl);
    const featuredPostUrl = normalizeOptionalUrl(req.body.featuredPostUrl);

    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           bio = $2,
           city = $3,
           avatar_url = $4,
           instagram_url = $5,
           tiktok_url = $6,
           featured_post_url = $7
       WHERE id = $8
       RETURNING id, name, email, role, bio, avatar_url, city, instagram_url, tiktok_url,
                 featured_post_url`,
      [
        trimmedName,
        bio,
        city,
        avatarUrl,
        instagramUrl,
        tiktokUrl,
        featuredPostUrl,
        req.user.id
      ]
    );

    res.json({
      message: "Perfil actualizado correctamente",
      user: sanitizeUser(result.rows[0])
    });
  } catch (error) {
    if (
      error.message === "invalid_text" ||
      error.message === "invalid_text_length" ||
      error.message === "invalid_url"
    ) {
      return res.status(400).json({
        message: "Revisa los campos del perfil. Las URL deben empezar por http:// o https://"
      });
    }

    res.status(500).json({ message: "Error interno al actualizar el perfil" });
  }
}
