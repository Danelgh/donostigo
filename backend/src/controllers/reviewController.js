import pool from "../config/db.js";

function normalizeComment(comment) {
  return typeof comment === "string" ? comment.trim() : "";
}

export async function createBusinessReview(req, res) {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Solo los usuarios cliente pueden publicar resenas" });
  }

  const businessId = Number.parseInt(req.params.id, 10);
  const rating = Number(req.body.rating);
  const comment = normalizeComment(req.body.comment);

  if (!Number.isInteger(businessId) || businessId <= 0) {
    return res.status(400).json({ message: "Identificador de negocio no valido" });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "La valoracion debe estar entre 1 y 5" });
  }

  if (comment.length < 12) {
    return res
      .status(400)
      .json({ message: "La resena debe tener al menos 12 caracteres" });
  }

  if (comment.length > 500) {
    return res
      .status(400)
      .json({ message: "La resena no puede superar los 500 caracteres" });
  }

  try {
    const businessResult = await pool.query("SELECT id FROM businesses WHERE id = $1", [businessId]);

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    const reservationResult = await pool.query(
      `SELECT id
       FROM reservations
       WHERE user_id = $1 AND business_id = $2
         AND status = 'confirmed'
         AND reservation_date < NOW()
       LIMIT 1`,
      [req.user.id, businessId]
    );

    if (reservationResult.rows.length === 0) {
      return res.status(403).json({
        message:
          "Solo puedes publicar una resena si ya has completado una reserva previa en este negocio"
      });
    }

    const reviewResult = await pool.query(
      `INSERT INTO reviews (user_id, business_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, business_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, business_id, rating, comment, created_at`,
      [req.user.id, businessId, rating, comment]
    );

    const reviewId = reviewResult.rows[0].id;
    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.name AS author_name, u.avatar_url AS author_avatar, u.city AS author_city
       FROM reviews r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.id = $1`,
      [reviewId]
    );

    res.status(201).json({
      message: "Resena guardada correctamente",
      review: result.rows[0]
    });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al guardar la resena" });
  }
}
