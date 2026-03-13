import pool from "../config/db.js";

export async function getBusinesses(_req, res) {
  try {
    const result = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.phone, c.name AS category
       FROM businesses b
       LEFT JOIN categories c ON c.id = b.category_id
       ORDER BY b.name ASC`
    );

    res.json(result.rows);
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener negocios" });
  }
}

export async function getBusinessById(req, res) {
  try {
    const result = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.phone, c.name AS category
       FROM businesses b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener el negocio" });
  }
}
