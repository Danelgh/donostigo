import { pick } from "../i18n/I18nProvider.jsx";

const SERVICE_MODE_DEFINITIONS = [
  {
    value: "booking",
    label: {
      es: "Reserva",
      en: "Booking",
      eu: "Erreserba"
    },
    summary: {
      es: "Ideal para mesas, citas y turnos clasicos.",
      en: "Best for tables, appointments and classic time slots.",
      eu: "Mahaietarako, hitzorduetarako eta txanda klasikoetarako aproposa."
    }
  },
  {
    value: "session",
    label: {
      es: "Plazas",
      en: "Sessions",
      eu: "Plazak"
    },
    summary: {
      es: "Pensado para actividades, talleres o sesiones con cupo.",
      en: "Built for activities, classes or sessions with limited capacity.",
      eu: "Plaza mugatua duten jarduera, tailer edo saioetarako pentsatua."
    }
  },
  {
    value: "request",
    label: {
      es: "Solicitud",
      en: "Request",
      eu: "Eskaria"
    },
    summary: {
      es: "Mejor para experiencias o servicios que revisa el negocio manualmente.",
      en: "Best for experiences or services that the business reviews manually.",
      eu: "Negozioak eskuz berrikusten dituen esperientzia edo zerbitzuetarako egokiagoa."
    }
  }
];

const SERVICE_MODE_CONFIG = {
  booking: {
    badge: {
      es: "Reserva",
      en: "Booking",
      eu: "Erreserba"
    },
    panelEyebrow: {
      es: "Reserva",
      en: "Booking",
      eu: "Erreserba"
    },
    panelTitle: {
      es: "Reserva rápida",
      en: "Quick booking",
      eu: "Erreserba azkarra"
    },
    primaryAction: {
      es: "Reservar",
      en: "Book now",
      eu: "Erreserbatu"
    },
    peopleLabel: {
      es: "Personas",
      en: "Guests",
      eu: "Pertsonak"
    },
    selectedSlotLabel: {
      es: "Turno seleccionado",
      en: "Selected slot",
      eu: "Aukeratutako txanda"
    },
    selectedSlotCopy: {
      es: "Quedan {{count}} plazas disponibles en este turno.",
      en: "{{count}} spots still available in this slot.",
      eu: "{{count}} plaza daude libre txanda honetan."
    },
    fullSlotCopy: {
      es: "Esta franja está completa, pero puedes dejar tu interés en lista de espera.",
      en: "This slot is full, but you can still join the waitlist.",
      eu: "Txanda hau beteta dago, baina itxaron-zerrendan sar zaitezke."
    },
    listWaitCopy: {
      es: "Unirme a lista de espera",
      en: "Join waitlist",
      eu: "Itxaron-zerrendan sartu"
    }
  },
  session: {
    badge: {
      es: "Plazas",
      en: "Sessions",
      eu: "Plazak"
    },
    panelEyebrow: {
      es: "Actividad",
      en: "Session",
      eu: "Saioa"
    },
    panelTitle: {
      es: "Reservar plaza",
      en: "Reserve a spot",
      eu: "Plaza erreserbatu"
    },
    primaryAction: {
      es: "Reservar plaza",
      en: "Reserve spot",
      eu: "Plaza erreserbatu"
    },
    peopleLabel: {
      es: "Plazas",
      en: "Spots",
      eu: "Plazak"
    },
    selectedSlotLabel: {
      es: "Sesión seleccionada",
      en: "Selected session",
      eu: "Aukeratutako saioa"
    },
    selectedSlotCopy: {
      es: "Quedan {{count}} plazas disponibles en esta sesión.",
      en: "{{count}} spots still available in this session.",
      eu: "{{count}} plaza daude libre saio honetan."
    },
    fullSlotCopy: {
      es: "La sesión está completa, pero puedes apuntarte a la lista de espera.",
      en: "This session is full, but you can join the waitlist.",
      eu: "Saioa beteta dago, baina itxaron-zerrendan sar zaitezke."
    },
    listWaitCopy: {
      es: "Apuntarme a lista de espera",
      en: "Join waitlist",
      eu: "Itxaron-zerrendan sartu"
    }
  },
  request: {
    badge: {
      es: "Solicitud",
      en: "Request",
      eu: "Eskaria"
    },
    panelEyebrow: {
      es: "Solicitud",
      en: "Request",
      eu: "Eskaria"
    },
    panelTitle: {
      es: "Enviar solicitud",
      en: "Send request",
      eu: "Eskaria bidali"
    },
    primaryAction: {
      es: "Enviar solicitud",
      en: "Send request",
      eu: "Eskaria bidali"
    },
    peopleLabel: {
      es: "Participantes",
      en: "Participants",
      eu: "Parte-hartzaileak"
    },
    selectedSlotLabel: {
      es: "Franja solicitada",
      en: "Requested slot",
      eu: "Eskatutako txanda"
    },
    selectedSlotCopy: {
      es: "El negocio recibirá esta solicitud. Aún quedan {{count}} plazas visibles.",
      en: "The business will review this request. {{count}} visible spots remain.",
      eu: "Negozioak eskaria jasoko du. Oraindik {{count}} plaza ikusgai daude."
    },
    fullSlotCopy: {
      es: "Ahora mismo no queda hueco, pero puedes dejar tu interés en lista de espera.",
      en: "There is no space right now, but you can still join the waitlist.",
      eu: "Une honetan ez dago lekurik, baina itxaron-zerrendan sar zaitezke."
    },
    listWaitCopy: {
      es: "Dejar interés en espera",
      en: "Leave waitlist request",
      eu: "Itxaron-zerrendan interesa utzi"
    }
  }
};

export function getServiceModeOptions(language = "es") {
  return SERVICE_MODE_DEFINITIONS.map((option) => ({
    value: option.value,
    label: pick(option.label, language),
    summary: pick(option.summary, language)
  }));
}

export function getServiceModeConfig(serviceMode, language = "es") {
  const fallback = SERVICE_MODE_CONFIG.booking;
  const source = SERVICE_MODE_CONFIG[serviceMode] || fallback;

  return {
    badge: pick(source.badge, language),
    panelEyebrow: pick(source.panelEyebrow, language),
    panelTitle: pick(source.panelTitle, language),
    primaryAction: pick(source.primaryAction, language),
    peopleLabel: pick(source.peopleLabel, language),
    selectedSlotLabel: pick(source.selectedSlotLabel, language),
    selectedSlotCopy: (slot) =>
      pick(source.selectedSlotCopy, language, {
        count: slot?.remainingCapacity ?? 0
      }),
    fullSlotCopy: pick(source.fullSlotCopy, language),
    listWaitCopy: pick(source.listWaitCopy, language)
  };
}
