import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { pick, useI18n } from "../i18n/I18nProvider.jsx";
import {
  fetchCategories,
  fetchMyBusinessProfile,
  saveMyBusinessProfile,
  updateCurrentUser
} from "../services/api.js";
import { getBusinessInitials } from "../utils/businessTheme.js";
import {
  createDefaultBusinessScheduleRules,
  createEmptyBusinessScheduleException,
  getSlotIntervalOptions
} from "../utils/businessSchedule.js";
import { getServiceModeOptions } from "../utils/serviceMode.js";
import {
  getRequestServiceKindConfig,
  getRequestServiceKindOptions
} from "../utils/requestServiceKind.js";

function createInitialState(user) {
  return {
    name: user?.name ?? "",
    city: user?.city ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    bio: user?.bio ?? "",
    instagramUrl: user?.instagramUrl ?? "",
    tiktokUrl: user?.tiktokUrl ?? "",
    featuredPostUrl: user?.featuredPostUrl ?? ""
  };
}

function createEmptyBusinessService() {
  return {
    kind: "service",
    title: "",
    description: "",
    priceLabel: "",
    durationMinutes: "",
    capacity: ""
  };
}

function createEmptyBusinessFaq() {
  return {
    question: "",
    answer: ""
  };
}

function createInitialBusinessState(name = "", language = "es") {
  return {
    name,
    categoryId: "",
    serviceMode: "booking",
    description: "",
    address: "",
    phone: "",
    visitNote: "",
    cancellationPolicy: "",
    heroBadge: "",
    heroClaim: "",
    heroHighlight: "",
    services: [createEmptyBusinessService()],
    faqs: [createEmptyBusinessFaq()],
    scheduleRules: createDefaultBusinessScheduleRules(language),
    scheduleExceptions: []
  };
}

function createEmptyBusinessInsights() {
  return {
    reservations: {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      upcoming: 0
    },
    waitlist: {
      active: 0,
      converted: 0,
      cancelled: 0
    },
    requests: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    },
    reviews: {
      total: 0,
      averageRating: 0
    },
    topService: null,
    responseHealth: {
      requestResolutionRate: 0,
      waitlistConversionRate: 0,
      reviewResponseRate: 0
    },
    activityTimeline: []
  };
}

function createEmptyBusinessAlerts() {
  return [];
}

function getBusinessAlertAction(alert, businessRecordId, language = "es") {
  switch (alert.type) {
    case "reservation_pending":
      return {
        label: pick(
          { es: "Ir a reservas pendientes", en: "Open pending bookings", eu: "Ireki zain dauden erreserbak" },
          language
        ),
        to: "/my-reservations?focus=reservations-pending"
      };
    case "waitlist_active":
      return {
        label: pick(
          { es: "Abrir lista de espera", en: "Open waitlist", eu: "Ireki itxaron-zerrenda" },
          language
        ),
        to: "/my-reservations?focus=waitlist"
      };
    case "request_pending":
      return {
        label: pick(
          { es: "Revisar solicitudes", en: "Review requests", eu: "Berrikusi eskaerak" },
          language
        ),
        to: "/my-reservations?focus=requests"
      };
    case "review_unanswered":
      return businessRecordId
        ? {
            label: pick(
              { es: "Responder reseña", en: "Reply to review", eu: "Erantzun iritziari" },
              language
            ),
            to: `/businesses/${businessRecordId}#reviews`
          }
        : null;
    default:
      return null;
  }
}

function buildCompletionSummary(items) {
  const completed = items.filter((item) => item.isComplete).length;
  const total = items.length;

  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100)
  };
}

function getBusinessInboxFilters(language = "es") {
  return [
    { id: "all", label: pick({ es: "Todas", en: "All", eu: "Guztiak" }, language) },
    { id: "today", label: pick({ es: "Hoy", en: "Today", eu: "Gaur" }, language) },
    { id: "high", label: pick({ es: "Alta prioridad", en: "High priority", eu: "Lehentasun handia" }, language) },
    { id: "follow_up", label: pick({ es: "Seguimiento", en: "Follow-up", eu: "Jarraipena" }, language) }
  ];
}

function getBusinessPanelSections(language = "es") {
  return [
    {
      id: "identity",
      label: pick({ es: "Negocio", en: "Business", eu: "Negozioa" }, language),
      title: pick({ es: "Base del negocio", en: "Business foundation", eu: "Negozioaren oinarria" }, language),
      description: pick(
        {
          es: "Nombre comercial, categoría y modo principal de interacción.",
          en: "Commercial name, category and main interaction model.",
          eu: "Izen komertziala, kategoria eta elkarreragin modu nagusia."
        },
        language
      )
    },
    {
      id: "portal",
      label: pick({ es: "Portal publico", en: "Public portal", eu: "Atari publikoa" }, language),
      title: pick({ es: "Como se presenta la ficha", en: "How the profile shows up", eu: "Nola aurkezten den fitxa" }, language),
      description: pick(
        {
          es: "Descripción, dirección, teléfono y mensajes clave antes de la visita.",
          en: "Description, address, phone and key messages before the visit.",
          eu: "Bisita baino lehen ikusiko diren deskribapena, helbidea, telefonoa eta mezu nagusiak."
        },
        language
      )
    },
    {
      id: "schedule",
      label: pick({ es: "Horarios", en: "Schedule", eu: "Ordutegia" }, language),
      title: pick({ es: "Agenda y fechas especiales", en: "Schedule and special dates", eu: "Agenda eta data bereziak" }, language),
      description: pick(
        {
          es: "Configura cuándo está operativo el negocio y qué pasa en días concretos.",
          en: "Configure when the business is live and what happens on specific dates.",
          eu: "Konfiguratu negozioa noiz dagoen operatibo eta zer gertatzen den data jakinetan."
        },
        language
      )
    },
    {
      id: "services",
      label: pick({ es: "Oferta", en: "Offer", eu: "Eskaintza" }, language),
      title: pick({ es: "Servicios, bonos y packs", en: "Services, vouchers and packs", eu: "Zerbitzuak, bonuak eta pack-ak" }, language),
      description: pick(
        {
          es: "Define qué ofreces y cómo lo verá el cliente en la ficha pública.",
          en: "Define what you offer and how clients will see it on the public profile.",
          eu: "Zehaztu zer eskaintzen duzun eta bezeroak nola ikusiko duen fitxa publikoan."
        },
        language
      )
    },
    {
      id: "faq",
      label: pick({ es: "FAQ y politicas", en: "FAQ and policies", eu: "FAQ eta politikak" }, language),
      title: pick({ es: "Resolver dudas frecuentes", en: "Answer common questions", eu: "Ohiko zalantzak argitu" }, language),
      description: pick(
        {
          es: "Preguntas habituales, política de cancelación y detalle operativo.",
          en: "Frequent questions, cancellation policy and operational detail.",
          eu: "Ohiko galderak, ezeztapen politika eta xehetasun operatiboak."
        },
        language
      )
    },
    {
      id: "inbox",
      label: "Inbox",
      title: pick({ es: "Alertas operativas", en: "Operational alerts", eu: "Abisu operatiboak" }, language),
      description: pick(
        {
          es: "Reservas, esperas, solicitudes y reseñas que piden reacción rápida.",
          en: "Bookings, waitlist entries, requests and reviews that need quick action.",
          eu: "Erreserbak, itxaron-zerrendak, eskaerak eta erantzun azkarra eskatzen duten iritziak."
        },
        language
      )
    },
    {
      id: "insights",
      label: pick({ es: "Rendimiento", en: "Performance", eu: "Errendimendua" }, language),
      title: pick({ es: "Señales del negocio", en: "Business signals", eu: "Negozioaren seinaleak" }, language),
      description: pick(
        {
          es: "Actividad, demanda pendiente y servicio con más tracción.",
          en: "Activity, pending demand and the service with the strongest traction.",
          eu: "Jarduera, zain dagoen eskaria eta trazio handiena duen zerbitzua."
        },
        language
      )
    }
  ];
}

export default function ProfilePage({ auth, isHydratingAuth, onUserUpdate }) {
  const { language } = useI18n();
  const t = (copy, variables) => pick(copy, language, variables);
  const [formData, setFormData] = useState(createInitialState(auth?.user));
  const [businessFormData, setBusinessFormData] = useState(createInitialBusinessState("", language));
  const [categories, setCategories] = useState([]);
  const [businessInsights, setBusinessInsights] = useState(null);
  const [businessAlerts, setBusinessAlerts] = useState(createEmptyBusinessAlerts());
  const [businessRecordId, setBusinessRecordId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBusinessData, setIsLoadingBusinessData] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [businessSuccessMessage, setBusinessSuccessMessage] = useState("");
  const [businessErrorMessage, setBusinessErrorMessage] = useState("");
  const [activeBusinessPanelSection, setActiveBusinessPanelSection] = useState("identity");
  const [activeInboxFilter, setActiveInboxFilter] = useState("all");
  const slotIntervalOptions = useMemo(() => getSlotIntervalOptions(language), [language]);
  const serviceModeOptions = useMemo(() => getServiceModeOptions(language), [language]);
  const requestServiceKindOptions = useMemo(() => getRequestServiceKindOptions(language), [language]);

  useEffect(() => {
    setFormData(createInitialState(auth?.user));
  }, [auth]);

  useEffect(() => {
    if (auth?.user.role !== "business") {
      setActiveBusinessPanelSection("identity");
    }
  }, [auth?.user.role]);

  useEffect(() => {
    if (!auth || auth.user.role !== "business") {
      setCategories([]);
      setBusinessRecordId(null);
      setBusinessFormData(createInitialBusinessState("", language));
      setBusinessSuccessMessage("");
      setBusinessErrorMessage("");
      setBusinessInsights(null);
      setBusinessAlerts(createEmptyBusinessAlerts());
      return;
    }

    setIsLoadingBusinessData(true);
    setBusinessErrorMessage("");

    Promise.all([fetchCategories(), fetchMyBusinessProfile()])
      .then(([categoryData, businessData]) => {
        setCategories(categoryData);

        if (businessData.business) {
          setBusinessRecordId(businessData.business.id ?? null);
          setBusinessInsights(businessData.business.insights ?? createEmptyBusinessInsights());
          setBusinessAlerts(businessData.business.alerts ?? createEmptyBusinessAlerts());
          setBusinessFormData({
            name: businessData.business.name ?? auth.user.name,
            categoryId: businessData.business.categoryId
              ? String(businessData.business.categoryId)
              : "",
            serviceMode: businessData.business.serviceMode ?? "booking",
            description: businessData.business.description ?? "",
            address: businessData.business.address ?? "",
            phone: businessData.business.phone ?? "",
            visitNote: businessData.business.visitNote ?? "",
            cancellationPolicy: businessData.business.cancellationPolicy ?? "",
            heroBadge: businessData.business.heroBadge ?? "",
            heroClaim: businessData.business.heroClaim ?? "",
            heroHighlight: businessData.business.heroHighlight ?? "",
            services:
              businessData.business.services?.length > 0
                ? businessData.business.services.map((service) => ({
                    kind: service.kind ?? "service",
                    title: service.title ?? "",
                    description: service.description ?? "",
                    priceLabel: service.priceLabel ?? "",
                    durationMinutes: service.durationMinutes ? String(service.durationMinutes) : "",
                    capacity: service.capacity ? String(service.capacity) : ""
                  }))
                : [createEmptyBusinessService()],
            faqs:
              businessData.business.faqs?.length > 0
                ? businessData.business.faqs.map((faq) => ({
                    question: faq.question ?? "",
                    answer: faq.answer ?? ""
                  }))
                : [createEmptyBusinessFaq()],
            scheduleRules:
              businessData.business.scheduleRules?.length > 0
                ? businessData.business.scheduleRules.map((rule) => ({
                    dayOfWeek: rule.dayOfWeek,
                    label: rule.label,
                    isOpen: Boolean(rule.isOpen),
                    openTime: rule.openTime ?? "",
                    closeTime: rule.closeTime ?? "",
                    slotIntervalMinutes: String(rule.slotIntervalMinutes ?? 60)
                  }))
                : createDefaultBusinessScheduleRules(),
            scheduleExceptions:
              businessData.business.scheduleExceptions?.length > 0
                ? businessData.business.scheduleExceptions.map((exception) => ({
                    exceptionDate: exception.exceptionDate ?? "",
                    isClosed: Boolean(exception.isClosed),
                    openTime: exception.openTime ?? "10:00",
                    closeTime: exception.closeTime ?? "14:00",
                    slotIntervalMinutes: String(exception.slotIntervalMinutes ?? 60),
                    note: exception.note ?? ""
                  }))
                : []
          });
          return;
        }

        setBusinessInsights(createEmptyBusinessInsights());
        setBusinessAlerts(createEmptyBusinessAlerts());
        setBusinessRecordId(null);
        setBusinessFormData(createInitialBusinessState(auth.user.name, language));
      })
      .catch((error) => {
        setCategories([]);
        setBusinessInsights(null);
        setBusinessAlerts(createEmptyBusinessAlerts());
        setBusinessErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoadingBusinessData(false);
      });
  }, [auth, language]);

  const socialLinks = useMemo(
    () =>
      [
        { label: "Instagram", value: formData.instagramUrl },
        { label: "TikTok", value: formData.tiktokUrl },
        { label: "Publicacion destacada", value: formData.featuredPostUrl }
      ].filter((item) => item.value),
    [formData.featuredPostUrl, formData.instagramUrl, formData.tiktokUrl]
  );
  const profileChecklist = useMemo(
    () => [
      { label: t({ es: "Nombre visible", en: "Visible name", eu: "Ikusgai den izena" }), isComplete: Boolean(formData.name.trim()) },
      { label: t({ es: "Ciudad", en: "City", eu: "Hiria" }), isComplete: Boolean(formData.city.trim()) },
      { label: t({ es: "Foto de perfil", en: "Profile photo", eu: "Profil-argazkia" }), isComplete: Boolean(formData.avatarUrl.trim()) },
      { label: t({ es: "Presentacion", en: "Intro", eu: "Aurkezpena" }), isComplete: Boolean(formData.bio.trim()) },
      { label: t({ es: "Enlaces sociales", en: "Social links", eu: "Sare sozialak" }), isComplete: socialLinks.length > 0 }
    ],
    [formData.avatarUrl, formData.bio, formData.city, formData.name, socialLinks.length, t]
  );
  const profileSummary = useMemo(
    () => buildCompletionSummary(profileChecklist),
    [profileChecklist]
  );
  const businessChecklist = useMemo(() => {
    if (auth?.user.role !== "business") {
      return [];
    }

    return [
      { label: t({ es: "Nombre comercial", en: "Business name", eu: "Izen komertziala" }), isComplete: Boolean(businessFormData.name.trim()) },
      { label: t({ es: "Categoria", en: "Category", eu: "Kategoria" }), isComplete: Boolean(businessFormData.categoryId) },
      { label: t({ es: "Modo de servicio", en: "Service mode", eu: "Zerbitzu modua" }), isComplete: Boolean(businessFormData.serviceMode) },
      {
        label: t({ es: "Horario base", en: "Base schedule", eu: "Oinarrizko ordutegia" }),
        isComplete: businessFormData.scheduleRules.some(
          (rule) => rule.isOpen && rule.openTime && rule.closeTime
        )
      },
      {
        label: t({ es: "Servicios definidos", en: "Defined services", eu: "Definitutako zerbitzuak" }),
        isComplete: businessFormData.services.some(
          (service) => service.title.trim() && service.description.trim()
        )
      },
      {
        label: t({ es: "FAQ o informacion util", en: "FAQ or useful info", eu: "FAQ edo informazio erabilgarria" }),
        isComplete:
          Boolean(businessFormData.visitNote.trim()) ||
          Boolean(businessFormData.cancellationPolicy.trim()) ||
          Boolean(businessFormData.heroBadge.trim()) ||
          Boolean(businessFormData.heroClaim.trim()) ||
          Boolean(businessFormData.heroHighlight.trim()) ||
          businessFormData.faqs.some((faq) => faq.question.trim() && faq.answer.trim())
      },
      { label: t({ es: "Descripcion", en: "Description", eu: "Deskribapena" }), isComplete: Boolean(businessFormData.description.trim()) },
      { label: t({ es: "Direccion", en: "Address", eu: "Helbidea" }), isComplete: Boolean(businessFormData.address.trim()) },
      { label: t({ es: "Telefono", en: "Phone", eu: "Telefonoa" }), isComplete: Boolean(businessFormData.phone.trim()) }
    ];
  }, [auth?.user.role, businessFormData.address, businessFormData.categoryId, businessFormData.cancellationPolicy, businessFormData.description, businessFormData.faqs, businessFormData.heroBadge, businessFormData.heroClaim, businessFormData.heroHighlight, businessFormData.name, businessFormData.phone, businessFormData.scheduleRules, businessFormData.serviceMode, businessFormData.services, businessFormData.visitNote, t]);
  const businessSummary = useMemo(
    () => (businessChecklist.length > 0 ? buildCompletionSummary(businessChecklist) : null),
    [businessChecklist]
  );
  const businessInsightCards = useMemo(() => {
    if (auth?.user.role !== "business" || !businessInsights) {
      return [];
    }

    const activeDemand = businessInsights.waitlist.active + businessInsights.requests.pending;
    const ratingValue =
      businessInsights.reviews.total > 0
        ? `${businessInsights.reviews.averageRating.toFixed(1)} / 5`
        : "Sin resenas";

    return [
      {
        label: t({ es: "Proximas citas", en: "Upcoming slots", eu: "Hurrengo hitzorduak" }),
        value: businessInsights.reservations.upcoming,
        description: "Reservas futuras ya activas dentro de tu agenda."
      },
      {
        label: t({ es: "Demanda pendiente", en: "Pending demand", eu: "Zain dagoen eskaria" }),
        value: activeDemand,
        description: "Suma de lista de espera activa y solicitudes manuales pendientes."
      },
      {
        label: t({ es: "Valoracion media", en: "Average rating", eu: "Batez besteko balorazioa" }),
        value: ratingValue,
        description: `${businessInsights.reviews.total} resena${businessInsights.reviews.total === 1 ? "" : "s"} registradas.`
      },
      {
        label: t({ es: "Servicio destacado", en: "Leading service", eu: "Zerbitzu nagusia" }),
        value: businessInsights.topService?.title || t({ es: "Sin datos", en: "No data", eu: "Daturik ez" }),
        description: businessInsights.topService
          ? `${businessInsights.topService.totalDemand} interacciones acumuladas.`
          : "Todavia no hay actividad suficiente para destacarlo."
      }
    ];
  }, [auth?.user.role, businessInsights, t]);
  const businessPerformanceCards = useMemo(() => {
    if (auth?.user.role !== "business" || !businessInsights) {
      return [];
    }

    return [
      {
        label: t({ es: "Solicitudes resueltas", en: "Resolved requests", eu: "Ebatutako eskaerak" }),
        value: `${businessInsights.responseHealth.requestResolutionRate}%`,
        description: "Porcentaje de solicitudes manuales que ya no siguen abiertas."
      },
      {
        label: t({ es: "Espera convertida", en: "Converted waitlist", eu: "Bihurtutako itxaron-zerrenda" }),
        value: `${businessInsights.responseHealth.waitlistConversionRate}%`,
        description: "Parte de la lista de espera que ha terminado en una reserva atendida."
      },
      {
        label: t({ es: "Reseñas respondidas", en: "Answered reviews", eu: "Erantzundako iritziak" }),
        value: `${businessInsights.responseHealth.reviewResponseRate}%`,
        description: "Cobertura pública de respuesta sobre las opiniones recibidas."
      }
    ];
  }, [auth?.user.role, businessInsights, t]);
  const businessTimeline = useMemo(() => {
    if (auth?.user.role !== "business" || !businessInsights?.activityTimeline?.length) {
      return [];
    }

    const maxLoad = Math.max(
      ...businessInsights.activityTimeline.map(
        (day) => day.reservations + day.waitlist + day.requests
      ),
      1
    );

    return businessInsights.activityTimeline.map((day) => {
      const total = day.reservations + day.waitlist + day.requests;
      const barHeight = total > 0 ? `${Math.max(18, Math.round((total / maxLoad) * 100))}%` : "10%";

      return {
        ...day,
        total,
        barHeight,
          label: new Date(`${day.day}T12:00:00`).toLocaleDateString(
            language === "en" ? "en-GB" : language === "eu" ? "eu-ES" : "es-ES",
            {
          weekday: "short",
          day: "numeric"
            }
          )
      };
    });
  }, [auth?.user.role, businessInsights, language]);
  const preparedBusinessServices = useMemo(
    () =>
      businessFormData.services.filter(
        (service) => service.title.trim() || service.description.trim()
      ),
    [businessFormData.services]
  );
  const preparedBusinessFaqs = useMemo(
    () => businessFormData.faqs.filter((faq) => faq.question.trim() || faq.answer.trim()),
    [businessFormData.faqs]
  );
  const openBusinessScheduleRules = useMemo(
    () => businessFormData.scheduleRules.filter((rule) => rule.isOpen),
    [businessFormData.scheduleRules]
  );
  const preparedBusinessScheduleExceptions = useMemo(
    () => businessFormData.scheduleExceptions.filter((exception) => exception.exceptionDate),
    [businessFormData.scheduleExceptions]
  );
  const activeServiceModeOption = useMemo(
    () =>
      serviceModeOptions.find((option) => option.value === businessFormData.serviceMode) ??
      serviceModeOptions[0],
    [businessFormData.serviceMode, serviceModeOptions]
  );
  const filteredBusinessAlerts = useMemo(() => {
    switch (activeInboxFilter) {
      case "today":
        return businessAlerts.filter((alert) => alert.bucket === "today");
      case "high":
        return businessAlerts.filter((alert) => alert.priority === "high");
      case "follow_up":
        return businessAlerts.filter((alert) => alert.bucket === "follow_up");
      default:
        return businessAlerts;
    }
  }, [activeInboxFilter, businessAlerts]);
  const businessInboxFilterOptions = useMemo(
    () =>
      getBusinessInboxFilters(language).map((filter) => {
        const count = businessAlerts.filter((alert) => {
          if (filter.id === "today") {
            return alert.bucket === "today";
          }

          if (filter.id === "high") {
            return alert.priority === "high";
          }

          if (filter.id === "follow_up") {
            return alert.bucket === "follow_up";
          }

          return true;
        }).length;

        return {
          ...filter,
          count
        };
      }),
    [businessAlerts, language]
  );
  const businessPanelSections = useMemo(() => {
    if (auth?.user.role !== "business") {
      return [];
    }

    return getBusinessPanelSections(language).map((section) => {
      switch (section.id) {
        case "identity":
          return {
            ...section,
            badge: businessFormData.name.trim() ? t({ es: "Listo", en: "Ready", eu: "Prest" }) : t({ es: "Base", en: "Base", eu: "Oinarria" }),
            helper:
              businessFormData.name.trim() && businessFormData.categoryId
                ? `${businessFormData.name} · ${activeServiceModeOption.label}`
                : t({ es: "Nombre comercial, categoria y modo principal.", en: "Business name, category and main mode.", eu: "Izen komertziala, kategoria eta modu nagusia." })
          };
        case "portal":
          return {
            ...section,
            badge:
              businessFormData.heroBadge.trim() || businessFormData.description.trim()
                ? t({ es: "Visible", en: "Live", eu: "Ikusgai" })
                : t({ es: "Pendiente", en: "Pending", eu: "Zain" }),
            helper: businessFormData.heroClaim.trim()
              ? businessFormData.heroClaim.trim()
              : businessFormData.address.trim()
                ? businessFormData.address
                : t({ es: "Descripcion, direccion y telefono publico.", en: "Description, address and public phone.", eu: "Deskribapena, helbidea eta telefono publikoa." })
          };
        case "schedule":
          return {
            ...section,
            badge: `${businessFormData.scheduleRules.filter((rule) => rule.isOpen).length}`,
            helper: businessFormData.scheduleExceptions.length > 0
              ? t(
                  {
                    es: "{{count}} fecha{{suffix}} especial{{suffix2}}",
                    en: "{{count}} special date{{suffix}}",
                    eu: "{{count}} data berezi"
                  },
                  {
                    count: businessFormData.scheduleExceptions.length,
                    suffix: businessFormData.scheduleExceptions.length === 1 ? "" : "s",
                    suffix2: businessFormData.scheduleExceptions.length === 1 ? "" : "es"
                  }
                )
              : t({ es: "Agenda base semanal y cierres puntuales.", en: "Weekly base schedule and one-off closures.", eu: "Asteko oinarrizko agenda eta itxiera puntualak." })
          };
        case "services":
          return {
            ...section,
            badge: `${preparedBusinessServices.length}`,
            helper:
              preparedBusinessServices.length > 0
                ? t(
                    {
                      es: "{{count}} oferta{{suffix}} configurada{{suffix2}}",
                      en: "{{count}} configured offer{{suffix}}",
                      eu: "{{count}} eskaintza konfiguratuta"
                    },
                    {
                      count: preparedBusinessServices.length,
                      suffix: preparedBusinessServices.length === 1 ? "" : "s",
                      suffix2: preparedBusinessServices.length === 1 ? "" : "s"
                    }
                  )
                : t({ es: "Aun no has definido la oferta principal.", en: "You have not defined the main offer yet.", eu: "Oraindik ez duzu eskaintza nagusia definitu." })
          };
        case "faq":
          return {
            ...section,
            badge:
              preparedBusinessFaqs.length > 0 ||
              businessFormData.cancellationPolicy.trim() ||
              businessFormData.visitNote.trim()
                ? t({ es: "Listo", en: "Ready", eu: "Prest" })
                : t({ es: "Base", en: "Base", eu: "Oinarria" }),
            helper:
              preparedBusinessFaqs.length > 0
                ? t(
                    {
                      es: "{{count}} FAQ publica{{suffix}}",
                      en: "{{count}} public FAQ{{suffix}}",
                      eu: "{{count}} FAQ publiko"
                    },
                    {
                      count: preparedBusinessFaqs.length,
                      suffix: preparedBusinessFaqs.length === 1 ? "" : "s"
                    }
                  )
                : t({ es: "Politicas, notas de visita y preguntas frecuentes.", en: "Policies, visit notes and common questions.", eu: "Politikak, bisita-oharrak eta ohiko galderak." })
          };
        case "inbox":
          return {
            ...section,
            badge: businessAlerts.length > 0 ? `${businessAlerts.length}` : "0",
            helper:
              businessAlerts.length > 0
                ? t(
                    {
                      es: "{{count}} alerta{{suffix}} operativa{{suffix2}}",
                      en: "{{count}} operational alert{{suffix}}",
                      eu: "{{count}} abisu operatibo"
                    },
                    {
                      count: businessAlerts.length,
                      suffix: businessAlerts.length === 1 ? "" : "s",
                      suffix2: businessAlerts.length === 1 ? "" : "s"
                    }
                  )
                : t({ es: "Sin alertas pendientes ahora mismo.", en: "No pending alerts right now.", eu: "Une honetan ez dago zain dagoen abisurik." })
          };
        case "insights":
          return {
            ...section,
            badge: businessInsights ? t({ es: "Activo", en: "Live", eu: "Aktibo" }) : t({ es: "Sin datos", en: "No data", eu: "Daturik ez" }),
            helper: businessInsights?.topService?.title
              ? t({ es: "Servicio mas activo: {{service}}", en: "Most active service: {{service}}", eu: "Zerbitzu aktiboena: {{service}}" }, { service: businessInsights.topService.title })
              : t({ es: "Las metricas apareceran cuando haya actividad.", en: "Metrics will appear once there is activity.", eu: "Metriak jarduera dagoenean agertuko dira." })
          };
        default:
          return section;
      }
    });
  }, [
    activeServiceModeOption.label,
    auth?.user.role,
    businessFormData.address,
    businessFormData.cancellationPolicy,
    businessFormData.categoryId,
    businessFormData.description,
    businessFormData.heroBadge,
    businessFormData.heroClaim,
    businessFormData.heroHighlight,
    businessFormData.scheduleExceptions.length,
    businessFormData.scheduleRules,
    businessFormData.name,
    businessFormData.visitNote,
    businessAlerts.length,
    businessInsights,
    preparedBusinessFaqs.length,
    preparedBusinessServices.length,
    language,
    t
  ]);
  const activeBusinessPanelConfig =
    businessPanelSections.find((section) => section.id === activeBusinessPanelSection) ??
    businessPanelSections[0] ??
    null;

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBusinessField(field, value) {
    setBusinessFormData((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBusinessService(index, field, value) {
    setBusinessFormData((current) => ({
      ...current,
      services: current.services.map((service, currentIndex) =>
        currentIndex === index
          ? {
              ...service,
              [field]: value
            }
          : service
      )
    }));
  }

  function addBusinessService() {
    setBusinessFormData((current) => ({
      ...current,
      services: [...current.services, createEmptyBusinessService()]
    }));
  }

  function updateBusinessFaq(index, field, value) {
    setBusinessFormData((current) => ({
      ...current,
      faqs: current.faqs.map((faq, currentIndex) =>
        currentIndex === index
          ? {
              ...faq,
              [field]: value
            }
          : faq
      )
    }));
  }

  function addBusinessFaq() {
    setBusinessFormData((current) => ({
      ...current,
      faqs: [...current.faqs, createEmptyBusinessFaq()]
    }));
  }

  function removeBusinessFaq(index) {
    setBusinessFormData((current) => {
      const nextFaqs = current.faqs.filter((_, currentIndex) => currentIndex !== index);

      return {
        ...current,
        faqs: nextFaqs.length > 0 ? nextFaqs : [createEmptyBusinessFaq()]
      };
    });
  }

  function removeBusinessService(index) {
    setBusinessFormData((current) => {
      const nextServices = current.services.filter((_, currentIndex) => currentIndex !== index);

      return {
        ...current,
        services: nextServices.length > 0 ? nextServices : [createEmptyBusinessService()]
      };
    });
  }

  function updateBusinessScheduleRule(dayOfWeek, field, value) {
    setBusinessFormData((current) => ({
      ...current,
      scheduleRules: current.scheduleRules.map((rule) =>
        rule.dayOfWeek === dayOfWeek
          ? {
              ...rule,
              [field]: value
            }
          : rule
      )
    }));
  }

  function updateBusinessScheduleException(index, field, value) {
    setBusinessFormData((current) => ({
      ...current,
      scheduleExceptions: current.scheduleExceptions.map((exception, currentIndex) =>
        currentIndex === index
          ? {
              ...exception,
              [field]: value
            }
          : exception
      )
    }));
  }

  function addBusinessScheduleException() {
    setBusinessFormData((current) => ({
      ...current,
      scheduleExceptions: [...current.scheduleExceptions, createEmptyBusinessScheduleException()]
    }));
  }

  function removeBusinessScheduleException(index) {
    setBusinessFormData((current) => ({
      ...current,
      scheduleExceptions: current.scheduleExceptions.filter((_, currentIndex) => currentIndex !== index)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await updateCurrentUser(formData);
      onUserUpdate(response.user);
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBusinessSubmit(event) {
    event.preventDefault();
    setIsLoadingBusinessData(true);
    setBusinessSuccessMessage("");
    setBusinessErrorMessage("");

    try {
      const response = await saveMyBusinessProfile({
        ...businessFormData,
        categoryId: Number(businessFormData.categoryId),
        scheduleRules: businessFormData.scheduleRules.map((rule) => ({
          dayOfWeek: rule.dayOfWeek,
          isOpen: Boolean(rule.isOpen),
          openTime: rule.isOpen ? rule.openTime : null,
          closeTime: rule.isOpen ? rule.closeTime : null,
          slotIntervalMinutes: Number(rule.slotIntervalMinutes)
        })),
        scheduleExceptions: businessFormData.scheduleExceptions.map((exception) => ({
          exceptionDate: exception.exceptionDate,
          isClosed: Boolean(exception.isClosed),
          openTime: exception.isClosed ? null : exception.openTime,
          closeTime: exception.isClosed ? null : exception.closeTime,
          slotIntervalMinutes: Number(exception.slotIntervalMinutes),
          note: exception.note
        }))
      });
      setBusinessSuccessMessage(response.message);
      setBusinessRecordId(response.business.id ?? null);
      setBusinessInsights(response.business.insights ?? createEmptyBusinessInsights());
      setBusinessAlerts(response.business.alerts ?? createEmptyBusinessAlerts());
      setBusinessFormData({
        name: response.business.name ?? "",
        categoryId: response.business.categoryId ? String(response.business.categoryId) : "",
        serviceMode: response.business.serviceMode ?? "booking",
        description: response.business.description ?? "",
        address: response.business.address ?? "",
        phone: response.business.phone ?? "",
        visitNote: response.business.visitNote ?? "",
        cancellationPolicy: response.business.cancellationPolicy ?? "",
        heroBadge: response.business.heroBadge ?? "",
        heroClaim: response.business.heroClaim ?? "",
        heroHighlight: response.business.heroHighlight ?? "",
        services:
          response.business.services?.length > 0
            ? response.business.services.map((service) => ({
                title: service.title ?? "",
                kind: service.kind ?? "service",
                description: service.description ?? "",
                priceLabel: service.priceLabel ?? "",
                durationMinutes: service.durationMinutes ? String(service.durationMinutes) : "",
                capacity: service.capacity ? String(service.capacity) : ""
              }))
            : [createEmptyBusinessService()],
        faqs:
          response.business.faqs?.length > 0
            ? response.business.faqs.map((faq) => ({
                question: faq.question ?? "",
                answer: faq.answer ?? ""
              }))
            : [createEmptyBusinessFaq()],
        scheduleRules:
          response.business.scheduleRules?.length > 0
            ? response.business.scheduleRules.map((rule) => ({
                dayOfWeek: rule.dayOfWeek,
                label: rule.label,
                isOpen: Boolean(rule.isOpen),
                openTime: rule.openTime ?? "",
                closeTime: rule.closeTime ?? "",
                slotIntervalMinutes: String(rule.slotIntervalMinutes ?? 60)
              }))
            : createDefaultBusinessScheduleRules(),
        scheduleExceptions:
          response.business.scheduleExceptions?.length > 0
            ? response.business.scheduleExceptions.map((exception) => ({
                exceptionDate: exception.exceptionDate ?? "",
                isClosed: Boolean(exception.isClosed),
                openTime: exception.openTime ?? "10:00",
                closeTime: exception.closeTime ?? "14:00",
                slotIntervalMinutes: String(exception.slotIntervalMinutes ?? 60),
                note: exception.note ?? ""
              }))
            : []
      });
    } catch (error) {
      setBusinessErrorMessage(error.message);
    } finally {
      setIsLoadingBusinessData(false);
    }
  }

  if (isHydratingAuth) {
    return <p>{t({ es: "Verificando sesion...", en: "Checking session...", eu: "Saioa egiaztatzen..." })}</p>;
  }

  if (!auth) {
    return (
      <section className="card auth-card">
        <h2>{t({ es: "Mi perfil", en: "My profile", eu: "Nire profila" })}</h2>
        <p className="auth-copy">
          {t({ es: "Inicia sesion para editar tu perfil, anadir una foto y mostrar tus enlaces sociales.", en: "Sign in to edit your profile, add a photo and show your social links.", eu: "Hasi saioa zure profila editatzeko, argazki bat gehitzeko eta zure sare sozialak erakusteko." })}
        </p>
        <Link className="button" to="/login">
          {t({ es: "Ir a login", en: "Go to login", eu: "Joan saioa hastera" })}
        </Link>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <header className="card profile-hero">
        <div className="profile-hero-copy">
          <p className="eyebrow">{t({ es: "Perfil", en: "Profile", eu: "Profila" })}</p>
          <h2>{t({ es: "Tu espacio personal dentro de DonostiGo", en: "Your personal space inside DonostiGo", eu: "DonostiGo barruko zure espazio pertsonala" })}</h2>
          <p className="section-copy">
            {t({ es: "En esta fase puedes editar los datos basicos del perfil, mostrar una foto mediante URL y enlazar tus redes o una publicacion destacada.", en: "At this stage you can edit the basic profile data, display a photo via URL and link your social accounts or a featured post.", eu: "Fase honetan profil-datu oinarrizkoak editatu, URL bidez argazki bat erakutsi eta zure sareak edo nabarmendutako argitalpen bat lotu ditzakezu." })}
          </p>
        </div>

        <div className="profile-hero-meta">
          <div>
            <strong>{auth.user.role === "business" ? t({ es: "Cuenta de negocio", en: "Business account", eu: "Negozio kontua" }) : t({ es: "Cuenta cliente", en: "Client account", eu: "Bezero kontua" })}</strong>
            <span>{auth.user.email}</span>
          </div>
          <div>
            <strong>{t({ es: "Visibilidad", en: "Visibility", eu: "Ikusgarritasuna" })}</strong>
            <span>{t({ es: "Datos visibles dentro de la aplicacion", en: "Data visible inside the app", eu: "Aplikazio barruan ikusgai dauden datuak" })}</span>
          </div>
        </div>
      </header>

      <section className="profile-dashboard">
        <article className="card profile-stat-card">
          <span>{t({ es: "Perfil", en: "Profile", eu: "Profila" })}</span>
          <strong>{profileSummary.percent}%</strong>
          <p>
            {profileSummary.completed} de {profileSummary.total} bloques completados.
          </p>
        </article>

        <article className="card profile-stat-card">
          <span>{t({ es: "Enlaces visibles", en: "Visible links", eu: "Ikusgai dauden estekak" })}</span>
          <strong>{socialLinks.length}</strong>
          <p>{t({ es: "Redes o publicaciones que ya se mostraran en la vista previa.", en: "Networks or posts already visible in the preview.", eu: "Aurrebistan erakutsiko diren sareak edo argitalpenak." })}</p>
        </article>

        {auth.user.role === "business" ? (
          <article className="card profile-stat-card profile-stat-card-business">
            <span>{t({ es: "Ficha del negocio", en: "Business profile", eu: "Negozioaren fitxa" })}</span>
            <strong>{businessSummary?.percent ?? 0}%</strong>
            <p>
              {t(
                {
                  es: "{{completed}} de {{total}} bloques listos para el catalogo.",
                  en: "{{completed}} of {{total}} blocks ready for the catalogue.",
                  eu: "{{completed}} / {{total}} bloke prest katalogorako."
                },
                {
                  completed: businessSummary?.completed ?? 0,
                  total: businessSummary?.total ?? 0
                }
              )}
            </p>
          </article>
        ) : (
          <article className="card profile-stat-card profile-stat-card-user">
            <span>{t({ es: "Tipo de cuenta", en: "Account type", eu: "Kontu mota" })}</span>
            <strong>{t({ es: "Cliente", en: "Client", eu: "Bezeroa" })}</strong>
            <p>{t({ es: "Preparada para consultar negocios, reservar y publicar resenas.", en: "Ready to browse businesses, book and publish reviews.", eu: "Negozioak ikusteko, erreserbatzeko eta iritziak argitaratzeko prest." })}</p>
          </article>
        )}

        {businessInsightCards.map((card) => (
          <article key={card.label} className="card profile-stat-card profile-stat-card-insight">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.description}</p>
          </article>
        ))}
      </section>

      <div className="profile-layout">
        <div className="profile-stack">
          <article className="card">
            <h3>{t({ es: "Editar perfil", en: "Edit profile", eu: "Editatu profila" })}</h3>
            <p className="section-copy">
              {t({ es: "Puedes ajustar la informacion publica sin tocar el email ni la contrasena.", en: "You can adjust public information without touching the email or password.", eu: "Informazio publikoa egokitu dezakezu emaila edo pasahitza ukitu gabe." })}
            </p>

            <form className="form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder={t({ es: "Nombre visible", en: "Visible name", eu: "Ikusgai den izena" })}
                value={formData.name}
                maxLength={100}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
              <input
                type="text"
                placeholder={t({ es: "Ciudad", en: "City", eu: "Hiria" })}
                value={formData.city}
                maxLength={120}
                onChange={(event) => updateField("city", event.target.value)}
              />
              <input
                type="url"
                placeholder={t({ es: "URL de la foto de perfil", en: "Profile photo URL", eu: "Profil-argazkiaren URLa" })}
                value={formData.avatarUrl}
                maxLength={300}
                onChange={(event) => updateField("avatarUrl", event.target.value)}
              />
              <textarea
                rows="5"
                placeholder={t({ es: "Presentacion breve", en: "Short intro", eu: "Aurkezpen laburra" })}
                value={formData.bio}
                maxLength={500}
                onChange={(event) => updateField("bio", event.target.value)}
              />
              <input
                type="url"
                placeholder={t({ es: "URL de Instagram", en: "Instagram URL", eu: "Instagram URLa" })}
                value={formData.instagramUrl}
                maxLength={300}
                onChange={(event) => updateField("instagramUrl", event.target.value)}
              />
              <input
                type="url"
                placeholder={t({ es: "URL de TikTok", en: "TikTok URL", eu: "TikTok URLa" })}
                value={formData.tiktokUrl}
                maxLength={300}
                onChange={(event) => updateField("tiktokUrl", event.target.value)}
              />
              <input
                type="url"
                placeholder={t({ es: "URL de publicacion destacada", en: "Featured post URL", eu: "Nabarmendutako argitalpenaren URLa" })}
                value={formData.featuredPostUrl}
                maxLength={300}
                onChange={(event) => updateField("featuredPostUrl", event.target.value)}
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t({ es: "Guardando...", en: "Saving...", eu: "Gordetzen..." }) : t({ es: "Guardar perfil", en: "Save profile", eu: "Gorde profila" })}
              </button>
            </form>

            {successMessage ? <p className="status-message success">{successMessage}</p> : null}
            {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
          </article>

          {auth.user.role === "business" ? (
            <article className="card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{t({ es: "Workspace", en: "Workspace", eu: "Workspace" })}</p>
                  <h3>{t({ es: "Panel del negocio", en: "Business panel", eu: "Negozio panela" })}</h3>
                </div>
                <p className="section-copy">
                  {t({ es: "Estructura la ficha como un panel real: identidad, portal publico, oferta, informacion operativa e insights.", en: "Structure the profile like a real panel: identity, public portal, offer, operational information and insights.", eu: "Antolatu fitxa benetako panel baten moduan: identitatea, atari publikoa, eskaintza, informazio operatiboa eta insights-ak." })}
                </p>
              </div>

              {isLoadingBusinessData && categories.length === 0 ? <p>{t({ es: "Cargando ficha...", en: "Loading profile...", eu: "Fitxa kargatzen..." })}</p> : null}

              <form className="business-workspace" onSubmit={handleBusinessSubmit}>
                <aside className="business-workspace-sidebar">
                  <div className="business-workspace-intro">
                    <p className="eyebrow">{t({ es: "Backoffice", en: "Back office", eu: "Backoffice" })}</p>
                    <strong>{businessFormData.name || auth.user.name}</strong>
                    <p className="section-copy">
                      {t({ es: "Organiza la presencia del negocio como si fuera un portal real de gestion.", en: "Organise the business presence like a real operating portal.", eu: "Antolatu negozioaren presentzia benetako kudeaketa-atari baten moduan." })}
                    </p>
                  </div>

                  <div className="business-workspace-intro">
                    <strong>{t({ es: "Estado de la ficha", en: "Profile status", eu: "Fitxaren egoera" })}</strong>
                    <div className="profile-progress">
                      <div className="profile-progress-bar">
                        <span style={{ width: `${businessSummary?.percent ?? 0}%` }} />
                      </div>
                      <p className="section-copy">
                        {t(
                          {
                            es: "{{completed}} de {{total}} bloques completos.",
                            en: "{{completed}} of {{total}} completed blocks.",
                            eu: "{{completed}} / {{total}} bloke osatuta."
                          },
                          {
                            completed: businessSummary?.completed ?? 0,
                            total: businessSummary?.total ?? 0
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="business-workspace-intro">
                    <strong>{t({ es: "Estado operativo", en: "Operational status", eu: "Egoera operatiboa" })}</strong>
                    <div className="profile-checklist">
                      <div className="profile-checklist-item is-complete">
                        <span>{t({ es: "Modo activo", en: "Active mode", eu: "Modu aktiboa" })}</span>
                        <strong>{activeServiceModeOption.label}</strong>
                        <p>{activeServiceModeOption.summary}</p>
                      </div>
                      <div className="profile-checklist-item is-complete">
                        <span>{t({ es: "Demanda pendiente", en: "Pending demand", eu: "Zain dagoen eskaria" })}</span>
                        <strong>
                          {(businessInsights?.waitlist.active ?? 0) +
                            (businessInsights?.requests.pending ?? 0)}
                        </strong>
                        <p>{t({ es: "Espera activa y solicitudes manuales aun sin cerrar.", en: "Active waitlist and manual requests still open.", eu: "Oraindik itxi gabe dauden itxaron-zerrenda eta eskaera manualak." })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="business-workspace-nav">
                    {businessPanelSections.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        className={
                          activeBusinessPanelSection === section.id
                            ? "business-workspace-tab is-active"
                            : "business-workspace-tab"
                        }
                        onClick={() => setActiveBusinessPanelSection(section.id)}
                      >
                        <span>{section.badge}</span>
                        <strong>{section.label}</strong>
                        <p>{section.helper}</p>
                      </button>
                    ))}
                  </div>

                  <div className="business-workspace-shortcuts">
                    <strong>{t({ es: "Accesos rapidos", en: "Quick links", eu: "Sarbide azkarrak" })}</strong>
                    <div className="business-workspace-shortcut-list">
                      <Link className="button secondary" to="/my-reservations">
                        {t({ es: "Ver actividad del negocio", en: "View business activity", eu: "Ikusi negozioaren jarduera" })}
                      </Link>
                      {businessRecordId ? (
                        <Link className="button secondary" to={`/businesses/${businessRecordId}`}>
                          {t({ es: "Abrir ficha publica", en: "Open public profile", eu: "Ireki fitxa publikoa" })}
                        </Link>
                      ) : null}
                      <Link className="button secondary" to="/guides">
                        {t({ es: "Ver guias publicas", en: "View public guides", eu: "Ikusi gida publikoak" })}
                      </Link>
                    </div>
                  </div>
                </aside>

                <div className="business-workspace-body">
                  <header className="business-workspace-header">
                    <div>
                      <p className="eyebrow">{activeBusinessPanelConfig?.label || t({ es: "Panel", en: "Panel", eu: "Panela" })}</p>
                      <h4>{activeBusinessPanelConfig?.title || t({ es: "Configuracion del negocio", en: "Business settings", eu: "Negozioaren konfigurazioa" })}</h4>
                    </div>
                    <p className="section-copy">
                      {activeBusinessPanelConfig?.description ||
                        t({ es: "Ajusta la ficha publica del negocio y deja todo preparado para la demo.", en: "Adjust the public business profile and leave everything ready for the demo.", eu: "Egokitu negozioaren fitxa publikoa eta utzi dena demorarako prest." })}
                    </p>
                  </header>

                  {activeBusinessPanelSection === "identity" ? (
                    <section className="business-panel-section">
                      <div className="profile-socials">
                        <strong>{t({ es: "Identidad comercial", en: "Commercial identity", eu: "Identitate komertziala" })}</strong>
                        <p className="section-copy">
                          {t({ es: "Este bloque define como se presenta tu negocio en el catalogo y que tipo de interaccion principal ofrece.", en: "This block defines how your business appears in the catalogue and what main interaction it offers.", eu: "Bloke honek zure negozioa katalogoan nola aurkezten den eta zein elkarreragin mota nagusi eskaintzen duen definitzen du." })}
                        </p>
                        <input
                          type="text"
                          placeholder={t({ es: "Nombre comercial", en: "Business name", eu: "Izen komertziala" })}
                          value={businessFormData.name}
                          maxLength={150}
                          onChange={(event) => updateBusinessField("name", event.target.value)}
                          required
                        />
                        <select
                          value={businessFormData.categoryId}
                          onChange={(event) => updateBusinessField("categoryId", event.target.value)}
                          required
                        >
                          <option value="">{t({ es: "Selecciona una categoria", en: "Select a category", eu: "Hautatu kategoria bat" })}</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={businessFormData.serviceMode}
                          onChange={(event) => updateBusinessField("serviceMode", event.target.value)}
                          required
                        >
                          {serviceModeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="business-mode-grid">
                        {serviceModeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={
                              businessFormData.serviceMode === option.value
                                ? "business-mode-card is-active"
                                : "business-mode-card"
                            }
                            onClick={() => updateBusinessField("serviceMode", option.value)}
                          >
                            <span>
                              {businessFormData.serviceMode === option.value
                                ? t({ es: "Activo", en: "Active", eu: "Aktibo" })
                                : t({ es: "Disponible", en: "Available", eu: "Erabilgarri" })}
                            </span>
                            <strong>{option.label}</strong>
                            <p>{option.summary}</p>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {activeBusinessPanelSection === "portal" ? (
                    <section className="business-panel-section">
                      <div className="profile-socials">
                        <strong>{t({ es: "Presentacion publica", en: "Public presentation", eu: "Aurkezpen publikoa" })}</strong>
                        <p className="section-copy">
                          {t({ es: "Aqui defines el tono de la ficha publica y la informacion que vera el usuario antes de reservar o enviar una solicitud.", en: "Here you define the tone of the public profile and the information users will see before booking or sending a request.", eu: "Hemen definitzen duzu fitxa publikoaren tonua eta erabiltzaileak erreserbatu edo eskaera bidali aurretik ikusiko duen informazioa." })}
                        </p>
                        <textarea
                          rows="5"
                          placeholder={t({ es: "Descripcion del negocio", en: "Business description", eu: "Negozioaren deskribapena" })}
                          value={businessFormData.description}
                          maxLength={1200}
                          onChange={(event) => updateBusinessField("description", event.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder={t({ es: "Badge corto del portal (ej. Experiencia local)", en: "Short portal badge (e.g. Local experience)", eu: "Atariko badge laburra (adib. Tokiko esperientzia)" })}
                          value={businessFormData.heroBadge}
                          maxLength={80}
                          onChange={(event) => updateBusinessField("heroBadge", event.target.value)}
                        />
                        <input
                          type="text"
                          placeholder={t({ es: "Claim visible en la cabecera publica", en: "Visible claim for the public header", eu: "Goiburu publikoan ikusgai den claim-a" })}
                          value={businessFormData.heroClaim}
                          maxLength={160}
                          onChange={(event) => updateBusinessField("heroClaim", event.target.value)}
                        />
                        <textarea
                          rows="3"
                          placeholder={t({ es: "Mensaje destacado del portal o del servicio", en: "Highlighted portal or service message", eu: "Atariaren edo zerbitzuaren mezu nabarmendua" })}
                          value={businessFormData.heroHighlight}
                          maxLength={320}
                          onChange={(event) =>
                            updateBusinessField("heroHighlight", event.target.value)
                          }
                        />
                        <input
                          type="text"
                          placeholder={t({ es: "Direccion", en: "Address", eu: "Helbidea" })}
                          value={businessFormData.address}
                          maxLength={200}
                          onChange={(event) => updateBusinessField("address", event.target.value)}
                          required
                        />
                        <p className="detail-note">
                          {t({ es: "Esta direccion se utilizara para la ubicacion del negocio y para abrirla directamente en Google Maps.", en: "This address will be used for the business location and to open it directly in Google Maps.", eu: "Helbide hau negozioaren kokapenerako eta Google Maps-en zuzenean irekitzeko erabiliko da." })}
                        </p>
                        <input
                          type="text"
                          placeholder={t({ es: "Telefono", en: "Phone", eu: "Telefonoa" })}
                          value={businessFormData.phone}
                          maxLength={30}
                          onChange={(event) => updateBusinessField("phone", event.target.value)}
                        />
                        <textarea
                          rows="3"
                          placeholder={t({ es: "Nota para la visita o la experiencia", en: "Note for the visit or experience", eu: "Bisitarako edo esperientziarako oharra" })}
                          value={businessFormData.visitNote}
                          maxLength={600}
                          onChange={(event) => updateBusinessField("visitNote", event.target.value)}
                        />
                        <textarea
                          rows="3"
                          placeholder={t({ es: "Politica de cancelacion o cambios", en: "Cancellation or change policy", eu: "Ezeztapen edo aldaketen politika" })}
                          value={businessFormData.cancellationPolicy}
                          maxLength={600}
                          onChange={(event) =>
                            updateBusinessField("cancellationPolicy", event.target.value)
                          }
                        />
                      </div>
                    </section>
                  ) : null}

                  {activeBusinessPanelSection === "schedule" ? (
                    <section className="business-panel-section">
                      <div className="profile-socials">
                        <strong>{t({ es: "Horario base semanal", en: "Weekly base schedule", eu: "Asteko oinarrizko ordutegia" })}</strong>
                        <p className="section-copy">
                          {t({ es: "Ajusta los dias abiertos, el tramo horario y el ritmo de generacion de franjas. Si no hay agenda, ese dia no apareceran huecos en la ficha publica.", en: "Adjust open days, operating hours and slot cadence. If there is no schedule, that day will not show openings in the public profile.", eu: "Doitu irekitako egunak, ordutegia eta txanden erritmoa. Agendarik ez badago, egun horretan ez da hutsunerik agertuko fitxa publikoan." })}
                        </p>

                        <div className="business-schedule-grid">
                          {businessFormData.scheduleRules.map((rule) => (
                            <article key={rule.dayOfWeek} className="business-schedule-card">
                              <div className="business-schedule-card-header">
                                <div>
                                  <strong>{rule.label}</strong>
                                  <p className="section-copy">
                                    {rule.isOpen
                                      ? `${rule.openTime} · ${rule.closeTime}`
                                      : t({ es: "Sin agenda publica", en: "No public schedule", eu: "Agenda publikorik ez" })}
                                  </p>
                                </div>
                                <label className="business-schedule-toggle">
                                  <input
                                    type="checkbox"
                                    checked={rule.isOpen}
                                    onChange={(event) =>
                                      updateBusinessScheduleRule(
                                        rule.dayOfWeek,
                                        "isOpen",
                                        event.target.checked
                                      )
                                    }
                                  />
                                  <span>{rule.isOpen ? t({ es: "Abierto", en: "Open", eu: "Irekita" }) : t({ es: "Cerrado", en: "Closed", eu: "Itxita" })}</span>
                                </label>
                              </div>

                              {rule.isOpen ? (
                                <div className="detail-availability-controls">
                                  <label className="detail-field">
                                    <span>{t({ es: "Apertura", en: "Opens", eu: "Irekiera" })}</span>
                                    <input
                                      type="time"
                                      value={rule.openTime}
                                      onChange={(event) =>
                                        updateBusinessScheduleRule(
                                          rule.dayOfWeek,
                                          "openTime",
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="detail-field">
                                    <span>{t({ es: "Cierre", en: "Closes", eu: "Itxiera" })}</span>
                                    <input
                                      type="time"
                                      value={rule.closeTime}
                                      onChange={(event) =>
                                        updateBusinessScheduleRule(
                                          rule.dayOfWeek,
                                          "closeTime",
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="detail-field business-schedule-field-wide">
                                    <span>{t({ es: "Ritmo de franjas", en: "Slot cadence", eu: "Txanden erritmoa" })}</span>
                                    <select
                                      value={rule.slotIntervalMinutes}
                                      onChange={(event) =>
                                        updateBusinessScheduleRule(
                                          rule.dayOfWeek,
                                          "slotIntervalMinutes",
                                          event.target.value
                                        )
                                      }
                                    >
                                      {slotIntervalOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              ) : (
                                <p className="detail-note">
                                  {t({ es: "Puedes dejar este dia cerrado o volver a activarlo cuando quieras.", en: "You can keep this day closed or activate it again whenever you want.", eu: "Egun hau itxita utz dezakezu edo nahi duzunean berriro aktibatu." })}
                                </p>
                              )}
                            </article>
                          ))}
                        </div>
                      </div>

                      <div className="profile-socials">
                        <div className="section-heading">
                          <div>
                            <strong>{t({ es: "Fechas especiales", en: "Special dates", eu: "Data bereziak" })}</strong>
                            <p className="section-copy">
                              {t({ es: "Define cierres puntuales, festivos o ventanas concretas para una fecha.", en: "Set one-off closures, holiday overrides or custom windows for a specific day.", eu: "Zehaztu itxiera puntualak, jai-egunak edo data baterako leiho bereziak." })}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="button secondary"
                            onClick={addBusinessScheduleException}
                          >
                            {t({ es: "Anadir fecha especial", en: "Add special date", eu: "Gehitu data berezia" })}
                          </button>
                        </div>

                        {businessFormData.scheduleExceptions.length === 0 ? (
                          <p className="detail-note">
                            {t({ es: "Todavia no has anadido excepciones. La agenda semanal sera la referencia.", en: "You have not added exceptions yet. The weekly schedule will be the reference.", eu: "Oraindik ez duzu salbuespenik gehitu. Asteko agenda izango da erreferentzia." })}
                          </p>
                        ) : (
                          <div className="profile-checklist">
                            {businessFormData.scheduleExceptions.map((exception, index) => (
                              <div
                                key={`${exception.exceptionDate}-${index}`}
                                className="profile-checklist-item business-schedule-exception"
                              >
                                <div className="business-schedule-card-header">
                                  <strong>{t({ es: "Fecha especial {{count}}", en: "Special date {{count}}", eu: "{{count}}. data berezia" }, { count: index + 1 })}</strong>
                                  <button
                                    type="button"
                                    className="button secondary"
                                    onClick={() => removeBusinessScheduleException(index)}
                                  >
                                    {t({ es: "Eliminar", en: "Remove", eu: "Ezabatu" })}
                                  </button>
                                </div>

                                <div className="detail-availability-controls">
                                  <label className="detail-field">
                                    <span>{t({ es: "Fecha", en: "Date", eu: "Data" })}</span>
                                    <input
                                      type="date"
                                      value={exception.exceptionDate}
                                      onChange={(event) =>
                                        updateBusinessScheduleException(
                                          index,
                                          "exceptionDate",
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="business-schedule-toggle">
                                    <input
                                      type="checkbox"
                                      checked={exception.isClosed}
                                      onChange={(event) =>
                                        updateBusinessScheduleException(
                                          index,
                                          "isClosed",
                                          event.target.checked
                                        )
                                      }
                                    />
                                    <span>{exception.isClosed ? t({ es: "Cierre total", en: "Full closure", eu: "Itxiera osoa" }) : t({ es: "Apertura especial", en: "Special opening", eu: "Irekiera berezia" })}</span>
                                  </label>
                                </div>

                                {!exception.isClosed ? (
                                  <div className="detail-availability-controls">
                                    <label className="detail-field">
                                      <span>{t({ es: "Apertura", en: "Opens", eu: "Irekiera" })}</span>
                                      <input
                                        type="time"
                                        value={exception.openTime}
                                        onChange={(event) =>
                                          updateBusinessScheduleException(
                                            index,
                                            "openTime",
                                            event.target.value
                                          )
                                        }
                                      />
                                    </label>
                                    <label className="detail-field">
                                      <span>{t({ es: "Cierre", en: "Closes", eu: "Itxiera" })}</span>
                                      <input
                                        type="time"
                                        value={exception.closeTime}
                                        onChange={(event) =>
                                          updateBusinessScheduleException(
                                            index,
                                            "closeTime",
                                            event.target.value
                                          )
                                        }
                                      />
                                    </label>
                                    <label className="detail-field business-schedule-field-wide">
                                      <span>{t({ es: "Ritmo de franjas", en: "Slot cadence", eu: "Txanden erritmoa" })}</span>
                                      <select
                                        value={exception.slotIntervalMinutes}
                                        onChange={(event) =>
                                          updateBusinessScheduleException(
                                            index,
                                            "slotIntervalMinutes",
                                            event.target.value
                                          )
                                        }
                                      >
                                        {slotIntervalOptions.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                ) : null}

                                <textarea
                                  rows="2"
                                  placeholder={t({ es: "Nota opcional para explicar esta excepcion", en: "Optional note to explain this exception", eu: "Salbuespen hau azaltzeko aukerako oharra" })}
                                  value={exception.note}
                                  maxLength={240}
                                  onChange={(event) =>
                                    updateBusinessScheduleException(index, "note", event.target.value)
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  ) : null}

                  {activeBusinessPanelSection === "services" ? (
                    <section className="business-panel-section">
                      <div className="profile-socials">
                        <strong>{t({ es: "Oferta y experiencias", en: "Offer and experiences", eu: "Eskaintza eta esperientziak" })}</strong>
                        <p className="section-copy">
                          {t({ es: "Configura servicios, bonos, packs o solicitudes especiales segun el tipo de negocio que estes construyendo.", en: "Configure services, vouchers, packs or special requests depending on the kind of business you are shaping.", eu: "Konfiguratu zerbitzuak, bonuak, pack-ak edo eskaera bereziak eraikitzen ari zaren negozio motaren arabera." })}
                        </p>
                        <div className="profile-checklist">
                          {businessFormData.services.map((service, index) => (
                            <div key={`${index}-${service.title}`} className="profile-checklist-item">
                              <strong>{t({ es: "Servicio {{count}}", en: "Service {{count}}", eu: "{{count}}. zerbitzua" }, { count: index + 1 })}</strong>
                              <select
                                value={service.kind || "service"}
                                onChange={(event) =>
                                  updateBusinessService(index, "kind", event.target.value)
                                }
                              >
                                {requestServiceKindOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <p className="section-copy">
                                {getRequestServiceKindConfig(service.kind, language).summary}
                              </p>
                              <input
                                type="text"
                                placeholder={t({ es: "Titulo del servicio", en: "Service title", eu: "Zerbitzuaren titulua" })}
                                value={service.title}
                                maxLength={120}
                                onChange={(event) =>
                                  updateBusinessService(index, "title", event.target.value)
                                }
                              />
                              <textarea
                                rows="3"
                                placeholder={t({ es: "Descripcion corta", en: "Short description", eu: "Deskribapen laburra" })}
                                value={service.description}
                                maxLength={500}
                                onChange={(event) =>
                                  updateBusinessService(index, "description", event.target.value)
                                }
                              />
                              <input
                                type="text"
                                placeholder={t({ es: "Precio o referencia (ej. 35 €)", en: "Price or reference (e.g. €35)", eu: "Prezioa edo erreferentzia (adib. 35 €)" })}
                                value={service.priceLabel}
                                maxLength={80}
                                onChange={(event) =>
                                  updateBusinessService(index, "priceLabel", event.target.value)
                                }
                              />
                              <div className="auth-helper-grid">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder={t({ es: "Duracion en minutos", en: "Duration in minutes", eu: "Iraupena minututan" })}
                                  value={service.durationMinutes}
                                  onChange={(event) =>
                                    updateBusinessService(index, "durationMinutes", event.target.value)
                                  }
                                />
                                <input
                                  type="number"
                                  min="1"
                                  placeholder={t({ es: "Capacidad", en: "Capacity", eu: "Edukiera" })}
                                  value={service.capacity}
                                  onChange={(event) =>
                                    updateBusinessService(index, "capacity", event.target.value)
                                  }
                                />
                              </div>
                              <button
                                type="button"
                                className="button secondary"
                                onClick={() => removeBusinessService(index)}
                              >
                                {t({ es: "Eliminar servicio", en: "Remove service", eu: "Ezabatu zerbitzua" })}
                              </button>
                            </div>
                          ))}
                        </div>
                        <button type="button" className="button secondary" onClick={addBusinessService}>
                          {t({ es: "Anadir otro servicio", en: "Add another service", eu: "Gehitu beste zerbitzu bat" })}
                        </button>
                      </div>
                    </section>
                  ) : null}

                  {activeBusinessPanelSection === "faq" ? (
                    <section className="business-panel-section">
                      <div className="profile-socials">
                        <strong>{t({ es: "FAQ y politicas", en: "FAQ and policies", eu: "FAQ eta politikak" })}</strong>
                        <p className="section-copy">
                          {t({ es: "Refuerza la claridad del portal con respuestas rapidas y mensajes operativos.", en: "Make the portal clearer with quick answers and operational notes.", eu: "Indartu atariaren argitasuna erantzun azkarrekin eta ohar operatiboekin." })}
                        </p>
                        <div className="profile-checklist">
                          {businessFormData.faqs.map((faq, index) => (
                            <div key={`${index}-${faq.question}`} className="profile-checklist-item">
                              <strong>{t({ es: "FAQ {{count}}", en: "FAQ {{count}}", eu: "{{count}}. FAQ" }, { count: index + 1 })}</strong>
                              <input
                                type="text"
                                placeholder={t({ es: "Pregunta frecuente", en: "Frequently asked question", eu: "Ohiko galdera" })}
                                value={faq.question}
                                maxLength={160}
                                onChange={(event) =>
                                  updateBusinessFaq(index, "question", event.target.value)
                                }
                              />
                              <textarea
                                rows="3"
                                placeholder={t({ es: "Respuesta breve", en: "Short answer", eu: "Erantzun laburra" })}
                                value={faq.answer}
                                maxLength={600}
                                onChange={(event) =>
                                  updateBusinessFaq(index, "answer", event.target.value)
                                }
                              />
                              <button
                                type="button"
                                className="button secondary"
                                onClick={() => removeBusinessFaq(index)}
                              >
                                {t({ es: "Eliminar FAQ", en: "Remove FAQ", eu: "Ezabatu FAQ" })}
                              </button>
                            </div>
                          ))}
                        </div>
                        <button type="button" className="button secondary" onClick={addBusinessFaq}>
                          {t({ es: "Anadir FAQ", en: "Add FAQ", eu: "Gehitu FAQ" })}
                        </button>
                      </div>
                    </section>
                  ) : null}

                  {activeBusinessPanelSection === "inbox" ? (
                    <section className="business-panel-section">
                      <div className="profile-socials">
                        <strong>{t({ es: "Alertas del negocio", en: "Business alerts", eu: "Negozioaren alertak" })}</strong>
                        <p className="section-copy">
                          {t({ es: "Este bloque recoge senales accionables del negocio para que no se te escape nada importante durante la demo o la gestion diaria.", en: "This block gathers actionable business signals so nothing important slips through during the demo or daily operations.", eu: "Bloke honek ekintzarako balio duten negozio-seinaleak biltzen ditu, demoa edo eguneroko kudeaketa egitean ezer garrantzitsurik ez galtzeko." })}
                        </p>
                        {businessAlerts.length === 0 ? (
                          <p className="detail-note">
                            {t({ es: "Ahora mismo no hay alertas abiertas. Cuando entren reservas pendientes, solicitudes o resenas sin responder apareceran aqui.", en: "There are no open alerts right now. Pending bookings, requests or unanswered reviews will appear here.", eu: "Une honetan ez dago alertarik irekita. Zain dauden erreserbak, eskaerak edo erantzun gabeko iritziak hemen agertuko dira." })}
                          </p>
                        ) : (
                          <>
                            <div className="reservation-filter-bar">
                              {businessInboxFilterOptions.map((filter) => (
                                <button
                                  key={filter.id}
                                  type="button"
                                  className={
                                    activeInboxFilter === filter.id
                                      ? "reservation-filter-button is-active"
                                      : "reservation-filter-button"
                                  }
                                  onClick={() => setActiveInboxFilter(filter.id)}
                                >
                                  {filter.label} · {filter.count}
                                </button>
                              ))}
                            </div>
                            <div className="profile-checklist">
                              {filteredBusinessAlerts.map((alert, index) => (
                                (() => {
                                  const action = getBusinessAlertAction(alert, businessRecordId);

                                  return (
                                    <div
                                      key={`${alert.type}-${alert.meta}-${index}`}
                                      className={
                                        alert.priority === "high"
                                          ? "profile-checklist-item is-complete business-alert-item business-alert-item-high"
                                          : "profile-checklist-item is-complete business-alert-item"
                                      }
                                    >
                                      <span>
                                        {alert.type.replaceAll("_", " ")} ·{" "}
                                        {alert.priority === "high"
                                          ? t({ es: "prioridad alta", en: "high priority", eu: "lehentasun handia" })
                                          : t({ es: "seguimiento", en: "follow-up", eu: "jarraipena" })}
                                      </span>
                                      <strong>{alert.title}</strong>
                                      <p>{alert.description}</p>
                                      <small>
                                        {alert.bucket === "today" ? `${t({ es: "Hoy", en: "Today", eu: "Gaur" })} · ` : ""}
                                        {new Date(alert.meta).toLocaleString(language === "en" ? "en-GB" : language === "eu" ? "eu-ES" : "es-ES")}
                                      </small>
                                      {action ? (
                                        <Link className="button secondary" to={action.to}>
                                          {action.label}
                                        </Link>
                                      ) : null}
                                    </div>
                                  );
                                })()
                              ))}
                            </div>
                            {filteredBusinessAlerts.length === 0 ? (
                              <div
                                className="profile-checklist-item is-complete business-alert-item"
                              >
                                <span>{t({ es: "Filtro actual", en: "Current filter", eu: "Uneko iragazkia" })}</span>
                                <strong>{t({ es: "No hay alertas en esta vista", en: "No alerts in this view", eu: "Ez dago alertarik ikuspegi honetan" })}</strong>
                                <p>
                                  {t({ es: "Cambia el filtro para revisar otras alertas operativas del negocio.", en: "Change the filter to review other operational alerts.", eu: "Aldatu iragazkia beste abisu operatibo batzuk ikusteko." })}
                                </p>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </section>
                  ) : null}

                  {activeBusinessPanelSection === "insights" ? (
                    <section className="business-panel-section">
                      <div className="profile-socials">
                        <strong>{t({ es: "Resumen operativo", en: "Operational summary", eu: "Laburpen operatiboa" })}</strong>
                        <div className="profile-checklist">
                          {businessInsightCards.map((card) => (
                            <div key={card.label} className="profile-checklist-item is-complete">
                              <span>{card.label}</span>
                              <strong>{card.value}</strong>
                              <p>{card.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="profile-socials">
                        <strong>{t({ es: "Actividad de los proximos 7 dias", en: "Activity over the next 7 days", eu: "Hurrengo 7 egunetako jarduera" })}</strong>
                        <p className="section-copy">
                          {t({ es: "Esta vista resume la carga prevista combinando reservas, espera activa y solicitudes abiertas para que veas de un vistazo como viene la semana.", en: "This view summarises the expected load by combining bookings, active waitlist and open requests so you can read the week at a glance.", eu: "Ikuspegi honek espero den karga laburbiltzen du erreserbak, itxaron-zerrenda aktiboa eta eskaera irekiak uztartuta, astea kolpe batean ikusteko." })}
                        </p>
                        <div className="business-timeline">
                          {businessTimeline.map((day) => (
                            <article key={day.day} className="business-timeline-day">
                              <div className="business-timeline-bar">
                                <div
                                  className="business-timeline-fill"
                                  style={{ height: day.barHeight }}
                                />
                              </div>
                              <strong>{day.total}</strong>
                              <span>{day.label}</span>
                              <small>
                                {t(
                                  {
                                    es: "{{reservations}} reservas · {{waitlist}} espera · {{requests}} solicitudes",
                                    en: "{{reservations}} bookings · {{waitlist}} waitlist · {{requests}} requests",
                                    eu: "{{reservations}} erreserba · {{waitlist}} itxaron-zerrenda · {{requests}} eskaera"
                                  },
                                  day
                                )}
                              </small>
                            </article>
                          ))}
                        </div>
                      </div>

                      <div className="profile-socials">
                        <strong>{t({ es: "Salud operativa", en: "Operational health", eu: "Osasun operatiboa" })}</strong>
                        <div className="business-performance-grid">
                          {businessPerformanceCards.map((card) => (
                            <div key={card.label} className="profile-checklist-item is-complete">
                              <span>{card.label}</span>
                              <strong>{card.value}</strong>
                              <p>{card.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="profile-socials">
                        <strong>{t({ es: "Checklist de publicacion", en: "Publishing checklist", eu: "Argitalpen checklista" })}</strong>
                        <div className="profile-checklist">
                          {businessChecklist.map((item) => (
                            <div
                              key={item.label}
                              className={
                                item.isComplete
                                  ? "profile-checklist-item is-complete"
                                  : "profile-checklist-item"
                              }
                            >
                              <span>{item.isComplete ? t({ es: "Listo", en: "Ready", eu: "Prest" }) : t({ es: "Pendiente", en: "Pending", eu: "Zain" })}</span>
                              <strong>{item.label}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null}

                  {businessSuccessMessage ? (
                    <p className="status-message success">{businessSuccessMessage}</p>
                  ) : null}
                  {businessErrorMessage ? (
                    <p className="status-message error">{businessErrorMessage}</p>
                  ) : null}

                      <div className="business-workspace-footer">
                        <p className="detail-note">
                          {t({ es: "Si la ficha esta incompleta, la cuenta seguira existiendo, pero el negocio no se vera tan solido dentro del catalogo ni en la demo.", en: "If the profile is incomplete, the account will still exist, but the business will not look as strong inside the catalogue or the demo.", eu: "Fitxa osatu gabe badago, kontuak existitzen jarraituko du, baina negozioa ez da hain sendo ikusiko katalogoan edo demoa egiteko garaian." })}
                        </p>
                        <button type="submit" disabled={isLoadingBusinessData}>
                          {isLoadingBusinessData
                            ? t({ es: "Guardando...", en: "Saving...", eu: "Gordetzen..." })
                            : t({ es: "Guardar ficha del negocio", en: "Save business profile", eu: "Gorde negozioaren fitxa" })}
                        </button>
                      </div>
                </div>
              </form>
            </article>
          ) : null}
        </div>

        <aside className="card profile-preview">
          <p className="eyebrow">{t({ es: "Vista previa", en: "Preview", eu: "Aurrebista" })}</p>
          <div className="profile-preview-header">
            {formData.avatarUrl ? (
              <img
                className="profile-avatar"
                src={formData.avatarUrl}
                alt={`Foto de perfil de ${formData.name || auth.user.name}`}
              />
            ) : (
              <span className="profile-avatar profile-avatar-fallback">
                {getBusinessInitials(formData.name || auth.user.name)}
              </span>
            )}
            <div>
              <h3>{formData.name || auth.user.name}</h3>
              <p>{formData.city || "Donostia-San Sebastian"}</p>
            </div>
          </div>

          <p className="profile-bio">
            {formData.bio || t({ es: "Todavia no has escrito una presentacion para tu perfil.", en: "You have not written an intro for your profile yet.", eu: "Oraindik ez duzu zure profilerako aurkezpenik idatzi." })}
          </p>

          <div className="profile-socials">
            <strong>{t({ es: "Enlaces visibles", en: "Visible links", eu: "Ikusgai dauden estekak" })}</strong>
            {socialLinks.length === 0 ? (
              <p className="section-copy">
                {t({ es: "Anade una URL para que tu perfil muestre redes o una publicacion destacada.", en: "Add a URL so your profile can show social links or a featured post.", eu: "Gehitu URL bat zure profilak sareak edo nabarmendutako argitalpen bat erakutsi dezan." })}
              </p>
            ) : (
              <div className="profile-link-list">
                {socialLinks.map((link) => (
                  <a key={link.label} href={link.value} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="profile-socials">
            <strong>{t({ es: "Estado del perfil", en: "Profile status", eu: "Profilaren egoera" })}</strong>
            <div className="profile-progress">
              <div className="profile-progress-bar">
                <span style={{ width: `${profileSummary.percent}%` }} />
              </div>
              <p className="section-copy">
                {t(
                  {
                    es: "Perfil completado al {{percent}}%. Cuanto mas completo este, mejor se vera en la demostracion del proyecto.",
                    en: "Profile completed to {{percent}}%. The more complete it is, the stronger it will look in the project demo.",
                    eu: "Profila %{{percent}} osatuta dago. Zenbat eta osatuago egon, orduan eta hobeto ikusiko da proiektuaren demoa egiteko."
                  },
                  { percent: profileSummary.percent }
                )}
              </p>
            </div>
            <div className="profile-checklist">
              {profileChecklist.map((item) => (
                <div
                  key={item.label}
                  className={
                    item.isComplete
                      ? "profile-checklist-item is-complete"
                      : "profile-checklist-item"
                  }
                >
                  <span>{item.isComplete ? t({ es: "Listo", en: "Ready", eu: "Prest" }) : t({ es: "Pendiente", en: "Pending", eu: "Zain" })}</span>
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          </div>

          {auth.user.role === "business" ? (
            <div className="profile-socials">
              <strong>{t({ es: "Estado del negocio", en: "Business status", eu: "Negozioaren egoera" })}</strong>
              <div className="profile-progress">
                <div className="profile-progress-bar">
                  <span style={{ width: `${businessSummary?.percent ?? 0}%` }} />
                </div>
                <p className="section-copy">
                  {businessSummary?.percent === 100
                    ? t({ es: "La ficha tiene datos suficientes para formar parte del catalogo.", en: "The profile already has enough data to be part of the catalogue.", eu: "Fitxak jada nahikoa datu ditu katalogoan egoteko." })
                    : t({ es: "Todavia falta completar la ficha comercial para que el negocio quede bien presentado.", en: "The commercial profile still needs more work so the business feels properly presented.", eu: "Oraindik profil komertziala osatu behar da negozioa ondo aurkezteko." })}
                </p>
              </div>
              <div className="profile-checklist">
                {businessChecklist.map((item) => (
                  <div
                    key={item.label}
                    className={
                      item.isComplete
                        ? "profile-checklist-item is-complete"
                        : "profile-checklist-item"
                    }
                  >
                    <span>{item.isComplete ? t({ es: "Listo", en: "Ready", eu: "Prest" }) : t({ es: "Pendiente", en: "Pending", eu: "Zain" })}</span>
                    <strong>{item.label}</strong>
                  </div>
                ))}
              </div>
              <div className="profile-checklist">
                {serviceModeOptions.map((option) => (
                  <div
                    key={option.value}
                    className={
                      businessFormData.serviceMode === option.value
                        ? "profile-checklist-item is-complete"
                        : "profile-checklist-item"
                    }
                  >
                    <span>{businessFormData.serviceMode === option.value ? t({ es: "Activo", en: "Active", eu: "Aktibo" }) : t({ es: "Disponible", en: "Available", eu: "Erabilgarri" })}</span>
                    <strong>{option.label}</strong>
                    <p>{option.summary}</p>
                  </div>
                ))}
              </div>
              <div className="profile-socials">
                <strong>{t({ es: "Modo de servicio activo", en: "Active service mode", eu: "Zerbitzu modu aktiboa" })}</strong>
                <div className="profile-checklist">
                  {serviceModeOptions.map((option) => (
                    <div
                      key={option.value}
                      className={
                        businessFormData.serviceMode === option.value
                          ? "profile-checklist-item is-complete"
                          : "profile-checklist-item"
                      }
                    >
                      <span>{businessFormData.serviceMode === option.value ? t({ es: "Activo", en: "Active", eu: "Aktibo" }) : t({ es: "Disponible", en: "Available", eu: "Erabilgarri" })}</span>
                      <strong>{option.label}</strong>
                      <p>{option.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="profile-socials">
                <strong>{t({ es: "Servicios preparados", en: "Prepared services", eu: "Prest dauden zerbitzuak" })}</strong>
                <div className="profile-checklist">
                  {preparedBusinessServices.map((service, index) => (
                      <div key={`${service.title}-${index}`} className="profile-checklist-item is-complete">
                        <span>
                          {getRequestServiceKindConfig(service.kind, language).badge}
                          {service.priceLabel ? ` · ${service.priceLabel}` : ""}
                        </span>
                        <strong>{service.title || t({ es: "Servicio {{count}}", en: "Service {{count}}", eu: "{{count}}. zerbitzua" }, { count: index + 1 })}</strong>
                        <p>{service.description || t({ es: "Anade una descripcion para que se vea mejor en la ficha.", en: "Add a description so it reads better on the public profile.", eu: "Gehitu deskribapen bat fitxa publikoan hobeto ikusteko." })}</p>
                      </div>
                    ))}
                </div>
              </div>
              {businessFormData.heroBadge || businessFormData.heroClaim || businessFormData.heroHighlight ? (
                <div className="profile-socials">
                  <strong>{t({ es: "Branding del portal", en: "Portal branding", eu: "Atariaren branding-a" })}</strong>
                  <div className="profile-checklist">
                    {businessFormData.heroBadge ? (
                      <div className="profile-checklist-item is-complete">
                        <span>{t({ es: "Etiqueta", en: "Label", eu: "Etiketa" })}</span>
                        <strong>{businessFormData.heroBadge}</strong>
                        <p>{t({ es: "Etiqueta editorial visible en la cabecera publica.", en: "Editorial label visible in the public header.", eu: "Goiburu publikoan ikusgai dagoen etiketa editoriala." })}</p>
                      </div>
                    ) : null}
                    {businessFormData.heroClaim ? (
                      <div className="profile-checklist-item is-complete">
                        <span>{t({ es: "Frase clave", en: "Key line", eu: "Esaldi nagusia" })}</span>
                        <strong>{businessFormData.heroClaim}</strong>
                        <p>{t({ es: "Frase corta que define el tono del negocio en la ficha.", en: "Short sentence that defines the tone of the business on the profile.", eu: "Fitxan negozioaren tonua definitzen duen esaldi laburra." })}</p>
                      </div>
                    ) : null}
                    {businessFormData.heroHighlight ? (
                      <div className="profile-checklist-item is-complete">
                        <span>{t({ es: "Mensaje destacado", en: "Highlighted message", eu: "Mezu nabarmendua" })}</span>
                        <strong>{t({ es: "Bloque hero", en: "Hero block", eu: "Hero blokea" })}</strong>
                        <p>{businessFormData.heroHighlight}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className="profile-socials">
                <strong>{t({ es: "Agenda visible", en: "Visible schedule", eu: "Ikusgai dagoen agenda" })}</strong>
                {openBusinessScheduleRules.length === 0 ? (
                  <p className="section-copy">
                    {t({ es: "Aun no hay dias abiertos en la agenda del negocio.", en: "There are still no open days in the business schedule.", eu: "Oraindik ez dago egun irekirik negozioaren agendan." })}
                  </p>
                ) : (
                  <div className="profile-checklist">
                    {openBusinessScheduleRules.map((rule) => (
                      <div
                        key={rule.dayOfWeek}
                        className="profile-checklist-item is-complete"
                      >
                        <span>{rule.label}</span>
                        <strong>
                          {rule.openTime} · {rule.closeTime}
                        </strong>
                        <p>{t({ es: "Franja nueva cada {{count}} minutos.", en: "New slot every {{count}} minutes.", eu: "Txanda berria {{count}} minuturo." }, { count: rule.slotIntervalMinutes })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {preparedBusinessScheduleExceptions.length > 0 ? (
                <div className="profile-socials">
                  <strong>{t({ es: "Fechas especiales", en: "Special dates", eu: "Data bereziak" })}</strong>
                  <div className="profile-checklist">
                    {preparedBusinessScheduleExceptions.map((exception, index) => (
                      <div
                        key={`${exception.exceptionDate}-${index}`}
                        className="profile-checklist-item is-complete"
                      >
                        <span>{exception.exceptionDate}</span>
                        <strong>
                          {exception.isClosed
                            ? t({ es: "Cierre puntual", en: "Temporary closure", eu: "Aldi baterako itxiera" })
                            : `${exception.openTime} · ${exception.closeTime}`}
                        </strong>
                        <p>
                          {exception.note ||
                            (exception.isClosed
                              ? t({ es: "No habra agenda publica este dia.", en: "There will be no public schedule on this day.", eu: "Egun honetan ez da agenda publikorik egongo." })
                              : t({ es: "Franja nueva cada {{count}} minutos.", en: "New slot every {{count}} minutes.", eu: "Txanda berria {{count}} minuturo." }, { count: exception.slotIntervalMinutes }))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {businessFormData.visitNote || businessFormData.cancellationPolicy ? (
                <div className="profile-socials">
                  <strong>{t({ es: "Notas visibles en la ficha", en: "Visible notes on the profile", eu: "Fitxan ikusgai dauden oharrak" })}</strong>
                  <div className="profile-checklist">
                    {businessFormData.visitNote ? (
                      <div className="profile-checklist-item is-complete">
                        <span>{t({ es: "Antes de venir", en: "Before you come", eu: "Etorri aurretik" })}</span>
                        <strong>{t({ es: "Nota de visita", en: "Visit note", eu: "Bisita-oharra" })}</strong>
                        <p>{businessFormData.visitNote}</p>
                      </div>
                    ) : null}
                    {businessFormData.cancellationPolicy ? (
                      <div className="profile-checklist-item is-complete">
                        <span>{t({ es: "Condiciones", en: "Conditions", eu: "Baldintzak" })}</span>
                        <strong>{t({ es: "Politica de cancelacion", en: "Cancellation policy", eu: "Ezeztapen politika" })}</strong>
                        <p>{businessFormData.cancellationPolicy}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {preparedBusinessFaqs.length > 0 ? (
                <div className="profile-socials">
                  <strong>{t({ es: "FAQ publica", en: "Public FAQ", eu: "FAQ publikoa" })}</strong>
                  <div className="profile-checklist">
                    {preparedBusinessFaqs.map((faq, index) => (
                        <div key={`${faq.question}-${index}`} className="profile-checklist-item is-complete">
                          <span>{t({ es: "Pregunta {{count}}", en: "Question {{count}}", eu: "{{count}}. galdera" }, { count: index + 1 })}</span>
                          <strong>{faq.question || t({ es: "Pregunta pendiente", en: "Pending question", eu: "Galdera zain" })}</strong>
                          <p>{faq.answer || t({ es: "Respuesta pendiente", en: "Pending answer", eu: "Erantzuna zain" })}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
              {businessInsights ? (
                <div className="profile-socials">
                  <strong>{t({ es: "Senales del negocio", en: "Business signals", eu: "Negozioaren seinaleak" })}</strong>
                  <div className="profile-checklist">
                    <div className="profile-checklist-item is-complete">
                      <span>{t({ es: "Actividad futura", en: "Future activity", eu: "Etorkizuneko jarduera" })}</span>
                      <strong>{t({ es: "{{count}} reservas en agenda", en: "{{count}} bookings scheduled", eu: "{{count}} erreserba agendan" }, { count: businessInsights.reservations.upcoming })}</strong>
                      <p>
                        {t(
                          {
                            es: "{{pending}} pendientes, {{confirmed}} confirmadas y {{cancelled}} canceladas acumuladas.",
                            en: "{{pending}} pending, {{confirmed}} confirmed and {{cancelled}} cancelled in total.",
                            eu: "{{pending}} zain, {{confirmed}} baieztatuta eta {{cancelled}} ezeztatuta guztira."
                          },
                          {
                            pending: businessInsights.reservations.pending,
                            confirmed: businessInsights.reservations.confirmed,
                            cancelled: businessInsights.reservations.cancelled
                          }
                        )}
                      </p>
                    </div>
                    <div className="profile-checklist-item is-complete">
                      <span>{t({ es: "Demanda latente", en: "Latent demand", eu: "Eskari latentea" })}</span>
                      <strong>
                        {t({ es: "{{count}} interacciones pendientes", en: "{{count}} pending interactions", eu: "{{count}} elkarreragin zain" }, { count: businessInsights.waitlist.active + businessInsights.requests.pending })}
                      </strong>
                      <p>
                        {t(
                          {
                            es: "{{waitlist}} personas en lista de espera y {{requests}} solicitudes manuales por revisar.",
                            en: "{{waitlist}} people on the waitlist and {{requests}} manual requests to review.",
                            eu: "{{waitlist}} pertsona itxaron-zerrendan eta {{requests}} eskaera manual berrikusteko."
                          },
                          {
                            waitlist: businessInsights.waitlist.active,
                            requests: businessInsights.requests.pending
                          }
                        )}
                      </p>
                    </div>
                    <div className="profile-checklist-item is-complete">
                      <span>{t({ es: "Servicio destacado", en: "Leading service", eu: "Zerbitzu nagusia" })}</span>
                      <strong>{businessInsights.topService?.title || t({ es: "Todavia sin lider claro", en: "No clear leader yet", eu: "Oraindik ez dago lider argirik" })}</strong>
                      <p>
                        {businessInsights.topService
                          ? t({ es: "{{count}} interacciones acumuladas entre reservas, esperas y solicitudes.", en: "{{count}} accumulated interactions across bookings, waitlist and requests.", eu: "{{count}} elkarreragin metatu erreserben, itxaron-zerrenden eta eskaeren artean." }, { count: businessInsights.topService.totalDemand })
                          : t({ es: "A medida que entren reservas y solicitudes, aqui veras que servicio genera mas traccion.", en: "As bookings and requests arrive, this is where you will see which service creates the most traction.", eu: "Erreserbak eta eskaerak sartzen diren heinean, hemen ikusiko duzu zein zerbitzuk sortzen duen trakzio handiena." })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="detail-note">
            {t({ es: "La integracion automatica con redes sociales queda planteada como mejora futura. En esta version se muestran enlaces manuales.", en: "Automatic social integration remains a future improvement. In this version, links are shown manually.", eu: "Sare sozialekin integrazio automatikoa etorkizuneko hobekuntza gisa geratzen da. Bertsio honetan estekak eskuz erakusten dira." })}
          </p>
        </aside>
      </div>
    </section>
  );
}
