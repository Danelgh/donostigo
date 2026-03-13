import pool from "../config/db.js";

export async function getBusinesses(_req, res) {
  try {
    const result = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.phone, c.name AS category,
              COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
              COUNT(r.id)::int AS review_count
       FROM businesses b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN reviews r ON r.business_id = b.id
       GROUP BY b.id, c.name
       ORDER BY b.name ASC`
    );

    res.json(result.rows);
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener negocios" });
  }
}

export async function getBusinessById(req, res) {
  try {
    const businessResult = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.phone, c.name AS category,
              COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
              COUNT(r.id)::int AS review_count
       FROM businesses b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN reviews r ON r.business_id = b.id
       WHERE b.id = $1
       GROUP BY b.id, c.name`,
      [req.params.id]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    const reviewsResult = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.name AS author_name, u.avatar_url AS author_avatar, u.city AS author_city
       FROM reviews r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.business_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    res.json({
      ...businessResult.rows[0],
      reviews: reviewsResult.rows
    });
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener el negocio" });
  }
}
