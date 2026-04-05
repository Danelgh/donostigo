import pool from "../config/db.js";

const allowedBusinessRequestStatuses = new Set(["approved", "rejected"]);
const allowedCustomerRequestStatuses = new Set(["accepted", "declined"]);
const allowedVoucherStatuses = new Set(["draft", "issued", "redeemed"]);

function parsePreferredDate(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function normalizeOptionalRecipientName(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.slice(0, 120);
}

function normalizeOptionalBusinessReply(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.slice(0, 800);
}

function normalizeOptionalQuotedPriceLabel(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.slice(0, 80);
}

function normalizeOptionalFulfillmentNote(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.slice(0, 600);
}

function normalizeOptionalVoucherCode(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim().toUpperCase();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.slice(0, 40);
}

function normalizeOptionalVoucherStatus(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!allowedVoucherStatuses.has(trimmedValue)) {
    return null;
  }

  return trimmedValue;
}

export async function createBusinessRequest(req, res) {
  if (req.user.role !== "user") {
    return res
      .status(403)
      .json({ message: "Solo los usuarios cliente pueden crear solicitudes" });
  }

  const businessId = Number.parseInt(req.body.businessId, 10);
  const businessServiceId = req.body.businessServiceId
    ? Number.parseInt(req.body.businessServiceId, 10)
    : null;
  const participants = Number.parseInt(req.body.participants, 10);
  const preferredDate = parsePreferredDate(req.body.preferredDate);
  const recipientName = normalizeOptionalRecipientName(req.body.recipientName);
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

  if (!Number.isInteger(businessId) || businessId <= 0) {
    return res.status(400).json({ message: "El negocio indicado no es valido" });
  }

  if (!Number.isInteger(participants) || participants <= 0) {
    return res.status(400).json({ message: "El numero de participantes no es valido" });
  }

  if (!message || message.length < 12 || message.length > 800) {
    return res.status(400).json({
      message: "La solicitud debe incluir un mensaje claro de entre 12 y 800 caracteres"
    });
  }

  if (req.body.preferredDate && !preferredDate) {
    return res.status(400).json({ message: "La fecha preferida no es valida" });
  }

  try {
    const businessResult = await pool.query(
      `SELECT b.id, b.service_mode AS "serviceMode"
       FROM businesses b
       WHERE b.id = $1`,
      [businessId]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({ message: "El negocio indicado no existe" });
    }

    const business = businessResult.rows[0];

    if (business.serviceMode !== "request") {
      return res.status(400).json({
        message: "Este negocio no gestiona solicitudes manuales desde la plataforma"
      });
    }

    let linkedServiceId = null;

    if (businessServiceId) {
      const serviceResult = await pool.query(
        `SELECT id, kind
         FROM business_services
         WHERE id = $1 AND business_id = $2`,
        [businessServiceId, businessId]
      );

      if (serviceResult.rows.length === 0) {
        return res.status(404).json({
          message: "El servicio seleccionado no pertenece a este negocio"
        });
      }

      linkedServiceId = businessServiceId;
    }

    const result = await pool.query(
      `INSERT INTO business_requests (user_id, business_id, business_service_id, preferred_date, recipient_name, participants, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, preferred_date AS "preferredDate", recipient_name AS "recipientName", participants, message, status, created_at AS "createdAt", business_id AS "businessId", business_service_id AS "businessServiceId"`,
      [
        req.user.id,
        businessId,
        linkedServiceId,
        preferredDate ? preferredDate.toISOString() : null,
        recipientName,
        participants,
        message
      ]
    );

    return res.status(201).json({
      message: "Solicitud enviada correctamente al negocio",
      request: result.rows[0]
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error interno al crear la solicitud" });
  }
}

export async function getMyBusinessRequests(req, res) {
  if (req.user.role !== "user") {
    return res
      .status(403)
      .json({ message: "Solo los usuarios cliente pueden consultar sus solicitudes" });
  }

  try {
    const result = await pool.query(
      `SELECT r.id,
              r.preferred_date AS "preferredDate",
              r.proposed_date AS "proposedDate",
              r.recipient_name AS "recipientName",
              r.participants,
              r.quoted_price_label AS "quotedPriceLabel",
              r.message,
              r.business_reply AS "businessReply",
              r.fulfillment_note AS "fulfillmentNote",
              r.voucher_code AS "voucherCode",
              r.voucher_status AS "voucherStatus",
              r.business_reply_updated_at AS "businessReplyUpdatedAt",
              r.status,
              r.created_at AS "createdAt",
              b.id AS "businessId",
              b.name AS "businessName",
              s.id AS "serviceId",
              s.title AS "serviceTitle",
              s.kind AS "serviceKind"
       FROM business_requests r
       INNER JOIN businesses b ON b.id = r.business_id
       LEFT JOIN business_services s ON s.id = r.business_service_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (_error) {
    return res.status(500).json({ message: "Error al obtener tus solicitudes" });
  }
}

export async function getBusinessServiceRequests(req, res) {
  if (req.user.role !== "business") {
    return res
      .status(403)
      .json({ message: "Solo las cuentas de negocio pueden consultar esta vista" });
  }

  try {
    const businessResult = await pool.query(
      `SELECT id, name
       FROM businesses
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        message: "Todavia no has creado la ficha del negocio en tu perfil"
      });
    }

    const business = businessResult.rows[0];
    const requestsResult = await pool.query(
      `SELECT r.id,
              r.preferred_date AS "preferredDate",
              r.proposed_date AS "proposedDate",
              r.recipient_name AS "recipientName",
              r.participants,
              r.quoted_price_label AS "quotedPriceLabel",
              r.message,
              r.business_reply AS "businessReply",
              r.fulfillment_note AS "fulfillmentNote",
              r.voucher_code AS "voucherCode",
              r.voucher_status AS "voucherStatus",
              r.business_reply_updated_at AS "businessReplyUpdatedAt",
              r.status,
              r.created_at AS "createdAt",
              u.name AS "customerName",
              u.email AS "customerEmail",
              s.id AS "serviceId",
              s.title AS "serviceTitle",
              s.kind AS "serviceKind"
       FROM business_requests r
       INNER JOIN users u ON u.id = r.user_id
       LEFT JOIN business_services s ON s.id = r.business_service_id
       WHERE r.business_id = $1
       ORDER BY r.created_at DESC`,
      [business.id]
    );

    return res.json({
      business,
      requests: requestsResult.rows
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error al obtener las solicitudes del negocio" });
  }
}

export async function updateBusinessRequestStatus(req, res) {
  const requestId = Number.parseInt(req.params.id, 10);
  const status = typeof req.body.status === "string" ? req.body.status.trim() : "";
  const businessReply = normalizeOptionalBusinessReply(req.body.response);
  const proposedDate = parsePreferredDate(req.body.proposedDate);
  const quotedPriceLabel = normalizeOptionalQuotedPriceLabel(req.body.quotedPriceLabel);
  const fulfillmentNote = normalizeOptionalFulfillmentNote(req.body.fulfillmentNote);
  const voucherCode = normalizeOptionalVoucherCode(req.body.voucherCode);
  const rawVoucherStatus = normalizeOptionalVoucherStatus(req.body.voucherStatus);
  const businessReplyUpdatedAt = businessReply ? new Date().toISOString() : null;

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: "Identificador de solicitud no valido" });
  }

  if (!allowedBusinessRequestStatuses.has(status)) {
    return res.status(400).json({ message: "El estado indicado no es valido" });
  }

  if (req.body.proposedDate && !proposedDate) {
    return res.status(400).json({ message: "La fecha propuesta no es valida" });
  }

  try {
    if (req.user.role !== "business") {
      return res.status(403).json({
        message: "Solo las cuentas de negocio pueden actualizar solicitudes"
      });
    }

    const businessResult = await pool.query(
      `SELECT id
       FROM businesses
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        message: "Todavia no has creado la ficha del negocio en tu perfil"
      });
    }

    const businessId = businessResult.rows[0].id;
    const requestContextResult = await pool.query(
      `SELECT r.id, r.status, s.kind AS "serviceKind"
       FROM business_requests r
       LEFT JOIN business_services s ON s.id = r.business_service_id
       WHERE r.id = $1 AND r.business_id = $2`,
      [requestId, businessId]
    );

    if (requestContextResult.rows.length === 0) {
      return res.status(404).json({
        message: "La solicitud indicada no existe o no pertenece a tu negocio"
      });
    }

    const requestContext = requestContextResult.rows[0];

    if (requestContext.status === "accepted" || requestContext.status === "declined") {
      return res.status(400).json({
        message: "Esta solicitud ya ha sido cerrada por el cliente y no admite mas cambios"
      });
    }

    const isVoucherRequest = requestContext.serviceKind === "voucher";
    const effectiveVoucherCode = isVoucherRequest ? voucherCode : null;
    const effectiveVoucherStatus = isVoucherRequest
      ? rawVoucherStatus || (effectiveVoucherCode ? "issued" : null)
      : null;

    const result = await pool.query(
      `UPDATE business_requests
       SET status = $1,
           business_reply = $2,
           business_reply_updated_at = $3,
           proposed_date = $4,
           quoted_price_label = $5,
           fulfillment_note = $6,
           voucher_code = $7,
           voucher_status = $8
       WHERE id = $9 AND business_id = $10
       RETURNING id, preferred_date AS "preferredDate", proposed_date AS "proposedDate",
                 recipient_name AS "recipientName", participants, quoted_price_label AS "quotedPriceLabel",
                 message, business_reply AS "businessReply", fulfillment_note AS "fulfillmentNote",
                 voucher_code AS "voucherCode", voucher_status AS "voucherStatus",
                 business_reply_updated_at AS "businessReplyUpdatedAt",
                 status, created_at AS "createdAt", business_id AS "businessId", business_service_id AS "businessServiceId"`,
      [
        status,
        businessReply,
        businessReplyUpdatedAt,
        proposedDate ? proposedDate.toISOString() : null,
        quotedPriceLabel,
        fulfillmentNote,
        effectiveVoucherCode,
        effectiveVoucherStatus,
        requestId,
        businessId
      ]
    );

    return res.json({
      message:
        status === "approved"
          ? "Solicitud aprobada correctamente"
          : "Solicitud rechazada correctamente",
      request: result.rows[0]
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error interno al actualizar la solicitud" });
  }
}

export async function respondToBusinessRequestProposal(req, res) {
  const requestId = Number.parseInt(req.params.id, 10);
  const status = typeof req.body.status === "string" ? req.body.status.trim() : "";

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: "Identificador de solicitud no valido" });
  }

  if (!allowedCustomerRequestStatuses.has(status)) {
    return res.status(400).json({ message: "La respuesta indicada no es valida" });
  }

  try {
    if (req.user.role !== "user") {
      return res.status(403).json({
        message: "Solo las cuentas de usuario cliente pueden responder solicitudes"
      });
    }

    const requestResult = await pool.query(
      `SELECT r.id, r.status
       FROM business_requests r
       WHERE r.id = $1 AND r.user_id = $2`,
      [requestId, req.user.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        message: "La solicitud indicada no existe o no pertenece a tu cuenta"
      });
    }

    const currentRequest = requestResult.rows[0];

    if (currentRequest.status !== "approved") {
      return res.status(400).json({
        message: "Solo puedes responder a solicitudes que ya tengan una propuesta aprobada"
      });
    }

    const result = await pool.query(
      `UPDATE business_requests
       SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, preferred_date AS "preferredDate", proposed_date AS "proposedDate",
                 recipient_name AS "recipientName", participants, quoted_price_label AS "quotedPriceLabel",
                 message, business_reply AS "businessReply", fulfillment_note AS "fulfillmentNote",
                 voucher_code AS "voucherCode", voucher_status AS "voucherStatus",
                 business_reply_updated_at AS "businessReplyUpdatedAt",
                 status, created_at AS "createdAt", business_id AS "businessId", business_service_id AS "businessServiceId"`,
      [status, requestId, req.user.id]
    );

    return res.json({
      message:
        status === "accepted"
          ? "Has aceptado la propuesta del negocio"
          : "Has marcado la propuesta como no aceptada",
      request: result.rows[0]
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error interno al responder la solicitud" });
  }
}

export async function updateBusinessRequestVoucherStatus(req, res) {
  const requestId = Number.parseInt(req.params.id, 10);
  const voucherStatus = normalizeOptionalVoucherStatus(req.body.voucherStatus);

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: "Identificador de solicitud no valido" });
  }

  if (!voucherStatus || (voucherStatus !== "issued" && voucherStatus !== "redeemed")) {
    return res.status(400).json({ message: "El estado del bono no es valido" });
  }

  try {
    if (req.user.role !== "business") {
      return res.status(403).json({
        message: "Solo las cuentas de negocio pueden actualizar el estado del bono"
      });
    }

    const businessResult = await pool.query(
      `SELECT id
       FROM businesses
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (businessResult.rows.length === 0) {
      return res.status(404).json({
        message: "Todavia no has creado la ficha del negocio en tu perfil"
      });
    }

    const businessId = businessResult.rows[0].id;
    const requestContextResult = await pool.query(
      `SELECT r.id, r.status, r.voucher_code AS "voucherCode", s.kind AS "serviceKind"
       FROM business_requests r
       LEFT JOIN business_services s ON s.id = r.business_service_id
       WHERE r.id = $1 AND r.business_id = $2`,
      [requestId, businessId]
    );

    if (requestContextResult.rows.length === 0) {
      return res.status(404).json({
        message: "La solicitud indicada no existe o no pertenece a tu negocio"
      });
    }

    const requestContext = requestContextResult.rows[0];

    if (requestContext.serviceKind !== "voucher") {
      return res.status(400).json({
        message: "Solo las solicitudes de bono permiten actualizar este estado"
      });
    }

    if (!requestContext.voucherCode) {
      return res.status(400).json({
        message: "Debes emitir un codigo de bono antes de cambiar su estado"
      });
    }

    if (voucherStatus === "redeemed" && requestContext.status !== "accepted") {
      return res.status(400).json({
        message: "El cliente debe aceptar la propuesta antes de marcar el bono como canjeado"
      });
    }

    const result = await pool.query(
      `UPDATE business_requests
       SET voucher_status = $1
       WHERE id = $2 AND business_id = $3
       RETURNING id, preferred_date AS "preferredDate", proposed_date AS "proposedDate",
                 recipient_name AS "recipientName", participants, quoted_price_label AS "quotedPriceLabel",
                 message, business_reply AS "businessReply", fulfillment_note AS "fulfillmentNote",
                 voucher_code AS "voucherCode", voucher_status AS "voucherStatus",
                 business_reply_updated_at AS "businessReplyUpdatedAt",
                 status, created_at AS "createdAt", business_id AS "businessId", business_service_id AS "businessServiceId"`,
      [voucherStatus, requestId, businessId]
    );

    return res.json({
      message:
        voucherStatus === "redeemed"
          ? "Bono marcado como canjeado"
          : "Estado del bono actualizado correctamente",
      request: result.rows[0]
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error interno al actualizar el estado del bono" });
  }
}
