import pool from "../config/db.js";

function ensureUserRole(req, res) {
  if (req.user.role !== "user") {
    res.status(403).json({
      message: "Solo las cuentas de usuario cliente pueden gestionar guardados y listas"
    });
    return false;
  }

  return true;
}

function normalizeRequiredName(value) {
  if (typeof value !== "string") {
    throw new Error("invalid_name");
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("missing_name");
  }

  if (trimmedValue.length > 100) {
    throw new Error("name_too_long");
  }

  return trimmedValue;
}

function normalizeOptionalDescription(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("invalid_description");
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.length > 300) {
    throw new Error("description_too_long");
  }

  return trimmedValue;
}

function normalizeOptionalBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return false;
}

function parsePositiveInteger(value) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function buildUniqueShareSlug(client, baseName, userId, listId = null) {
  const baseSlug = `${slugify(baseName) || "guia"}-${userId}`;
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const result = await client.query(
      `SELECT id
       FROM saved_lists
       WHERE share_slug = $1
         AND ($2::integer IS NULL OR id <> $2)`,
      [candidate, listId]
    );

    if (result.rows.length === 0) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function buildUniqueListName(client, userId, baseName) {
  let candidate = baseName.trim() || "Nueva lista";
  let suffix = 2;

  while (true) {
    const result = await client.query(
      `SELECT id
       FROM saved_lists
       WHERE user_id = $1 AND name = $2`,
      [userId, candidate]
    );

    if (result.rows.length === 0) {
      return candidate;
    }

    candidate = `${baseName} (${suffix})`;
    suffix += 1;
  }
}

async function fetchSavedListItemsByIds(client, listIds) {
  if (!listIds.length) {
    return new Map();
  }

  const itemsResult = await client.query(
    `SELECT li.list_id AS "listId", li.created_at AS "savedAt",
            b.id, b.name, b.description, b.address, b.phone, b.service_mode AS "serviceMode",
            c.name AS category,
            COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
            COUNT(r.id)::int AS review_count
     FROM saved_list_items li
     INNER JOIN businesses b ON b.id = li.business_id
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN reviews r ON r.business_id = b.id
     WHERE li.list_id = ANY($1::int[])
     GROUP BY li.list_id, li.created_at, b.id, c.name
     ORDER BY li.created_at DESC`,
    [listIds]
  );

  return itemsResult.rows.reduce((summary, item) => {
    const currentItems = summary.get(item.listId) || [];
    currentItems.push(item);
    summary.set(item.listId, currentItems);
    return summary;
  }, new Map());
}

export async function getMySavedLists(req, res) {
  if (!ensureUserRole(req, res)) {
    return;
  }

  try {
    const listsResult = await pool.query(
      `SELECT l.id, l.name, l.description, l.is_public AS "isPublic", l.share_slug AS "shareSlug", l.created_at,
              COUNT(li.business_id)::int AS business_count
       FROM saved_lists l
       LEFT JOIN saved_list_items li ON li.list_id = l.id
       WHERE l.user_id = $1
       GROUP BY l.id
       ORDER BY l.created_at DESC, l.id DESC`,
      [req.user.id]
    );

    const lists = listsResult.rows;

    if (lists.length === 0) {
      return res.json([]);
    }

    const itemsByListId = await fetchSavedListItemsByIds(pool, lists.map((list) => list.id));

    res.json(
      lists.map((list) => ({
        ...list,
        businesses: itemsByListId.get(list.id) || []
      }))
    );
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener las listas guardadas" });
  }
}

export async function createSavedList(req, res) {
  if (!ensureUserRole(req, res)) {
    return;
  }

  try {
    const name = normalizeRequiredName(req.body.name);
    const description = normalizeOptionalDescription(req.body.description);
    const isPublic = normalizeOptionalBoolean(req.body.isPublic);
    const shareSlug = isPublic ? await buildUniqueShareSlug(pool, name, req.user.id) : null;

    const result = await pool.query(
      `INSERT INTO saved_lists (user_id, name, description, is_public, share_slug)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, is_public AS "isPublic", share_slug AS "shareSlug", created_at`,
      [req.user.id, name, description, isPublic, shareSlug]
    );

    res.status(201).json({
      message: "Lista creada correctamente",
      list: {
        ...result.rows[0],
        business_count: 0,
        businesses: []
      }
    });
  } catch (error) {
    if (
      error.message === "invalid_name" ||
      error.message === "missing_name" ||
      error.message === "name_too_long" ||
      error.message === "invalid_description" ||
      error.message === "description_too_long"
    ) {
      return res.status(400).json({
        message: "Revisa el nombre y la descripcion de la lista antes de guardarla"
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya tienes una lista con ese nombre"
      });
    }

    res.status(500).json({ message: "Error interno al crear la lista" });
  }
}

export async function updateSavedList(req, res) {
  if (!ensureUserRole(req, res)) {
    return;
  }

  const listId = parsePositiveInteger(req.params.id);

  if (!listId) {
    return res.status(400).json({ message: "Identificador de lista no valido" });
  }

  try {
    const name = normalizeRequiredName(req.body.name);
    const description = normalizeOptionalDescription(req.body.description);
    const isPublic = normalizeOptionalBoolean(req.body.isPublic);
    const existingResult = await pool.query(
      `SELECT id, user_id
       FROM saved_lists
       WHERE id = $1 AND user_id = $2`,
      [listId, req.user.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: "La lista no existe o no te pertenece" });
    }

    const shareSlug = isPublic ? await buildUniqueShareSlug(pool, name, req.user.id, listId) : null;
    const result = await pool.query(
      `UPDATE saved_lists
       SET name = $1,
           description = $2,
           is_public = $3,
           share_slug = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id, name, description, is_public AS "isPublic", share_slug AS "shareSlug", created_at`,
      [name, description, isPublic, shareSlug, listId, req.user.id]
    );

    const itemsByListId = await fetchSavedListItemsByIds(pool, [listId]);

    return res.json({
      message: isPublic
        ? "Lista publicada y actualizada correctamente"
        : "Lista actualizada correctamente",
      list: {
        ...result.rows[0],
        business_count: (itemsByListId.get(listId) || []).length,
        businesses: itemsByListId.get(listId) || []
      }
    });
  } catch (error) {
    if (
      error.message === "invalid_name" ||
      error.message === "missing_name" ||
      error.message === "name_too_long" ||
      error.message === "invalid_description" ||
      error.message === "description_too_long"
    ) {
      return res.status(400).json({
        message: "Revisa el nombre y la descripcion antes de actualizar la guia"
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya tienes otra lista con ese nombre"
      });
    }

    return res.status(500).json({ message: "Error interno al actualizar la lista" });
  }
}

export async function deleteSavedList(req, res) {
  if (!ensureUserRole(req, res)) {
    return;
  }

  const listId = parsePositiveInteger(req.params.id);

  if (!listId) {
    return res.status(400).json({ message: "Identificador de lista no valido" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM saved_lists WHERE id = $1 AND user_id = $2 RETURNING id",
      [listId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "La lista no existe o no te pertenece" });
    }

    res.json({ message: "Lista eliminada correctamente" });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al eliminar la lista" });
  }
}

export async function addBusinessToSavedList(req, res) {
  if (!ensureUserRole(req, res)) {
    return;
  }

  const listId = parsePositiveInteger(req.params.id);
  const businessId = parsePositiveInteger(req.body.businessId);

  if (!listId || !businessId) {
    return res.status(400).json({ message: "Lista o negocio no valido" });
  }

  try {
    const listResult = await pool.query(
      "SELECT id FROM saved_lists WHERE id = $1 AND user_id = $2",
      [listId, req.user.id]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({ message: "La lista no existe o no te pertenece" });
    }

    const businessResult = await pool.query("SELECT id FROM businesses WHERE id = $1", [businessId]);

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ message: "El negocio indicado no existe" });
    }

    const result = await pool.query(
      `INSERT INTO saved_list_items (list_id, business_id)
       VALUES ($1, $2)
       ON CONFLICT (list_id, business_id) DO NOTHING
       RETURNING list_id`,
      [listId, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ message: "Este negocio ya estaba guardado en la lista" });
    }

    res.status(201).json({ message: "Negocio guardado correctamente en la lista" });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al guardar el negocio en la lista" });
  }
}

export async function removeBusinessFromSavedList(req, res) {
  if (!ensureUserRole(req, res)) {
    return;
  }

  const listId = parsePositiveInteger(req.params.id);
  const businessId = parsePositiveInteger(req.params.businessId);

  if (!listId || !businessId) {
    return res.status(400).json({ message: "Lista o negocio no valido" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM saved_list_items
       WHERE list_id = $1
         AND business_id = $2
         AND list_id IN (
           SELECT id FROM saved_lists WHERE id = $1 AND user_id = $3
         )
       RETURNING list_id`,
      [listId, businessId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "El guardado no existe o no tienes permiso para modificar esa lista"
      });
    }

    res.json({ message: "Negocio eliminado de la lista correctamente" });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al eliminar el guardado" });
  }
}

export async function getPublicSavedLists(_req, res) {
  try {
    const listsResult = await pool.query(
      `SELECT l.id, l.name, l.description, l.share_slug AS "shareSlug", l.created_at,
              u.name AS author_name,
              COUNT(li.business_id)::int AS business_count
       FROM saved_lists l
       INNER JOIN users u ON u.id = l.user_id
       LEFT JOIN saved_list_items li ON li.list_id = l.id
       WHERE l.is_public = TRUE
       GROUP BY l.id, u.name
       ORDER BY l.created_at DESC, l.id DESC`
    );

    const lists = listsResult.rows;
    const itemsByListId = await fetchSavedListItemsByIds(pool, lists.map((list) => list.id));

    return res.json(
      lists.map((list) => ({
        ...list,
        businesses: itemsByListId.get(list.id) || []
      }))
    );
  } catch (_error) {
    return res.status(500).json({ message: "Error al obtener las guias publicas" });
  }
}

export async function getPublicSavedListBySlug(req, res) {
  const slug = typeof req.params.slug === "string" ? req.params.slug.trim() : "";

  if (!slug) {
    return res.status(400).json({ message: "Identificador de guia no valido" });
  }

  try {
    const listResult = await pool.query(
      `SELECT l.id, l.name, l.description, l.share_slug AS "shareSlug", l.created_at,
              u.name AS author_name
       FROM saved_lists l
       INNER JOIN users u ON u.id = l.user_id
       WHERE l.is_public = TRUE AND l.share_slug = $1`,
      [slug]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({ message: "La guia publica indicada no existe" });
    }

    const list = listResult.rows[0];
    const itemsByListId = await fetchSavedListItemsByIds(pool, [list.id]);

    return res.json({
      ...list,
      business_count: (itemsByListId.get(list.id) || []).length,
      businesses: itemsByListId.get(list.id) || []
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error al obtener la guia publica" });
  }
}

export async function clonePublicSavedList(req, res) {
  if (!ensureUserRole(req, res)) {
    return;
  }

  const slug = typeof req.params.slug === "string" ? req.params.slug.trim() : "";

  if (!slug) {
    return res.status(400).json({ message: "Identificador de guia no valido" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sourceResult = await client.query(
      `SELECT id, name, description
       FROM saved_lists
       WHERE is_public = TRUE AND share_slug = $1`,
      [slug]
    );

    if (sourceResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "La guia publica indicada no existe" });
    }

    const sourceList = sourceResult.rows[0];
    const nextName = await buildUniqueListName(client, req.user.id, `${sourceList.name} · copia`);
    const createdListResult = await client.query(
      `INSERT INTO saved_lists (user_id, name, description, is_public, share_slug)
       VALUES ($1, $2, $3, FALSE, NULL)
       RETURNING id, name, description, is_public AS "isPublic", share_slug AS "shareSlug", created_at`,
      [req.user.id, nextName, sourceList.description]
    );

    const newList = createdListResult.rows[0];
    await client.query(
      `INSERT INTO saved_list_items (list_id, business_id)
       SELECT $1, business_id
       FROM saved_list_items
       WHERE list_id = $2`,
      [newList.id, sourceList.id]
    );

    await client.query("COMMIT");

    const itemsByListId = await fetchSavedListItemsByIds(pool, [newList.id]);

    return res.status(201).json({
      message: "La guia se ha copiado a tus guardados",
      list: {
        ...newList,
        business_count: (itemsByListId.get(newList.id) || []).length,
        businesses: itemsByListId.get(newList.id) || []
      }
    });
  } catch (_error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Error interno al copiar la guia publica" });
  } finally {
    client.release();
  }
}
