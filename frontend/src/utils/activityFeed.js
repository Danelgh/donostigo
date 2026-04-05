import { formatLocaleDateTime, pick } from "../i18n/I18nProvider.jsx";

export function formatActivityDate(value, language = "es") {
  if (!value) {
    return pick(
      {
        es: "Sin fecha cerrada",
        en: "No fixed date",
        eu: "Ez dago data itxirik"
      },
      language
    );
  }

  return formatLocaleDateTime(value, language, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildPriorityOrder(priority) {
  const priorities = {
    high: 0,
    medium: 1,
    low: 2
  };

  return priorities[priority] ?? 3;
}

function buildNotification(id, payload) {
  return {
    id,
    ...payload
  };
}

export function buildUserNotificationFeed(
  {
    reservations = [],
    waitlistEntries = [],
    serviceRequests = [],
    savedLists = []
  },
  language = "es"
) {
  const notifications = [];

  const nextPendingReservation = [...reservations]
    .filter((reservation) => reservation.status === "pending")
    .sort(
      (leftReservation, rightReservation) =>
        new Date(leftReservation.reservation_date) - new Date(rightReservation.reservation_date)
    )[0];

  if (nextPendingReservation) {
    notifications.push(
      buildNotification(`reservation-pending-${nextPendingReservation.id}`, {
        eyebrow: pick(
          { es: "Reserva pendiente", en: "Pending booking", eu: "Erreserba zain" },
          language
        ),
        title: pick(
          {
            es: "{{name}} todavía debe confirmar tu plan",
            en: "{{name}} still needs to confirm your plan",
            eu: "{{name}}k oraindik zure plana baieztatu behar du"
          },
          language,
          { name: nextPendingReservation.business_name }
        ),
        description: `${formatActivityDate(nextPendingReservation.reservation_date, language)} · ${
          nextPendingReservation.service_title
          || pick({ es: "Reserva principal", en: "Main booking", eu: "Erreserba nagusia" }, language)
        }`,
        href: "/my-reservations?focus=reservations-pending",
        cta: pick({ es: "Revisar reservas", en: "Review bookings", eu: "Erreserbak berrikusi" }, language),
        tone: "warning",
        priority: "high",
        section: "actividad",
        sortDate: nextPendingReservation.reservation_date
      })
    );
  }

  const nextConfirmedReservation = [...reservations]
    .filter(
      (reservation) =>
        reservation.status === "confirmed"
        && new Date(reservation.reservation_date).getTime() >= Date.now()
    )
    .sort(
      (leftReservation, rightReservation) =>
        new Date(leftReservation.reservation_date) - new Date(rightReservation.reservation_date)
    )[0];

  if (nextConfirmedReservation) {
    notifications.push(
      buildNotification(`reservation-confirmed-${nextConfirmedReservation.id}`, {
        eyebrow: pick({ es: "Próximo plan", en: "Next plan", eu: "Hurrengo plana" }, language),
        title: pick(
          {
            es: "Tienes una reserva confirmada en {{name}}",
            en: "You have a confirmed booking at {{name}}",
            eu: "{{name}}n baieztatutako erreserba bat duzu"
          },
          language,
          { name: nextConfirmedReservation.business_name }
        ),
        description: `${formatActivityDate(nextConfirmedReservation.reservation_date, language)} · ${
          nextConfirmedReservation.service_title
          || pick({ es: "Reserva", en: "Booking", eu: "Erreserba" }, language)
        }`,
        href: "/my-reservations?focus=reservations",
        cta: pick({ es: "Ver actividad", en: "Open activity", eu: "Jarduera ikusi" }, language),
        tone: "success",
        priority: "medium",
        section: "actividad",
        sortDate: nextConfirmedReservation.reservation_date
      })
    );
  }

  const approvedRequest = serviceRequests.find((request) => request.status === "approved");

  if (approvedRequest) {
    notifications.push(
      buildNotification(`request-approved-${approvedRequest.id}`, {
        eyebrow: pick({ es: "Solicitud lista", en: "Request ready", eu: "Eskaria prest" }, language),
        title: pick(
          {
            es: "{{name}} te ha dejado una propuesta pendiente de respuesta",
            en: "{{name}} has sent you a proposal waiting for your response",
            eu: "{{name}}k zure erantzunaren zain dagoen proposamen bat bidali dizu"
          },
          language,
          { name: approvedRequest.businessName }
        ),
        description:
          approvedRequest.quotedPriceLabel || approvedRequest.proposedDate
            ? `${approvedRequest.quotedPriceLabel || pick({ es: "Precio pendiente", en: "Price pending", eu: "Prezioa zain" }, language)} · ${
                approvedRequest.proposedDate
                  ? formatActivityDate(approvedRequest.proposedDate, language)
                  : pick({ es: "Fecha flexible", en: "Flexible date", eu: "Data malgua" }, language)
              }`
            : pick(
              {
                es: "Ya puedes revisar la propuesta del negocio y decidir el siguiente paso.",
                en: "You can now review the proposal and decide the next step.",
                eu: "Orain negozioaren proposamena berrikusi eta hurrengo pausoa erabaki dezakezu."
              },
              language
            ),
        href: "/my-reservations?focus=requests",
        cta: pick({ es: "Responder solicitud", en: "Reply to request", eu: "Eskariari erantzun" }, language),
        tone: "accent",
        priority: "high",
        section: "solicitudes",
        sortDate: approvedRequest.businessReplyUpdatedAt || approvedRequest.createdAt
      })
    );
  }

  const activeWaitlist = waitlistEntries.find((entry) => entry.status === "active");

  if (activeWaitlist) {
    notifications.push(
      buildNotification(`waitlist-active-${activeWaitlist.id}`, {
        eyebrow: pick({ es: "Lista de espera", en: "Waitlist", eu: "Itxaron-zerrenda" }, language),
        title: pick(
          {
            es: "Sigues en espera para {{name}}",
            en: "You are still on the waitlist for {{name}}",
            eu: "{{name}}rako itxaron-zerrendan jarraitzen duzu"
          },
          language,
          { name: activeWaitlist.business_name }
        ),
        description: `${formatActivityDate(activeWaitlist.desired_slot, language)} · ${
          activeWaitlist.service_title
          || pick({ es: "Interés general", en: "General interest", eu: "Interes orokorra" }, language)
        }`,
        href: "/my-reservations?focus=waitlist",
        cta: pick({ es: "Ver espera", en: "Open waitlist", eu: "Itxaron-zerrenda ikusi" }, language),
        tone: "neutral",
        priority: "medium",
        section: "espera",
        sortDate: activeWaitlist.created_at || activeWaitlist.desired_slot
      })
    );
  }

  const convertedWaitlist = waitlistEntries.find((entry) => entry.status === "converted");

  if (convertedWaitlist) {
    notifications.push(
      buildNotification(`waitlist-converted-${convertedWaitlist.id}`, {
        eyebrow: pick({ es: "Hueco liberado", en: "Spot opened", eu: "Leku bat askatu da" }, language),
        title: pick(
          {
            es: "{{name}} convirtió tu espera en una reserva real",
            en: "{{name}} turned your waitlist into a real booking",
            eu: "{{name}}k zure itxaron-zerrenda benetako erreserba bihurtu du"
          },
          language,
          { name: convertedWaitlist.business_name }
        ),
        description: `${formatActivityDate(convertedWaitlist.desired_slot, language)} · ${
          convertedWaitlist.service_title
          || pick({ es: "Interés convertido", en: "Converted request", eu: "Bihurtutako interesa" }, language)
        }`,
        href: "/my-reservations?focus=waitlist",
        cta: pick({ es: "Ver conversión", en: "View conversion", eu: "Bihurketa ikusi" }, language),
        tone: "success",
        priority: "high",
        section: "espera",
        sortDate: convertedWaitlist.created_at || convertedWaitlist.desired_slot
      })
    );
  }

  const readyVoucher = serviceRequests.find(
    (request) => request.status === "accepted" && request.voucherCode
  );

  if (readyVoucher) {
    notifications.push(
      buildNotification(`voucher-ready-${readyVoucher.id}`, {
        eyebrow: pick({ es: "Bono emitido", en: "Voucher ready", eu: "Bonua prest" }, language),
        title: pick(
          {
            es: "Tu bono para {{name}} ya está listo",
            en: "Your voucher for {{name}} is ready",
            eu: "{{name}}rako zure bonua prest dago"
          },
          language,
          { name: readyVoucher.businessName }
        ),
        description: `${readyVoucher.voucherCode} · ${
          readyVoucher.quotedPriceLabel || pick({ es: "Propuesta aceptada", en: "Accepted proposal", eu: "Onartutako proposamena" }, language)
        }`,
        href: "/my-reservations?focus=requests",
        cta: pick({ es: "Abrir bono", en: "Open voucher", eu: "Bonua ireki" }, language),
        tone: "success",
        priority: "medium",
        section: "bonos",
        sortDate: readyVoucher.businessReplyUpdatedAt || readyVoucher.createdAt
      })
    );
  }

  const rejectedRequest = serviceRequests.find(
    (request) => request.status === "rejected" || request.status === "declined"
  );

  if (rejectedRequest) {
    notifications.push(
      buildNotification(`request-closed-${rejectedRequest.id}`, {
        eyebrow: pick({ es: "Solicitud cerrada", en: "Closed request", eu: "Eskaria itxita" }, language),
        title: pick(
          {
            es: "{{name}} ha cerrado una de tus solicitudes",
            en: "{{name}} has closed one of your requests",
            eu: "{{name}}k zure eskarietako bat itxi du"
          },
          language,
          { name: rejectedRequest.businessName }
        ),
        description: rejectedRequest.businessReply
          || pick(
            {
              es: "Puedes revisar el detalle y volver a intentarlo con otro plan.",
              en: "You can review the details and try again with another plan.",
              eu: "Xehetasuna berrikusi eta beste plan batekin berriro saiatu zaitezke."
            },
            language
          ),
        href: "/my-reservations?focus=requests",
        cta: pick({ es: "Ver detalle", en: "View details", eu: "Xehetasuna ikusi" }, language),
        tone: "neutral",
        priority: "low",
        section: "solicitudes",
        sortDate: rejectedRequest.businessReplyUpdatedAt || rejectedRequest.createdAt
      })
    );
  }

  if (savedLists.length === 0) {
    notifications.push(
      buildNotification("saved-lists-empty", {
        eyebrow: pick({ es: "Curación", en: "Curation", eu: "Kurazioa" }, language),
        title: pick(
          {
            es: "Todavía no has creado tu primera guía o lista personal",
            en: "You have not created your first guide or personal list yet",
            eu: "Oraindik ez duzu zure lehen gida edo zerrenda pertsonala sortu"
          },
          language
        ),
        description: pick(
          {
            es: "Guardar y agrupar sitios es una de las capas más diferenciales de DonostiGo.",
            en: "Saving and grouping places is one of DonostiGo’s most distinctive layers.",
            eu: "Lekuak gorde eta multzokatzea da DonostiGoren geruzarik bereizgarrienetako bat."
          },
          language
        ),
        href: "/saved-lists",
        cta: pick({ es: "Crear guardados", en: "Create saves", eu: "Gordetakoak sortu" }, language),
        tone: "accent",
        priority: "medium",
        section: "curacion",
        sortDate: new Date().toISOString()
      })
    );
  }

  return notifications.sort((leftItem, rightItem) => {
    const priorityDiff = buildPriorityOrder(leftItem.priority) - buildPriorityOrder(rightItem.priority);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(rightItem.sortDate || 0) - new Date(leftItem.sortDate || 0);
  });
}

export function buildUserActivityItems(data, language = "es") {
  return buildUserNotificationFeed(data, language).slice(0, 4);
}
