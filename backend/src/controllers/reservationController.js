import pool from "../config/db.js";

export async function createReservation(req, res) {
  const { businessId, reservationDate, people } = req.body;

  if (!businessId || !reservationDate || !people) {
    return res.status(400).json({ message: "Faltan datos para la reserva" });
  }

  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Solo los usuarios cliente pueden crear reservas" });
  }

  const parsedBusinessId = Number.parseInt(businessId, 10);
  const parsedPeople = Number.parseInt(people, 10);
  const parsedDate = new Date(reservationDate);

  if (!Number.isInteger(parsedBusinessId) || parsedBusinessId <= 0) {
    return res.status(400).json({ message: "El negocio indicado no es valido" });
  }

  if (!Number.isInteger(parsedPeople) || parsedPeople <= 0) {
    return res.status(400).json({ message: "El numero de personas no es valido" });
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: "La fecha de reserva no es valida" });
  }

  if (parsedDate <= new Date()) {
    return res.status(400).json({ message: "La reserva debe realizarse en una fecha futura" });
  }

  try {
    const businessResult = await pool.query("SELECT id FROM businesses WHERE id = $1", [
      parsedBusinessId
    ]);

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ message: "El negocio indicado no existe" });
    }

    const result = await pool.query(
      `INSERT INTO reservations (user_id, business_id, reservation_date, people, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [req.user.id, parsedBusinessId, parsedDate.toISOString(), parsedPeople]
    );

    res.status(201).json(result.rows[0]);
  } catch (_error) {
    res.status(500).json({ message: "Error interno al crear la reserva" });
  }
}

export async function getMyReservations(req, res) {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Solo los usuarios cliente pueden consultar reservas" });
  }

  try {
    const result = await pool.query(
      `SELECT r.id, r.reservation_date, r.people, r.status, b.name AS business_name
       FROM reservations r
       INNER JOIN businesses b ON b.id = r.business_id
       WHERE r.user_id = $1
       ORDER BY r.reservation_date ASC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener reservas" });
  }
}

export async function getBusinessReservations(req, res) {
  if (req.user.role !== "business") {
    return res
      .status(403)
      .json({ message: "Solo las cuentas de negocio pueden consultar esta vista" });
  }

  try {
    const businessResult = await pool.query("SELECT id, name FROM businesses WHERE user_id = $1", [
      req.user.id
    ]);

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        message: "Todavia no has creado la ficha del negocio en tu perfil"
      });
    }

    const business = businessResult.rows[0];
    const reservationsResult = await pool.query(
      `SELECT r.id, r.reservation_date, r.people, r.status, r.created_at,
              u.name AS customer_name, u.email AS customer_email
       FROM reservations r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.business_id = $1
       ORDER BY r.reservation_date ASC`,
      [business.id]
    );

    res.json({
      business,
      reservations: reservationsResult.rows
    });
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener las reservas del negocio" });
  }
}
