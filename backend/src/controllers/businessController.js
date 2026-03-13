import pool from "../config/db.js";

function normalizeRequiredText(value, fieldLabel, maxLength) {
  if (typeof value !== "string") {
    throw new Error(`${fieldLabel}_invalid`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldLabel}_required`);
  }

  if (trimmedValue.length > maxLength) {
    throw new Error(`${fieldLabel}_length`);
  }

  return trimmedValue;
}

function normalizeOptionalText(value, maxLength) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("optional_invalid");
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.length > maxLength) {
    throw new Error("optional_length");
  }

  return trimmedValue;
}

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

export async function getCategories(_req, res) {
  try {
    const result = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");
    res.json(result.rows);
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener categorias" });
  }
}

export async function getMyBusiness(req, res) {
  if (req.user.role !== "business") {
    return res.status(403).json({ message: "Solo las cuentas de negocio pueden acceder a esta vista" });
  }

  try {
    const result = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.phone,
              b.category_id AS "categoryId", c.name AS category
       FROM businesses b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.user_id = $1`,
      [req.user.id]
    );

    res.json({
      business: result.rows[0] ?? null
    });
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener la ficha del negocio" });
  }
}

export async function upsertMyBusiness(req, res) {
  if (req.user.role !== "business") {
    return res
      .status(403)
      .json({ message: "Solo las cuentas de negocio pueden guardar esta ficha" });
  }

  try {
    const name = normalizeRequiredText(req.body.name, "name", 150);
    const description = normalizeRequiredText(req.body.description, "description", 1200);
    const address = normalizeRequiredText(req.body.address, "address", 200);
    const phone = normalizeOptionalText(req.body.phone, 30);
    const categoryId = Number.parseInt(req.body.categoryId, 10);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Debes seleccionar una categoria valida" });
    }

    const categoryResult = await pool.query("SELECT id, name FROM categories WHERE id = $1", [
      categoryId
    ]);

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "La categoria seleccionada no existe" });
    }

    const existingBusinessResult = await pool.query(
      "SELECT id FROM businesses WHERE user_id = $1",
      [req.user.id]
    );

    let result;

    if (existingBusinessResult.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO businesses (user_id, category_id, name, description, address, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, description, address, phone, category_id AS "categoryId"`,
        [req.user.id, categoryId, name, description, address, phone]
      );
    } else {
      result = await pool.query(
        `UPDATE businesses
         SET category_id = $1,
             name = $2,
             description = $3,
             address = $4,
             phone = $5
         WHERE user_id = $6
         RETURNING id, name, description, address, phone, category_id AS "categoryId"`,
        [categoryId, name, description, address, phone, req.user.id]
      );
    }

    res.json({
      message: "Ficha de negocio guardada correctamente",
      business: {
        ...result.rows[0],
        category: categoryResult.rows[0].name
      }
    });
  } catch (error) {
    if (
      error.message.endsWith("_required") ||
      error.message.endsWith("_invalid") ||
      error.message.endsWith("_length") ||
      error.message === "optional_invalid" ||
      error.message === "optional_length"
    ) {
      return res.status(400).json({
        message: "Revisa los datos de la ficha. Hay campos obligatorios vacios o demasiado largos."
      });
    }

    res.status(500).json({ message: "Error interno al guardar la ficha del negocio" });
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
