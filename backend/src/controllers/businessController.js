import pool from "../config/db.js";
import {
  buildDefaultScheduleRules,
  hydrateScheduleRules,
  normalizeScheduleExceptions,
  normalizeScheduleRules
} from "../utils/businessSchedule.js";

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

function normalizeServiceEntries(rawServices) {
  if (!Array.isArray(rawServices)) {
    return [];
  }

  return rawServices
    .map((service) => {
      if (!service || typeof service !== "object") {
        return null;
      }

      const kind = normalizeServiceKind(service.kind);
      const title = typeof service.title === "string" ? service.title.trim() : "";
      const description = typeof service.description === "string" ? service.description.trim() : "";
      const priceLabel =
        typeof service.priceLabel === "string" ? service.priceLabel.trim().slice(0, 80) : "";
      const durationMinutes =
        service.durationMinutes === "" || service.durationMinutes === null || service.durationMinutes === undefined
          ? null
          : Number.parseInt(service.durationMinutes, 10);
      const capacity =
        service.capacity === "" || service.capacity === null || service.capacity === undefined
          ? null
          : Number.parseInt(service.capacity, 10);

      if (!title && !description && !priceLabel && durationMinutes === null && capacity === null) {
        return null;
      }

      if (!title || !description) {
        throw new Error("service_entry_required");
      }

      if (title.length > 120 || description.length > 500) {
        throw new Error("service_entry_length");
      }

      if ((durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) ||
          (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0))) {
        throw new Error("service_entry_invalid");
      }

      return {
        kind,
        title,
        description,
        priceLabel: priceLabel || null,
        durationMinutes,
        capacity
      };
    })
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeFaqEntries(rawFaqs) {
  if (!Array.isArray(rawFaqs)) {
    return [];
  }

  return rawFaqs
    .map((faq, index) => {
      if (!faq || typeof faq !== "object") {
        return null;
      }

      const question = typeof faq.question === "string" ? faq.question.trim() : "";
      const answer = typeof faq.answer === "string" ? faq.answer.trim() : "";

      if (!question && !answer) {
        return null;
      }

      if (!question || !answer) {
        throw new Error("faq_entry_required");
      }

      if (question.length > 160 || answer.length > 600) {
        throw new Error("faq_entry_length");
      }

      return {
        question,
        answer,
        sortOrder: index + 1
      };
    })
    .filter(Boolean)
    .slice(0, 6);
}

function formatStoredTime(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return null;
  }

  return `${match[1]}:${match[2]}`;
}

function formatScheduleRuleRow(row) {
  return {
    dayOfWeek: row.dayOfWeek,
    label: row.label,
    isOpen: row.isOpen,
    openTime: formatStoredTime(row.openTime),
    closeTime: formatStoredTime(row.closeTime),
    slotIntervalMinutes: row.slotIntervalMinutes
  };
}

function formatScheduleExceptionRow(row) {
  return {
    exceptionDate: row.exceptionDate,
    isClosed: row.isClosed,
    openTime: formatStoredTime(row.openTime),
    closeTime: formatStoredTime(row.closeTime),
    slotIntervalMinutes: row.slotIntervalMinutes,
    note: row.note ?? null
  };
}

async function fetchBusinessScheduleContent(businessId, category) {
  const [rulesResult, exceptionsResult] = await Promise.all([
    pool.query(
      `SELECT day_of_week AS "dayOfWeek",
              CASE day_of_week
                WHEN 1 THEN 'Lunes'
                WHEN 2 THEN 'Martes'
                WHEN 3 THEN 'Miercoles'
                WHEN 4 THEN 'Jueves'
                WHEN 5 THEN 'Viernes'
                WHEN 6 THEN 'Sabado'
                ELSE 'Domingo'
              END AS label,
              is_open AS "isOpen",
              open_time::text AS "openTime",
              close_time::text AS "closeTime",
              slot_interval_minutes AS "slotIntervalMinutes"
       FROM business_schedule_rules
       WHERE business_id = $1
       ORDER BY CASE day_of_week WHEN 0 THEN 7 ELSE day_of_week END ASC`,
      [businessId]
    ),
    pool.query(
      `SELECT exception_date::text AS "exceptionDate",
              is_closed AS "isClosed",
              open_time::text AS "openTime",
              close_time::text AS "closeTime",
              slot_interval_minutes AS "slotIntervalMinutes",
              note
       FROM business_schedule_exceptions
       WHERE business_id = $1
       ORDER BY exception_date ASC`,
      [businessId]
    )
  ]);

  const scheduleRules =
    rulesResult.rows.length > 0
      ? hydrateScheduleRules(rulesResult.rows.map(formatScheduleRuleRow), category)
      : buildDefaultScheduleRules(category);

  return {
    scheduleRules,
    scheduleExceptions: exceptionsResult.rows.map(formatScheduleExceptionRow),
    scheduleSource: rulesResult.rows.length > 0 ? "custom" : "default"
  };
}

const businessSortMap = {
  name_asc: "b.name ASC",
  name_desc: "b.name DESC",
  rating_desc: "average_rating DESC, b.name ASC"
};

const allowedServiceModes = new Set(["booking", "session", "request"]);
const allowedServiceKinds = new Set(["service", "voucher", "pack", "request"]);

function normalizeServiceMode(value) {
  if (typeof value !== "string") {
    throw new Error("service_mode_invalid");
  }

  const trimmedValue = value.trim();

  if (!allowedServiceModes.has(trimmedValue)) {
    throw new Error("service_mode_invalid");
  }

  return trimmedValue;
}

function normalizeServiceKind(value) {
  if (value === undefined || value === null || value === "") {
    return "service";
  }

  if (typeof value !== "string") {
    throw new Error("service_kind_invalid");
  }

  const trimmedValue = value.trim();

  if (!allowedServiceKinds.has(trimmedValue)) {
    throw new Error("service_kind_invalid");
  }

  return trimmedValue;
}

function buildBusinessBrandFallback(business) {
  const serviceMode = business.serviceMode || "booking";
  const category = business.category || "";

  const heroBadge =
    serviceMode === "booking"
      ? "Reserva directa"
      : serviceMode === "session"
        ? "Plazas limitadas"
        : "Atencion a medida";

  let heroClaim = "Negocio local con una propuesta clara dentro de DonostiGo.";

  switch (category) {
    case "Restauracion":
      heroClaim = "Una propuesta local pensada para reservar sin friccion y disfrutar con tiempo.";
      break;
    case "Cafeterias y brunch":
      heroClaim = "Un plan de barrio para desayunar, quedar o alargar la manana.";
      break;
    case "Deporte":
      heroClaim = "Actividad con agenda viva, plazas limitadas y foco claro en la experiencia.";
      break;
    case "Bienestar y estetica":
      heroClaim = "Una ficha diseñada para pedir cita o propuesta con total claridad.";
      break;
    case "Ocio":
      heroClaim = "Planes cerrados y experiencias que se entienden de un vistazo.";
      break;
    case "Turismo y visitas guiadas":
      heroClaim = "Descubrir Donostia tambien puede sentirse editorial y bien curado.";
      break;
    case "Cultura y talleres":
      heroClaim = "Plazas, materiales y sesiones explicadas como un portal real.";
      break;
    case "Formacion y clases":
      heroClaim = "Oferta pensada para grupos pequenos, seguimiento y continuidad.";
      break;
    default:
      break;
  }

  const heroHighlight =
    serviceMode === "booking"
      ? "La experiencia combina agenda clara, horarios vivos y reserva directa desde la ficha pública."
      : serviceMode === "session"
        ? "Cada servicio trabaja con cupos reales, turnos visibles y lista de espera cuando se completa una sesión."
        : "Aquí la interacción es más flexible: el usuario envía una solicitud y el negocio responde con una propuesta cerrada.";

  return {
    heroBadge,
    heroClaim,
    heroHighlight
  };
}

function applyBusinessBrandFallback(business) {
  const fallback = buildBusinessBrandFallback(business);

  return {
    ...business,
    heroBadge: business.heroBadge ?? fallback.heroBadge,
    heroClaim: business.heroClaim ?? fallback.heroClaim,
    heroHighlight: business.heroHighlight ?? fallback.heroHighlight
  };
}

function toInteger(value) {
  return Number.parseInt(value, 10) || 0;
}

function toDecimal(value) {
  return Number.parseFloat(value) || 0;
}

async function buildBusinessInsights(businessId) {
  const [
    reservationStatsResult,
    waitlistStatsResult,
    requestStatsResult,
    reviewStatsResult,
    topServiceResult,
    performanceStatsResult,
    timelineResult
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
              COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
              COUNT(*) FILTER (
                WHERE status <> 'cancelled' AND reservation_date >= NOW()
              )::int AS upcoming
       FROM reservations
       WHERE business_id = $1`,
      [businessId]
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'active')::int AS active,
              COUNT(*) FILTER (WHERE status = 'converted')::int AS converted,
              COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
       FROM reservation_waitlist
       WHERE business_id = $1`,
      [businessId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
              COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
       FROM business_requests
       WHERE business_id = $1`,
      [businessId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average_rating
       FROM reviews
       WHERE business_id = $1`,
      [businessId]
    ),
    pool.query(
      `SELECT COALESCE(s.title, 'Interaccion general') AS title,
              COUNT(*)::int AS total_demand
       FROM (
         SELECT business_service_id AS service_id
         FROM reservations
         WHERE business_id = $1
         UNION ALL
         SELECT business_service_id AS service_id
         FROM reservation_waitlist
         WHERE business_id = $1
         UNION ALL
         SELECT business_service_id AS service_id
         FROM business_requests
         WHERE business_id = $1
       ) demand
       LEFT JOIN business_services s ON s.id = demand.service_id
       GROUP BY COALESCE(s.title, 'Interaccion general')
      ORDER BY total_demand DESC, title ASC
      LIMIT 1`,
      [businessId]
    ),
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int
          FROM reviews
          WHERE business_id = $1
            AND business_response IS NOT NULL
            AND BTRIM(business_response) <> '') AS reviews_answered,
         (SELECT COUNT(*)::int
          FROM reviews
          WHERE business_id = $1) AS reviews_total,
         (SELECT COUNT(*)::int
          FROM business_requests
          WHERE business_id = $1
            AND status IN ('approved', 'rejected', 'accepted', 'declined')) AS requests_resolved,
         (SELECT COUNT(*)::int
          FROM business_requests
          WHERE business_id = $1) AS requests_total,
         (SELECT COUNT(*)::int
          FROM reservation_waitlist
          WHERE business_id = $1
            AND status = 'converted') AS waitlist_converted,
         (SELECT COUNT(*)::int
          FROM reservation_waitlist
          WHERE business_id = $1) AS waitlist_total`,
      [businessId]
    ),
    pool.query(
      `WITH calendar AS (
         SELECT generate_series(
                  CURRENT_DATE,
                  CURRENT_DATE + INTERVAL '6 day',
                  INTERVAL '1 day'
                )::date AS day
       ),
       activity AS (
         SELECT reservation_date::date AS day, 'reservation'::text AS type
         FROM reservations
         WHERE business_id = $1
           AND status <> 'cancelled'
           AND reservation_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '6 day'
         UNION ALL
         SELECT desired_slot::date AS day, 'waitlist'::text AS type
         FROM reservation_waitlist
         WHERE business_id = $1
           AND status = 'active'
           AND desired_slot::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '6 day'
         UNION ALL
         SELECT COALESCE(proposed_date, preferred_date, created_at)::date AS day, 'request'::text AS type
         FROM business_requests
         WHERE business_id = $1
           AND status IN ('pending', 'approved', 'accepted')
           AND COALESCE(proposed_date, preferred_date, created_at)::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '6 day'
       )
       SELECT calendar.day::text AS day,
              COUNT(*) FILTER (WHERE activity.type = 'reservation')::int AS reservations,
              COUNT(*) FILTER (WHERE activity.type = 'waitlist')::int AS waitlist,
              COUNT(*) FILTER (WHERE activity.type = 'request')::int AS requests
       FROM calendar
       LEFT JOIN activity ON activity.day = calendar.day
       GROUP BY calendar.day
       ORDER BY calendar.day ASC`,
      [businessId]
    )
  ]);

  const reservationStats = reservationStatsResult.rows[0] ?? {};
  const waitlistStats = waitlistStatsResult.rows[0] ?? {};
  const requestStats = requestStatsResult.rows[0] ?? {};
  const reviewStats = reviewStatsResult.rows[0] ?? {};
  const topService = topServiceResult.rows[0] ?? null;
  const performanceStats = performanceStatsResult.rows[0] ?? {};
  const requestResolutionRate =
    toInteger(performanceStats.requests_total) > 0
      ? Math.round(
          (toInteger(performanceStats.requests_resolved) / toInteger(performanceStats.requests_total)) *
            100
        )
      : 0;
  const waitlistConversionRate =
    toInteger(performanceStats.waitlist_total) > 0
      ? Math.round(
          (toInteger(performanceStats.waitlist_converted) / toInteger(performanceStats.waitlist_total)) *
            100
        )
      : 0;
  const reviewResponseRate =
    toInteger(performanceStats.reviews_total) > 0
      ? Math.round(
          (toInteger(performanceStats.reviews_answered) / toInteger(performanceStats.reviews_total)) *
            100
        )
      : 0;

  return {
    reservations: {
      total: toInteger(reservationStats.total),
      pending: toInteger(reservationStats.pending),
      confirmed: toInteger(reservationStats.confirmed),
      cancelled: toInteger(reservationStats.cancelled),
      upcoming: toInteger(reservationStats.upcoming)
    },
    waitlist: {
      active: toInteger(waitlistStats.active),
      converted: toInteger(waitlistStats.converted),
      cancelled: toInteger(waitlistStats.cancelled)
    },
    requests: {
      total: toInteger(requestStats.total),
      pending: toInteger(requestStats.pending),
      approved: toInteger(requestStats.approved),
      rejected: toInteger(requestStats.rejected)
    },
    reviews: {
      total: toInteger(reviewStats.total),
      averageRating: toDecimal(reviewStats.average_rating)
    },
    topService: topService
      ? {
          title: topService.title,
          totalDemand: toInteger(topService.total_demand)
        }
      : null,
    responseHealth: {
      requestResolutionRate,
      waitlistConversionRate,
      reviewResponseRate
    },
    activityTimeline: timelineResult.rows.map((row) => ({
      day: row.day,
      reservations: toInteger(row.reservations),
      waitlist: toInteger(row.waitlist),
      requests: toInteger(row.requests)
    }))
  };
}

async function buildBusinessAlerts(businessId) {
  const [pendingReservationsResult, activeWaitlistResult, pendingRequestsResult, unansweredReviewsResult] =
    await Promise.all([
      pool.query(
        `SELECT id, reservation_date, people
         FROM reservations
         WHERE business_id = $1 AND status = 'pending'
         ORDER BY reservation_date ASC
         LIMIT 3`,
        [businessId]
      ),
      pool.query(
        `SELECT id, desired_slot, people
         FROM reservation_waitlist
         WHERE business_id = $1 AND status = 'active'
         ORDER BY desired_slot ASC
         LIMIT 3`,
        [businessId]
      ),
      pool.query(
        `SELECT id, created_at, quoted_price_label AS "quotedPriceLabel", voucher_status AS "voucherStatus"
         FROM business_requests
         WHERE business_id = $1 AND status = 'pending'
         ORDER BY created_at DESC
         LIMIT 3`,
        [businessId]
      ),
      pool.query(
        `SELECT id, created_at, rating
         FROM reviews
         WHERE business_id = $1 AND (business_response IS NULL OR business_response = '')
         ORDER BY created_at DESC
         LIMIT 3`,
        [businessId]
      )
    ]);

  const alerts = [];
  const now = Date.now();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  function buildAlertEnvelope(baseAlert) {
    const metaTimestamp = new Date(baseAlert.meta).getTime();
    const isToday = Number.isFinite(metaTimestamp) && metaTimestamp <= todayEnd.getTime();
    const bucket = isToday ? "today" : "follow_up";

    return {
      ...baseAlert,
      priority: baseAlert.priority || "normal",
      bucket
    };
  }

  pendingReservationsResult.rows.forEach((item) => {
    const reservationDate = new Date(item.reservation_date);
    alerts.push(buildAlertEnvelope({
      type: "reservation_pending",
      title: "Reserva pendiente de confirmar",
      meta: reservationDate.toISOString(),
      description: `${item.people} persona${item.people === 1 ? "" : "s"} esperan validación en agenda.`
    }));
  });

  activeWaitlistResult.rows.forEach((item) => {
    const slotDate = new Date(item.desired_slot);
    alerts.push(buildAlertEnvelope({
      type: "waitlist_active",
      title: "Lista de espera activa",
      meta: slotDate.toISOString(),
      priority: slotDate.getTime() <= now + 48 * 60 * 60 * 1000 ? "high" : "normal",
      description: `${item.people} persona${item.people === 1 ? "" : "s"} siguen esperando hueco en esta franja.`
    }));
  });

  pendingRequestsResult.rows.forEach((item) => {
    alerts.push(buildAlertEnvelope({
      type: "request_pending",
      title: "Solicitud manual por revisar",
      meta: new Date(item.created_at).toISOString(),
      priority: "high",
      description: item.quotedPriceLabel
        ? `Tienes una solicitud abierta con referencia ${item.quotedPriceLabel}.`
        : "Hay una solicitud pendiente que todavía no tiene propuesta cerrada."
    }));
  });

  unansweredReviewsResult.rows.forEach((item) => {
    alerts.push(buildAlertEnvelope({
      type: "review_unanswered",
      title: "Reseña sin respuesta",
      meta: new Date(item.created_at).toISOString(),
      priority: "normal",
      description: `Una opinión de ${item.rating}/5 sigue sin respuesta pública.`
    }));
  });

  return alerts
    .sort((left, right) => new Date(right.meta).getTime() - new Date(left.meta).getTime())
    .slice(0, 8);
}

export async function getBusinesses(req, res) {
  try {
    const searchQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const selectedCategory =
      typeof req.query.category === "string" && req.query.category !== "all"
        ? req.query.category.trim()
        : "";
    const selectedSort =
      typeof req.query.sort === "string" ? req.query.sort.trim() : "name_asc";
    const orderByClause = businessSortMap[selectedSort] || businessSortMap.name_asc;

    const result = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.phone, b.service_mode AS "serviceMode", c.name AS category,
              u.avatar_url AS "imageUrl",
              b.hero_badge AS "heroBadge",
              b.hero_claim AS "heroClaim",
              COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
              COUNT(r.id)::int AS review_count
       FROM businesses b
       INNER JOIN users u ON u.id = b.user_id
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN reviews r ON r.business_id = b.id
       WHERE ($1 = '' OR b.name ILIKE '%' || $1 || '%')
         AND ($2 = '' OR c.name = $2)
       GROUP BY b.id, c.name, u.avatar_url
       ORDER BY ${orderByClause}`,
      [searchQuery, selectedCategory]
    );

    res.json(result.rows.map(applyBusinessBrandFallback));
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

export async function getRecommendedBusinesses(req, res) {
  if (req.user.role !== "user") {
    return res.status(403).json({
      message: "Solo las cuentas de usuario cliente pueden consultar recomendaciones"
    });
  }

  try {
    const result = await pool.query(
      `WITH user_categories AS (
         SELECT DISTINCT b.category_id
         FROM reservations r
         INNER JOIN businesses b ON b.id = r.business_id
         WHERE r.user_id = $1
         UNION
         SELECT DISTINCT b.category_id
         FROM business_requests br
         INNER JOIN businesses b ON b.id = br.business_id
         WHERE br.user_id = $1
         UNION
         SELECT DISTINCT b.category_id
         FROM saved_lists sl
         INNER JOIN saved_list_items sli ON sli.list_id = sl.id
         INNER JOIN businesses b ON b.id = sli.business_id
         WHERE sl.user_id = $1
       ),
       interacted_businesses AS (
         SELECT business_id
         FROM reservations
         WHERE user_id = $1
         UNION
         SELECT business_id
         FROM business_requests
         WHERE user_id = $1
         UNION
         SELECT sli.business_id
         FROM saved_lists sl
         INNER JOIN saved_list_items sli ON sli.list_id = sl.id
         WHERE sl.user_id = $1
       )
       SELECT b.id,
              b.name,
              b.description,
              b.address,
              b.phone,
              b.service_mode AS "serviceMode",
              c.name AS category,
              u.avatar_url AS "imageUrl",
              b.hero_badge AS "heroBadge",
              b.hero_claim AS "heroClaim",
              COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
              COUNT(r.id)::int AS review_count,
              CASE
                WHEN EXISTS (
                  SELECT 1
                  FROM user_categories uc
                  WHERE uc.category_id = b.category_id
                ) THEN true
                ELSE false
              END AS "matchesProfile"
       FROM businesses b
       INNER JOIN users u ON u.id = b.user_id
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN reviews r ON r.business_id = b.id
       WHERE b.id NOT IN (SELECT business_id FROM interacted_businesses)
       GROUP BY b.id, c.name, u.avatar_url
       ORDER BY
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM user_categories uc
             WHERE uc.category_id = b.category_id
           ) THEN 0
           ELSE 1
         END,
         average_rating DESC,
         review_count DESC,
         b.name ASC
       LIMIT 4`,
      [req.user.id]
    );

    return res.json(result.rows.map(applyBusinessBrandFallback));
  } catch (_error) {
    return res.status(500).json({ message: "Error al obtener recomendaciones" });
  }
}

export async function getMyBusiness(req, res) {
  if (req.user.role !== "business") {
    return res.status(403).json({ message: "Solo las cuentas de negocio pueden acceder a esta vista" });
  }

  try {
    const result = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.phone,
              b.category_id AS "categoryId", b.service_mode AS "serviceMode", c.name AS category,
              b.visit_note AS "visitNote", b.cancellation_policy AS "cancellationPolicy",
              b.hero_badge AS "heroBadge", b.hero_claim AS "heroClaim", b.hero_highlight AS "heroHighlight"
       FROM businesses b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.user_id = $1`,
      [req.user.id]
    );

    const business = result.rows[0] ?? null;

    if (!business) {
      return res.json({ business: null });
    }

    const servicesResult = await pool.query(
      `SELECT id, kind, title, description, price_label AS "priceLabel",
              duration_minutes AS "durationMinutes", capacity
       FROM business_services
       WHERE business_id = $1
       ORDER BY created_at ASC, id ASC`,
      [business.id]
    );

    const faqsResult = await pool.query(
      `SELECT id, question, answer, sort_order AS "sortOrder"
       FROM business_faqs
       WHERE business_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [business.id]
    );
    const [insights, alerts] = await Promise.all([
      buildBusinessInsights(business.id),
      buildBusinessAlerts(business.id)
    ]);
    const scheduleContent = await fetchBusinessScheduleContent(business.id, business.category);

    res.json({
      business: {
        ...business,
        services: servicesResult.rows,
        faqs: faqsResult.rows,
        scheduleRules: scheduleContent.scheduleRules,
        scheduleExceptions: scheduleContent.scheduleExceptions,
        scheduleSource: scheduleContent.scheduleSource,
        alerts,
        insights
      }
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
    const visitNote = normalizeOptionalText(req.body.visitNote, 600);
    const cancellationPolicy = normalizeOptionalText(req.body.cancellationPolicy, 600);
    const heroBadge = normalizeOptionalText(req.body.heroBadge, 80);
    const heroClaim = normalizeOptionalText(req.body.heroClaim, 160);
    const heroHighlight = normalizeOptionalText(req.body.heroHighlight, 320);
    const categoryId = Number.parseInt(req.body.categoryId, 10);
    const serviceMode = normalizeServiceMode(req.body.serviceMode);
    const services = normalizeServiceEntries(req.body.services);
    const faqs = normalizeFaqEntries(req.body.faqs);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Debes seleccionar una categoria valida" });
    }

    const categoryResult = await pool.query("SELECT id, name FROM categories WHERE id = $1", [
      categoryId
    ]);

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: "La categoria seleccionada no existe" });
    }

    const categoryName = categoryResult.rows[0].name;
    const scheduleRules = normalizeScheduleRules(req.body.scheduleRules, categoryName);
    const scheduleExceptions = normalizeScheduleExceptions(req.body.scheduleExceptions);

    const client = await pool.connect();
    let result;

    try {
      await client.query("BEGIN");

      const existingBusinessResult = await client.query(
        "SELECT id FROM businesses WHERE user_id = $1",
        [req.user.id]
      );

      if (existingBusinessResult.rows.length === 0) {
        result = await client.query(
          `INSERT INTO businesses (
             user_id,
             category_id,
             service_mode,
             name,
             description,
             address,
             phone,
             visit_note,
             cancellation_policy,
             hero_badge,
             hero_claim,
             hero_highlight
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id, name, description, address, phone,
                     visit_note AS "visitNote",
                     cancellation_policy AS "cancellationPolicy",
                     hero_badge AS "heroBadge",
                     hero_claim AS "heroClaim",
                     hero_highlight AS "heroHighlight",
                     service_mode AS "serviceMode",
                     category_id AS "categoryId"`,
          [
            req.user.id,
            categoryId,
            serviceMode,
            name,
            description,
            address,
            phone,
            visitNote,
            cancellationPolicy,
            heroBadge,
            heroClaim,
            heroHighlight
          ]
        );
      } else {
        result = await client.query(
          `UPDATE businesses
           SET category_id = $1,
               service_mode = $2,
               name = $3,
               description = $4,
               address = $5,
               phone = $6,
               visit_note = $7,
               cancellation_policy = $8,
               hero_badge = $9,
               hero_claim = $10,
               hero_highlight = $11
           WHERE user_id = $12
           RETURNING id, name, description, address, phone,
                     visit_note AS "visitNote",
                     cancellation_policy AS "cancellationPolicy",
                     hero_badge AS "heroBadge",
                     hero_claim AS "heroClaim",
                     hero_highlight AS "heroHighlight",
                     service_mode AS "serviceMode",
                     category_id AS "categoryId"`,
          [
            categoryId,
            serviceMode,
            name,
            description,
            address,
            phone,
            visitNote,
            cancellationPolicy,
            heroBadge,
            heroClaim,
            heroHighlight,
            req.user.id
          ]
        );
      }

      const businessId = result.rows[0].id;

      await client.query("DELETE FROM business_services WHERE business_id = $1", [businessId]);
      await client.query("DELETE FROM business_faqs WHERE business_id = $1", [businessId]);
      await client.query("DELETE FROM business_schedule_rules WHERE business_id = $1", [businessId]);
      await client.query("DELETE FROM business_schedule_exceptions WHERE business_id = $1", [businessId]);

      for (const service of services) {
        await client.query(
          `INSERT INTO business_services (business_id, kind, title, description, price_label, duration_minutes, capacity)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            businessId,
            service.kind,
            service.title,
            service.description,
            service.priceLabel,
            service.durationMinutes,
            service.capacity
          ]
        );
      }

      for (const faq of faqs) {
        await client.query(
          `INSERT INTO business_faqs (business_id, question, answer, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [businessId, faq.question, faq.answer, faq.sortOrder]
        );
      }

      for (const scheduleRule of scheduleRules) {
        await client.query(
          `INSERT INTO business_schedule_rules (
             business_id,
             day_of_week,
             is_open,
             open_time,
             close_time,
             slot_interval_minutes
           )
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            businessId,
            scheduleRule.dayOfWeek,
            scheduleRule.isOpen,
            scheduleRule.isOpen ? scheduleRule.openTime : null,
            scheduleRule.isOpen ? scheduleRule.closeTime : null,
            scheduleRule.slotIntervalMinutes
          ]
        );
      }

      for (const scheduleException of scheduleExceptions) {
        await client.query(
          `INSERT INTO business_schedule_exceptions (
             business_id,
             exception_date,
             is_closed,
             open_time,
             close_time,
             slot_interval_minutes,
             note
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            businessId,
            scheduleException.exceptionDate,
            scheduleException.isClosed,
            scheduleException.isClosed ? null : scheduleException.openTime,
            scheduleException.isClosed ? null : scheduleException.closeTime,
            scheduleException.slotIntervalMinutes,
            scheduleException.note
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const servicesResult = await pool.query(
      `SELECT id, kind, title, description, price_label AS "priceLabel",
              duration_minutes AS "durationMinutes", capacity
       FROM business_services
       WHERE business_id = $1
       ORDER BY created_at ASC, id ASC`,
      [result.rows[0].id]
    );

    const faqsResult = await pool.query(
      `SELECT id, question, answer, sort_order AS "sortOrder"
       FROM business_faqs
       WHERE business_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [result.rows[0].id]
    );
    const [insights, alerts] = await Promise.all([
      buildBusinessInsights(result.rows[0].id),
      buildBusinessAlerts(result.rows[0].id)
    ]);
    const scheduleContent = await fetchBusinessScheduleContent(result.rows[0].id, categoryName);

    res.json({
      message: "Ficha de negocio guardada correctamente",
      business: {
        ...applyBusinessBrandFallback(result.rows[0]),
        category: categoryName,
        services: servicesResult.rows,
        faqs: faqsResult.rows,
        scheduleRules: scheduleContent.scheduleRules,
        scheduleExceptions: scheduleContent.scheduleExceptions,
        scheduleSource: scheduleContent.scheduleSource,
        alerts,
        insights
      }
    });
  } catch (error) {
    if (
      error.message.endsWith("_required") ||
      error.message.endsWith("_invalid") ||
      error.message.endsWith("_length") ||
      error.message === "optional_invalid" ||
      error.message === "optional_length" ||
      error.message === "service_mode_invalid" ||
      error.message === "service_kind_invalid" ||
      error.message === "service_entry_required" ||
      error.message === "service_entry_length" ||
      error.message === "service_entry_invalid" ||
      error.message === "schedule_rule_invalid" ||
      error.message === "schedule_rule_duplicate" ||
      error.message === "schedule_exception_invalid" ||
      error.message === "schedule_exception_duplicate" ||
      error.message === "faq_entry_required" ||
      error.message === "faq_entry_length"
    ) {
      return res.status(400).json({
        message: "Revisa los datos de la ficha. Hay campos obligatorios vacios o demasiado largos."
      });
    }

    res.status(500).json({ message: "Error interno al guardar la ficha del negocio" });
  }
}

export async function getBusinessById(req, res) {
  const businessId = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(businessId) || businessId <= 0) {
    return res.status(400).json({ message: "Identificador de negocio no valido" });
  }

  try {
    const businessResult = await pool.query(
      `SELECT b.id, b.name, b.description, b.address, b.phone, b.service_mode AS "serviceMode", c.name AS category,
              u.avatar_url AS "imageUrl",
              b.visit_note AS "visitNote", b.cancellation_policy AS "cancellationPolicy",
              b.hero_badge AS "heroBadge", b.hero_claim AS "heroClaim", b.hero_highlight AS "heroHighlight",
              COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
              COUNT(r.id)::int AS review_count
       FROM businesses b
       INNER JOIN users u ON u.id = b.user_id
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN reviews r ON r.business_id = b.id
       WHERE b.id = $1
       GROUP BY b.id, c.name, u.avatar_url`,
      [businessId]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    const reviewsResult = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              r.business_response, r.business_response_updated_at,
              u.name AS author_name, u.avatar_url AS author_avatar, u.city AS author_city
       FROM reviews r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.business_id = $1
       ORDER BY r.created_at DESC`,
      [businessId]
    );

    const servicesResult = await pool.query(
      `SELECT id, kind, title, description, price_label AS "priceLabel",
              duration_minutes AS "durationMinutes", capacity
       FROM business_services
       WHERE business_id = $1
       ORDER BY created_at ASC, id ASC`,
      [businessId]
    );

    const faqsResult = await pool.query(
      `SELECT id, question, answer, sort_order AS "sortOrder"
       FROM business_faqs
       WHERE business_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [businessId]
    );
    const scheduleContent = await fetchBusinessScheduleContent(
      businessResult.rows[0].id,
      businessResult.rows[0].category
    );

    res.json({
      ...applyBusinessBrandFallback(businessResult.rows[0]),
      services: servicesResult.rows,
      scheduleRules: scheduleContent.scheduleRules,
      scheduleExceptions: scheduleContent.scheduleExceptions,
      scheduleSource: scheduleContent.scheduleSource,
      faqs: faqsResult.rows,
      reviews: reviewsResult.rows
    });
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener el negocio" });
  }
}
