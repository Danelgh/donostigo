import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import env from "../config/env.js";

const allowedRoles = new Set(["user", "business"]);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: "7d"
  });
}

export async function register(req, res) {
  const { name, email, password, role = "user" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName || !normalizedEmail.includes("@")) {
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

    const user = result.rows[0];

    res.status(201).json({
      user,
      token: createToken(user)
    });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al registrar usuario" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

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

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: createToken(user)
    });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al iniciar sesion" });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [
      req.user.id
    ]);

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ user });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al obtener la sesion" });
  }
}
