import pool from "../config/db.js";
import { resolveScheduleForDate } from "../utils/businessSchedule.js";

const allowedReservationStatuses = new Set(["pending", "confirmed", "cancelled"]);
const allowedWaitlistStatuses = new Set(["active", "converted", "cancelled"]);
const MAX_BOOKING_ADVANCE_DAYS = 45;
const LIMITED_CAPACITY_THRESHOLD = 4;

function buildLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildLocalTimeKey(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function parseDateKey(dateKey) {
  if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const parsedDate = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function buildLocalDayRange(dateKey) {
  const startDate = parseDateKey(dateKey);

  if (!startDate) {
    return null;
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return {
    startDate,
    endDate
  };
}

function normalizeRequestedPeople(rawPeople) {
  const parsedPeople = Number.parseInt(rawPeople, 10);

  if (!Number.isInteger(parsedPeople) || parsedPeople <= 0) {
    return null;
  }

  return parsedPeople;
}

function buildAvailabilitySlots(dateKey, reservations, availabilityDefinition, requestedPeople) {
  const reservedSeatsByTime = new Map();

  reservations.forEach((reservation) => {
    const reservationDate = new Date(reservation.reservation_date);
    const reservationTimeKey = buildLocalTimeKey(reservationDate);
    const currentReservedSeats = reservedSeatsByTime.get(reservationTimeKey) || 0;
    reservedSeatsByTime.set(reservationTimeKey, currentReservedSeats + Number(reservation.people || 0));
  });

  return availabilityDefinition.times.map((time) => {
    const slotDate = new Date(`${dateKey}T${time}:00`);
    const reservedSeats = reservedSeatsByTime.get(time) || 0;
    const remainingCapacity = Math.max(availabilityDefinition.seatCapacity - reservedSeats, 0);
    const isPast = slotDate.getTime() <= Date.now();
    let status = "available";

    if (isPast || remainingCapacity < requestedPeople || remainingCapacity === 0) {
      status = "full";
    } else if (remainingCapacity <= LIMITED_CAPACITY_THRESHOLD) {
      status = "limited";
    }

    return {
      time,
      label: time,
      reservationDate: slotDate.toISOString(),
      remainingCapacity,
      seatCapacity: availabilityDefinition.seatCapacity,
      status
    };
  });
}

async function fetchBusinessReservationContext(businessId, db = pool) {
  const result = await db.query(
    `SELECT b.id, b.service_mode AS "serviceMode", c.name AS category
     FROM businesses b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.id = $1`,
    [businessId]
  );

  return result.rows[0] ?? null;
}

async function fetchBusinessServiceContext(businessId, serviceId, db = pool) {
  if (!serviceId) {
    return null;
  }

  const result = await db.query(
    `SELECT id, title, capacity, duration_minutes AS "durationMinutes"
     FROM business_services
     WHERE id = $1 AND business_id = $2`,
    [serviceId, businessId]
  );

  return result.rows[0] ?? null;
}

async function fetchBusinessScheduleContext(businessId, dateKey, db = pool) {
  const targetDate = parseDateKey(dateKey);

  if (!targetDate) {
    return {
      scheduleRules: [],
      scheduleExceptions: []
    };
  }

  const dayOfWeek = targetDate.getDay();
  const [rulesResult, exceptionsResult] = await Promise.all([
    db.query(
      `SELECT day_of_week AS "dayOfWeek",
              is_open AS "isOpen",
              open_time::text AS "openTime",
              close_time::text AS "closeTime",
              slot_interval_minutes AS "slotIntervalMinutes"
       FROM business_schedule_rules
       WHERE business_id = $1 AND day_of_week = $2`,
      [businessId, dayOfWeek]
    ),
    db.query(
      `SELECT exception_date::text AS "exceptionDate",
              is_closed AS "isClosed",
              open_time::text AS "openTime",
              close_time::text AS "closeTime",
              slot_interval_minutes AS "slotIntervalMinutes",
              note
       FROM business_schedule_exceptions
       WHERE business_id = $1 AND exception_date = $2::date`,
      [businessId, dateKey]
    )
  ]);

  return {
    scheduleRules: rulesResult.rows,
    scheduleExceptions: exceptionsResult.rows
  };
}

async function fetchReservationsByBusinessAndDate(businessId, dateKey, serviceId = null, db = pool) {
  const dayRange = buildLocalDayRange(dateKey);

  if (!dayRange) {
    return [];
  }

  const result = await db.query(
    `SELECT reservation_date, people
     FROM reservations
     WHERE business_id = $1
       AND status <> 'cancelled'
       AND reservation_date >= $2
       AND reservation_date < $3
       AND ($4::integer IS NULL OR business_service_id = $4)`,
    [businessId, dayRange.startDate.toISOString(), dayRange.endDate.toISOString(), serviceId]
  );

  return result.rows;
}

function validateAvailabilityDateKey(dateKey) {
  const requestedDate = parseDateKey(dateKey);

  if (!requestedDate) {
    return "La fecha seleccionada no es valida";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (requestedDate < today) {
    return "La fecha seleccionada ya ha pasado";
  }

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + MAX_BOOKING_ADVANCE_DAYS);

  if (requestedDate > maxDate) {
    return `Solo puedes reservar con hasta ${MAX_BOOKING_ADVANCE_DAYS} dias de antelacion`;
  }

  return null;
}

export async function getBusinessAvailability(req, res) {
  const businessId = Number.parseInt(req.params.businessId, 10);
  const dateKey = typeof req.query.date === "string" ? req.query.date.trim() : "";
  const serviceId = req.query.serviceId ? Number.parseInt(req.query.serviceId, 10) : null;
  const requestedPeople = normalizeRequestedPeople(req.query.people) || 1;

  if (!Number.isInteger(businessId) || businessId <= 0) {
    return res.status(400).json({ message: "Identificador de negocio no valido" });
  }

  const dateValidationError = validateAvailabilityDateKey(dateKey);

  if (dateValidationError) {
    return res.status(400).json({ message: dateValidationError });
  }

  try {
    const business = await fetchBusinessReservationContext(businessId);

    if (!business) {
      return res.status(404).json({ message: "El negocio indicado no existe" });
    }

    if (business.serviceMode === "request") {
      return res.status(400).json({
        message: "Este negocio trabaja por solicitud manual y no ofrece franjas de reserva directa"
      });
    }

    const selectedService = serviceId
      ? await fetchBusinessServiceContext(businessId, serviceId)
      : null;

    if (serviceId && !selectedService) {
      return res.status(404).json({ message: "El servicio seleccionado no pertenece a este negocio" });
    }

    const reservations = await fetchReservationsByBusinessAndDate(
      businessId,
      dateKey,
      selectedService?.id ?? null
    );
    const scheduleContext = await fetchBusinessScheduleContext(businessId, dateKey);
    const availabilityDefinition = resolveScheduleForDate({
      category: business.category,
      service: selectedService,
      scheduleRules: scheduleContext.scheduleRules,
      scheduleExceptions: scheduleContext.scheduleExceptions,
      dateKey
    });
    const slots = availabilityDefinition.isClosed
      ? []
      : buildAvailabilitySlots(dateKey, reservations, availabilityDefinition, requestedPeople);

    res.json({
      businessId,
      date: dateKey,
      serviceId: selectedService?.id ?? null,
      requestedPeople,
      rules: {
        seatCapacity: availabilityDefinition.seatCapacity,
        bookingWindowDays: MAX_BOOKING_ADVANCE_DAYS,
        serviceTitle: selectedService?.title ?? null,
        durationMinutes: selectedService?.durationMinutes ?? null,
        isClosed: availabilityDefinition.isClosed,
        openTime: availabilityDefinition.openTime ?? null,
        closeTime: availabilityDefinition.closeTime ?? null,
        slotIntervalMinutes: availabilityDefinition.slotIntervalMinutes ?? null,
        exceptionNote: availabilityDefinition.note ?? null,
        scheduleSource: availabilityDefinition.source ?? null
      },
      slots
    });
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener la disponibilidad del negocio" });
  }
}

export async function createReservation(req, res) {
  const { businessId, businessServiceId, reservationDate, people } = req.body;

  if (!businessId || !reservationDate || !people) {
    return res.status(400).json({ message: "Faltan datos para la reserva" });
  }

  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Solo los usuarios cliente pueden crear reservas" });
  }

  const parsedBusinessId = Number.parseInt(businessId, 10);
  const parsedBusinessServiceId = businessServiceId
    ? Number.parseInt(businessServiceId, 10)
    : null;
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
    const business = await fetchBusinessReservationContext(parsedBusinessId);

    if (!business) {
      return res.status(404).json({ message: "El negocio indicado no existe" });
    }

    if (business.serviceMode === "request") {
      return res.status(400).json({
        message: "Este negocio trabaja por solicitud manual y no acepta reservas directas"
      });
    }

    const selectedService = parsedBusinessServiceId
      ? await fetchBusinessServiceContext(parsedBusinessId, parsedBusinessServiceId)
      : null;

    if (parsedBusinessServiceId && !selectedService) {
      return res.status(404).json({ message: "El servicio seleccionado no pertenece a este negocio" });
    }

    const dateKey = buildLocalDateKey(parsedDate);
    const scheduleContext = await fetchBusinessScheduleContext(parsedBusinessId, dateKey);
    const availabilityDefinition = resolveScheduleForDate({
      category: business.category,
      service: selectedService,
      scheduleRules: scheduleContext.scheduleRules,
      scheduleExceptions: scheduleContext.scheduleExceptions,
      dateKey
    });
    if (availabilityDefinition.isClosed) {
      return res.status(400).json({
        message: "Ese dia no hay servicio disponible para este negocio. Elige otra fecha."
      });
    }
    const reservations = await fetchReservationsByBusinessAndDate(
      parsedBusinessId,
      dateKey,
      selectedService?.id ?? null
    );
    const availabilitySlots = buildAvailabilitySlots(
      dateKey,
      reservations,
      availabilityDefinition,
      parsedPeople
    );
    const selectedSlot = availabilitySlots.find((slot) => slot.time === buildLocalTimeKey(parsedDate));

    if (!selectedSlot) {
      return res.status(400).json({
        message: "Debes seleccionar una franja horaria disponible dentro del negocio"
      });
    }

    if (selectedSlot.status === "full") {
      return res.status(409).json({
        message: "La franja seleccionada ya no esta disponible. Elige otra opcion."
      });
    }

    const result = await pool.query(
      `INSERT INTO reservations (user_id, business_id, business_service_id, reservation_date, people, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        req.user.id,
        parsedBusinessId,
        selectedService?.id ?? null,
        parsedDate.toISOString(),
        parsedPeople
      ]
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
      `SELECT r.id, r.reservation_date, r.people, r.status,
              b.id AS business_id, b.name AS business_name, b.address AS business_address,
              s.id AS service_id, s.title AS service_title
       FROM reservations r
       INNER JOIN businesses b ON b.id = r.business_id
       LEFT JOIN business_services s ON s.id = r.business_service_id
       WHERE r.user_id = $1
       ORDER BY r.reservation_date ASC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener reservas" });
  }
}

export async function getMyWaitlistEntries(req, res) {
  if (req.user.role !== "user") {
    return res
      .status(403)
      .json({ message: "Solo los usuarios cliente pueden consultar la lista de espera" });
  }

  try {
    const result = await pool.query(
      `SELECT w.id, w.desired_slot, w.people, w.status, w.created_at,
              b.id AS business_id, b.name AS business_name, b.address AS business_address,
              s.id AS service_id, s.title AS service_title
       FROM reservation_waitlist w
       INNER JOIN businesses b ON b.id = w.business_id
       LEFT JOIN business_services s ON s.id = w.business_service_id
       WHERE w.user_id = $1
       ORDER BY w.desired_slot ASC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener la lista de espera" });
  }
}

export async function getBusinessWaitlistEntries(req, res) {
  if (req.user.role !== "business") {
    return res
      .status(403)
      .json({ message: "Solo las cuentas de negocio pueden consultar esta lista de espera" });
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
    const waitlistResult = await pool.query(
      `SELECT w.id, w.desired_slot, w.people, w.status, w.created_at,
              u.name AS customer_name, u.email AS customer_email,
              s.id AS service_id, s.title AS service_title
       FROM reservation_waitlist w
       INNER JOIN users u ON u.id = w.user_id
       LEFT JOIN business_services s ON s.id = w.business_service_id
       WHERE w.business_id = $1 AND w.status = 'active'
       ORDER BY w.desired_slot ASC`,
      [business.id]
    );

    res.json({
      business,
      entries: waitlistResult.rows
    });
  } catch (_error) {
    res.status(500).json({ message: "Error al obtener la lista de espera del negocio" });
  }
}

export async function updateWaitlistStatus(req, res) {
  const waitlistId = Number.parseInt(req.params.id, 10);
  const status = typeof req.body.status === "string" ? req.body.status.trim() : "";

  if (!Number.isInteger(waitlistId) || waitlistId <= 0) {
    return res.status(400).json({ message: "Identificador de lista de espera no valido" });
  }

  if (!allowedWaitlistStatuses.has(status) || status === "active") {
    return res.status(400).json({ message: "El estado indicado para la lista de espera no es valido" });
  }

  try {
    if (req.user.role === "user") {
      if (status !== "cancelled") {
        return res.status(403).json({
          message: "Como usuario solo puedes cancelar tu propia solicitud de espera"
        });
      }

      const waitlistResult = await pool.query(
        `UPDATE reservation_waitlist
         SET status = 'cancelled'
         WHERE id = $1 AND user_id = $2
         RETURNING id, desired_slot, people, status, created_at, business_id`,
        [waitlistId, req.user.id]
      );

      if (waitlistResult.rows.length === 0) {
        return res.status(404).json({
          message: "La solicitud de espera indicada no existe o no pertenece a tu cuenta"
        });
      }

      return res.json({
        message: "Has salido de la lista de espera correctamente",
        entry: waitlistResult.rows[0]
      });
    }

    if (req.user.role !== "business") {
      return res.status(403).json({
        message: "No tienes permisos para actualizar la lista de espera"
      });
    }

    const businessResult = await pool.query("SELECT id FROM businesses WHERE user_id = $1", [
      req.user.id
    ]);

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        message: "Todavia no has creado la ficha del negocio en tu perfil"
      });
    }

    const businessId = businessResult.rows[0].id;

    if (status === "converted") {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const waitlistResult = await client.query(
          `SELECT w.id, w.user_id, w.business_id, w.business_service_id, w.desired_slot, w.people,
                  w.status, w.created_at,
                  u.name AS customer_name, u.email AS customer_email
           FROM reservation_waitlist w
           INNER JOIN users u ON u.id = w.user_id
           WHERE w.id = $1 AND w.business_id = $2 AND w.status = 'active'
           FOR UPDATE`,
          [waitlistId, businessId]
        );

        if (waitlistResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({
            message: "La solicitud indicada no existe, ya fue gestionada o no pertenece a tu negocio"
          });
        }

        const activeEntry = waitlistResult.rows[0];
        const business = await fetchBusinessReservationContext(businessId, client);
        const selectedService = activeEntry.business_service_id
          ? await fetchBusinessServiceContext(businessId, activeEntry.business_service_id, client)
          : null;
        const dateKey = buildLocalDateKey(new Date(activeEntry.desired_slot));
        const reservations = await fetchReservationsByBusinessAndDate(
          businessId,
          dateKey,
          selectedService?.id ?? null,
          client
        );
        const scheduleContext = await fetchBusinessScheduleContext(businessId, dateKey, client);
        const availabilityDefinition = resolveScheduleForDate({
          category: business?.category,
          service: selectedService,
          scheduleRules: scheduleContext.scheduleRules,
          scheduleExceptions: scheduleContext.scheduleExceptions,
          dateKey
        });

        if (availabilityDefinition.isClosed) {
          await client.query("ROLLBACK");
          return res.status(409).json({
            message:
              "Ese hueco ya no forma parte del horario activo del negocio. Revisa la agenda antes de convertir la espera."
          });
        }

        const availabilitySlots = buildAvailabilitySlots(
          dateKey,
          reservations,
          availabilityDefinition,
          Number(activeEntry.people || 0)
        );
        const selectedSlot = availabilitySlots.find(
          (slot) => slot.time === buildLocalTimeKey(new Date(activeEntry.desired_slot))
        );

        if (!selectedSlot || selectedSlot.status === "full") {
          await client.query("ROLLBACK");
          return res.status(409).json({
            message:
              "Ese hueco sigue sin disponibilidad real. Libera plazas o crea otra franja antes de convertir la espera."
          });
        }

        const reservationResult = await client.query(
          `INSERT INTO reservations (
             user_id,
             business_id,
             business_service_id,
             reservation_date,
             people,
             status
           )
           VALUES ($1, $2, $3, $4, $5, 'confirmed')
           RETURNING id, reservation_date, people, status, created_at, business_id`,
          [
            activeEntry.user_id,
            businessId,
            activeEntry.business_service_id ?? null,
            new Date(activeEntry.desired_slot).toISOString(),
            activeEntry.people
          ]
        );

        const updatedWaitlistResult = await client.query(
          `UPDATE reservation_waitlist
           SET status = 'converted'
           WHERE id = $1
           RETURNING id, desired_slot, people, status, created_at, user_id, business_id, business_service_id`,
          [waitlistId]
        );

        await client.query("COMMIT");

        return res.json({
          message: "La espera se ha convertido en una reserva confirmada",
          entry: updatedWaitlistResult.rows[0],
          reservation: {
            ...reservationResult.rows[0],
            customer_name: activeEntry.customer_name,
            customer_email: activeEntry.customer_email,
            service_id: activeEntry.business_service_id,
            service_title: selectedService?.title ?? null
          }
        });
      } catch (_error) {
        await client.query("ROLLBACK");
        return res.status(500).json({
          message: "Error interno al convertir la lista de espera en reserva"
        });
      } finally {
        client.release();
      }
    }

    const waitlistResult = await pool.query(
      `UPDATE reservation_waitlist
       SET status = $1
       WHERE id = $2 AND business_id = $3 AND status = 'active'
       RETURNING id, desired_slot, people, status, created_at, user_id, business_id`,
      [status, waitlistId, businessId]
    );

    if (waitlistResult.rows.length === 0) {
      return res.status(404).json({
        message: "La solicitud indicada no existe, ya fue gestionada o no pertenece a tu negocio"
      });
    }

    const updatedEntry = waitlistResult.rows[0];

    return res.json({
      message: "La solicitud de espera se ha cancelado correctamente",
      entry: updatedEntry
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error interno al actualizar la lista de espera" });
  }
}

export async function joinReservationWaitlist(req, res) {
  const { businessId, businessServiceId, desiredSlot, people } = req.body;

  if (!businessId || !desiredSlot || !people) {
    return res.status(400).json({ message: "Faltan datos para unirte a la lista de espera" });
  }

  if (req.user.role !== "user") {
    return res
      .status(403)
      .json({ message: "Solo los usuarios cliente pueden unirse a la lista de espera" });
  }

  const parsedBusinessId = Number.parseInt(businessId, 10);
  const parsedBusinessServiceId = businessServiceId
    ? Number.parseInt(businessServiceId, 10)
    : null;
  const parsedPeople = normalizeRequestedPeople(people);
  const parsedSlot = new Date(desiredSlot);

  if (!Number.isInteger(parsedBusinessId) || parsedBusinessId <= 0) {
    return res.status(400).json({ message: "El negocio indicado no es valido" });
  }

  if (!parsedPeople) {
    return res.status(400).json({ message: "El numero de personas no es valido" });
  }

  if (Number.isNaN(parsedSlot.getTime()) || parsedSlot <= new Date()) {
    return res.status(400).json({ message: "La franja seleccionada no es valida" });
  }

  try {
    const business = await fetchBusinessReservationContext(parsedBusinessId);

    if (!business) {
      return res.status(404).json({ message: "El negocio indicado no existe" });
    }

    if (business.serviceMode === "request") {
      return res.status(400).json({
        message: "Este negocio trabaja por solicitud manual y no utiliza lista de espera de reservas"
      });
    }

    const selectedService = parsedBusinessServiceId
      ? await fetchBusinessServiceContext(parsedBusinessId, parsedBusinessServiceId)
      : null;

    if (parsedBusinessServiceId && !selectedService) {
      return res.status(404).json({ message: "El servicio seleccionado no pertenece a este negocio" });
    }

    const dateKey = buildLocalDateKey(parsedSlot);
    const scheduleContext = await fetchBusinessScheduleContext(parsedBusinessId, dateKey);
    const availabilityDefinition = resolveScheduleForDate({
      category: business.category,
      service: selectedService,
      scheduleRules: scheduleContext.scheduleRules,
      scheduleExceptions: scheduleContext.scheduleExceptions,
      dateKey
    });

    if (availabilityDefinition.isClosed) {
      return res.status(400).json({
        message: "Ese dia no hay agenda abierta para lista de espera en este negocio"
      });
    }

    const reservations = await fetchReservationsByBusinessAndDate(
      parsedBusinessId,
      dateKey,
      selectedService?.id ?? null
    );
    const availabilitySlots = buildAvailabilitySlots(
      dateKey,
      reservations,
      availabilityDefinition,
      parsedPeople
    );
    const selectedSlot = availabilitySlots.find((slot) => slot.time === buildLocalTimeKey(parsedSlot));

    if (!selectedSlot) {
      return res.status(400).json({
        message: "La franja seleccionada no pertenece a la disponibilidad del negocio"
      });
    }

    if (selectedSlot.status !== "full") {
      return res.status(409).json({
        message: "Esa franja todavia tiene hueco disponible. Puedes reservar directamente."
      });
    }

    const existingWaitlistResult = await pool.query(
      `SELECT id
       FROM reservation_waitlist
       WHERE user_id = $1
         AND business_id = $2
         AND desired_slot = $3
         AND business_service_id IS NOT DISTINCT FROM $4
         AND status = 'active'`,
      [req.user.id, parsedBusinessId, parsedSlot.toISOString(), selectedService?.id ?? null]
    );

    if (existingWaitlistResult.rows.length > 0) {
      return res.status(409).json({
        message: "Ya estas apuntado en la lista de espera para esta franja"
      });
    }

    const result = await pool.query(
      `INSERT INTO reservation_waitlist (user_id, business_id, business_service_id, desired_slot, people, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, desired_slot, people, status, created_at, business_service_id`,
      [
        req.user.id,
        parsedBusinessId,
        selectedService?.id ?? null,
        parsedSlot.toISOString(),
        parsedPeople
      ]
    );

    res.status(201).json({
      message: "Te has unido a la lista de espera correctamente",
      entry: {
        ...result.rows[0],
        business_id: parsedBusinessId
      }
    });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al unirse a la lista de espera" });
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
              u.name AS customer_name, u.email AS customer_email,
              s.id AS service_id, s.title AS service_title
       FROM reservations r
       INNER JOIN users u ON u.id = r.user_id
       LEFT JOIN business_services s ON s.id = r.business_service_id
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

export async function updateReservationStatus(req, res) {
  if (req.user.role !== "business") {
    return res
      .status(403)
      .json({ message: "Solo las cuentas de negocio pueden actualizar reservas" });
  }

  const reservationId = Number.parseInt(req.params.id, 10);
  const status = typeof req.body.status === "string" ? req.body.status.trim() : "";

  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    return res.status(400).json({ message: "Identificador de reserva no valido" });
  }

  if (!allowedReservationStatuses.has(status)) {
    return res.status(400).json({ message: "El estado indicado no es valido" });
  }

  try {
    const businessResult = await pool.query("SELECT id FROM businesses WHERE user_id = $1", [
      req.user.id
    ]);

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        message: "Todavia no has creado la ficha del negocio en tu perfil"
      });
    }

    const businessId = businessResult.rows[0].id;
    const reservationResult = await pool.query(
      `SELECT r.id, r.reservation_date, r.people, r.status, r.created_at,
              u.name AS customer_name, u.email AS customer_email
       FROM reservations r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.id = $1 AND r.business_id = $2`,
      [reservationId, businessId]
    );

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({
        message: "La reserva indicada no existe o no pertenece a tu negocio"
      });
    }

    const updatedReservationResult = await pool.query(
      `UPDATE reservations
       SET status = $1
       WHERE id = $2
       RETURNING id, reservation_date, people, status, created_at`,
      [status, reservationId]
    );

    const currentReservation = reservationResult.rows[0];
    const updatedReservation = updatedReservationResult.rows[0];

    res.json({
      message: "Estado de la reserva actualizado correctamente",
      reservation: {
        ...updatedReservation,
        customer_name: currentReservation.customer_name,
        customer_email: currentReservation.customer_email
      }
    });
  } catch (_error) {
    res.status(500).json({ message: "Error interno al actualizar la reserva" });
  }
}
