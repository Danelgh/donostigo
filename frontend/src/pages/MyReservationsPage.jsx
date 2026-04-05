import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatLocaleDateTime, pick, useI18n } from "../i18n/I18nProvider.jsx";
import {
  fetchBusinessReservations,
  fetchBusinessServiceRequests,
  fetchBusinessWaitlistEntries,
  fetchMyBusinessServiceRequests,
  fetchMyReservations,
  fetchMyWaitlistEntries,
  respondToBusinessServiceRequest,
  updateBusinessServiceRequestStatus,
  updateBusinessServiceRequestVoucherStatus,
  updateWaitlistStatus,
  updateReservationStatus
} from "../services/api.js";
import { downloadReservationCalendarEvent } from "../utils/calendar.js";
import { downloadVoucherDocument } from "../utils/voucher.js";
import {
  formatVoucherStatus,
  getRequestServiceKindConfig,
  getVoucherStatusOptions
} from "../utils/requestServiceKind.js";

function getStatusFilters(language) {
  return [
    { value: "all", label: pick({ es: "Todas", en: "All", eu: "Guztiak" }, language) },
    { value: "pending", label: pick({ es: "Pendientes", en: "Pending", eu: "Zain" }, language) },
    { value: "confirmed", label: pick({ es: "Confirmadas", en: "Confirmed", eu: "Berretsiak" }, language) },
    { value: "cancelled", label: pick({ es: "Canceladas", en: "Cancelled", eu: "Ezeztatuak" }, language) }
  ];
}

function formatReservationStatus(status, language) {
  return pick(
    {
      pending: { es: "Pendiente", en: "Pending", eu: "Zain" },
      confirmed: { es: "Confirmada", en: "Confirmed", eu: "Berretsia" },
      cancelled: { es: "Cancelada", en: "Cancelled", eu: "Ezeztatua" }
    }[status] || { es: "Pendiente", en: "Pending", eu: "Zain" },
    language
  );
}

function formatWaitlistStatus(status, language) {
  return pick(
    {
      active: { es: "En espera", en: "Waiting", eu: "Zain" },
      converted: { es: "Convertida", en: "Converted", eu: "Bihurtua" },
      cancelled: { es: "Cancelada", en: "Cancelled", eu: "Ezeztatua" }
    }[status] || { es: "En espera", en: "Waiting", eu: "Zain" },
    language
  );
}

function formatBusinessRequestStatus(status, language) {
  return pick(
    {
      pending: { es: "Pendiente", en: "Pending", eu: "Zain" },
      approved: { es: "Aprobada", en: "Approved", eu: "Onartua" },
      rejected: { es: "Rechazada", en: "Rejected", eu: "Baztertua" },
      accepted: { es: "Aceptada", en: "Accepted", eu: "Onetsia" },
      declined: { es: "No aceptada", en: "Declined", eu: "Ez onartua" }
    }[status] || { es: "Pendiente", en: "Pending", eu: "Zain" },
    language
  );
}

function getBusinessRequestQuantityLabel(request, language) {
  return getRequestServiceKindConfig(request.serviceKind, language).quantityLabel;
}

function formatPeopleLabel(value, language) {
  return pick(
    {
      es: "{{value}} persona{{suffix}}",
      en: "{{value}} guest{{suffix}}",
      eu: "{{value}} pertsona"
    },
    language,
    {
      value,
      suffix: value === 1 ? "" : "s"
    }
  );
}

function buildReservationStats(reservations) {
  return reservations.reduce(
    (summary, reservation) => {
      summary.total += 1;
      summary[reservation.status] += 1;
      return summary;
    },
    {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0
    }
  );
}

function getNextReservation(reservations) {
  return reservations
    .filter((reservation) => {
      if (reservation.status === "cancelled") {
        return false;
      }

      return new Date(reservation.reservation_date).getTime() >= Date.now();
    })
    .sort(
      (leftReservation, rightReservation) =>
        new Date(leftReservation.reservation_date) - new Date(rightReservation.reservation_date)
    )[0];
}

function canDownloadReservationCalendar(reservation) {
  if (reservation.status === "cancelled") {
    return false;
  }

  return new Date(reservation.reservation_date).getTime() > Date.now();
}

function sortReservationsByDate(reservations) {
  return [...reservations].sort(
    (leftReservation, rightReservation) =>
      new Date(leftReservation.reservation_date) - new Date(rightReservation.reservation_date)
  );
}

function ReservationFilters({ language, selectedStatus, onChange }) {
  const statusFilters = getStatusFilters(language);

  return (
    <div
      className="reservation-filter-bar"
      role="tablist"
      aria-label={pick({ es: "Filtrar reservas", en: "Filter reservations", eu: "Iragazi erreserbak" }, language)}
    >
      {statusFilters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className={
            selectedStatus === filter.value
              ? "reservation-filter-button is-active"
              : "reservation-filter-button"
          }
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export default function MyReservationsPage({ auth, isHydratingAuth }) {
  const { language } = useI18n();
  const t = (copy, variables) => pick(copy, language, variables);
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [businessSummary, setBusinessSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(auth));
  const [isUpdatingReservationId, setIsUpdatingReservationId] = useState(null);
  const [isUpdatingWaitlistId, setIsUpdatingWaitlistId] = useState(null);
  const [isUpdatingServiceRequestId, setIsUpdatingServiceRequestId] = useState(null);
  const [businessRequestDrafts, setBusinessRequestDrafts] = useState({});
  const [businessRequestProposedDates, setBusinessRequestProposedDates] = useState({});
  const [businessRequestQuotedPrices, setBusinessRequestQuotedPrices] = useState({});
  const [businessRequestFulfillmentNotes, setBusinessRequestFulfillmentNotes] = useState({});
  const [businessRequestVoucherCodes, setBusinessRequestVoucherCodes] = useState({});
  const [businessRequestVoucherStatuses, setBusinessRequestVoucherStatuses] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const voucherStatusOptions = useMemo(() => getVoucherStatusOptions(language), [language]);

  useEffect(() => {
    if (!auth) {
      setReservations([]);
      setWaitlistEntries([]);
      setServiceRequests([]);
      setBusinessSummary(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const request =
      auth.user.role === "business"
        ? Promise.all([
            fetchBusinessReservations(),
            fetchBusinessWaitlistEntries(),
            fetchBusinessServiceRequests()
          ])
        : Promise.all([
            fetchMyReservations(),
            fetchMyWaitlistEntries(),
            fetchMyBusinessServiceRequests()
          ]);

    request
      .then((data) => {
        if (auth.user.role === "business") {
          const [reservationData, waitlistData, serviceRequestData] = data;
          setBusinessSummary(reservationData.business);
          setReservations(reservationData.reservations);
          setWaitlistEntries(waitlistData.entries);
          setServiceRequests(serviceRequestData.requests);
          return;
        }

        const [reservationData, waitlistData, serviceRequestData] = data;
        setBusinessSummary(null);
        setReservations(reservationData);
        setWaitlistEntries(waitlistData);
        setServiceRequests(serviceRequestData);
      })
      .catch((error) => {
        setReservations([]);
        setWaitlistEntries([]);
        setServiceRequests([]);
        setBusinessSummary(null);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [auth]);

  useEffect(() => {
    setSelectedStatus("all");
  }, [auth?.user.role]);

  useEffect(() => {
    const focus = searchParams.get("focus");

    if (focus === "reservations-pending") {
      setSelectedStatus("pending");
      return;
    }

    setSelectedStatus("all");
  }, [searchParams]);

  useEffect(() => {
    const focus = searchParams.get("focus");

    if (!focus || isLoading) {
      return;
    }

    const targetIdMap = {
      reservations: "activity-reservations",
      "reservations-pending": "activity-reservations",
      waitlist: "activity-waitlist",
      requests: "activity-requests"
    };
    const targetId = targetIdMap[focus];

    if (!targetId) {
      return;
    }

    const scrollToSection = () => {
      const section = document.getElementById(targetId);

      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    window.setTimeout(scrollToSection, 80);
  }, [isLoading, searchParams, auth?.user.role]);

  useEffect(() => {
    if (auth?.user.role !== "business" || serviceRequests.length === 0) {
      return;
    }

    setBusinessRequestDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      serviceRequests.forEach((request) => {
        if (nextDrafts[request.id] === undefined) {
          nextDrafts[request.id] = request.businessReply || "";
        }
      });

      return nextDrafts;
    });

    setBusinessRequestProposedDates((currentDates) => {
      const nextDates = { ...currentDates };

      serviceRequests.forEach((request) => {
        if (nextDates[request.id] === undefined) {
          nextDates[request.id] = request.proposedDate
            ? new Date(request.proposedDate).toISOString().slice(0, 10)
            : "";
        }
      });

      return nextDates;
    });

    setBusinessRequestQuotedPrices((currentPrices) => {
      const nextPrices = { ...currentPrices };

      serviceRequests.forEach((request) => {
        if (nextPrices[request.id] === undefined) {
          nextPrices[request.id] = request.quotedPriceLabel || "";
        }
      });

      return nextPrices;
    });

    setBusinessRequestFulfillmentNotes((currentNotes) => {
      const nextNotes = { ...currentNotes };

      serviceRequests.forEach((request) => {
        if (nextNotes[request.id] === undefined) {
          nextNotes[request.id] = request.fulfillmentNote || "";
        }
      });

      return nextNotes;
    });

    setBusinessRequestVoucherCodes((currentCodes) => {
      const nextCodes = { ...currentCodes };

      serviceRequests.forEach((request) => {
        if (nextCodes[request.id] === undefined) {
          nextCodes[request.id] = request.voucherCode || "";
        }
      });

      return nextCodes;
    });

    setBusinessRequestVoucherStatuses((currentStatuses) => {
      const nextStatuses = { ...currentStatuses };

      serviceRequests.forEach((request) => {
        if (nextStatuses[request.id] === undefined) {
          nextStatuses[request.id] = request.voucherStatus || "draft";
        }
      });

      return nextStatuses;
    });
  }, [auth?.user.role, serviceRequests]);

  const reservationStats = useMemo(() => buildReservationStats(reservations), [reservations]);
  const filteredReservations = useMemo(() => {
    if (selectedStatus === "all") {
      return reservations;
    }

    return reservations.filter((reservation) => reservation.status === selectedStatus);
  }, [reservations, selectedStatus]);
  const nextReservation = useMemo(() => getNextReservation(reservations), [reservations]);

  async function handleStatusUpdate(reservationId, status) {
    setIsUpdatingReservationId(reservationId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await updateReservationStatus(reservationId, { status });
      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation.id === reservationId ? response.reservation : reservation
        )
      );
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUpdatingReservationId(null);
    }
  }

  async function handleWaitlistStatusUpdate(waitlistId, status) {
    setIsUpdatingWaitlistId(waitlistId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await updateWaitlistStatus(waitlistId, { status });

      if (auth.user.role === "business") {
        if (response.reservation) {
          setReservations((currentReservations) =>
            sortReservationsByDate([...currentReservations, response.reservation])
          );
        }
        setWaitlistEntries((currentEntries) =>
          currentEntries.filter((entry) => entry.id !== waitlistId)
        );
      } else {
        setWaitlistEntries((currentEntries) =>
          currentEntries.map((entry) =>
            entry.id === waitlistId ? { ...entry, status: response.entry.status } : entry
          )
        );
      }

      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUpdatingWaitlistId(null);
    }
  }

  async function handleServiceRequestStatusUpdate(requestId, status) {
    setIsUpdatingServiceRequestId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await updateBusinessServiceRequestStatus(requestId, {
        status,
        response: businessRequestDrafts[requestId] || "",
        proposedDate: businessRequestProposedDates[requestId] || null,
        quotedPriceLabel: businessRequestQuotedPrices[requestId] || "",
        fulfillmentNote: businessRequestFulfillmentNotes[requestId] || "",
        voucherCode: businessRequestVoucherCodes[requestId] || "",
        voucherStatus: businessRequestVoucherStatuses[requestId] || ""
      });
      setServiceRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: response.request.status,
                businessReply: response.request.businessReply || "",
                businessReplyUpdatedAt: response.request.businessReplyUpdatedAt || null,
                proposedDate: response.request.proposedDate || null,
                quotedPriceLabel: response.request.quotedPriceLabel || "",
                fulfillmentNote: response.request.fulfillmentNote || "",
                voucherCode: response.request.voucherCode || "",
                voucherStatus: response.request.voucherStatus || null
              }
            : request
        )
      );
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUpdatingServiceRequestId(null);
    }
  }

  async function handleCustomerServiceRequestResponse(requestId, status) {
    setIsUpdatingServiceRequestId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await respondToBusinessServiceRequest(requestId, { status });
      setServiceRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId ? { ...request, status: response.request.status } : request
        )
      );
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUpdatingServiceRequestId(null);
    }
  }

  async function handleVoucherStatusUpdate(requestId, voucherStatus) {
    setIsUpdatingServiceRequestId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await updateBusinessServiceRequestVoucherStatus(requestId, { voucherStatus });
      setServiceRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                voucherStatus: response.request.voucherStatus || null
              }
            : request
        )
      );
      setBusinessRequestVoucherStatuses((currentStatuses) => ({
        ...currentStatuses,
        [requestId]: response.request.voucherStatus || ""
      }));
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUpdatingServiceRequestId(null);
    }
  }

  function handleDownloadCalendar(reservation) {
    try {
      downloadReservationCalendarEvent(reservation);
      setSuccessMessage(
        t({
          es: "Evento de calendario descargado correctamente.",
          en: "Calendar event downloaded successfully.",
          eu: "Egutegiko gertaera behar bezala deskargatu da."
        })
      );
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
      setSuccessMessage("");
    }
  }

  function handleDownloadVoucher(request) {
    try {
      downloadVoucherDocument(request);
      setSuccessMessage(
        t({
          es: "Bono descargado correctamente.",
          en: "Voucher downloaded successfully.",
          eu: "Bonua behar bezala deskargatu da."
        })
      );
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
      setSuccessMessage("");
    }
  }

  if (isHydratingAuth) {
    return <p>{t({ es: "Verificando sesion...", en: "Checking session...", eu: "Saioa egiaztatzen..." })}</p>;
  }

  if (!auth) {
    return (
      <section className="card auth-card">
        <h2>{t({ es: "Mi actividad", en: "My activity", eu: "Nire jarduera" })}</h2>
        <p className="auth-copy">
          {t({
            es: "Debes iniciar sesion para consultar tus reservas, solicitudes y lista de espera.",
            en: "You need to sign in to review your bookings, requests and waitlist.",
            eu: "Saioa hasi behar duzu zure erreserbak, eskaerak eta itxaron-zerrenda ikusteko."
          })}
        </p>
        <Link className="button" to="/login">
          {t({ es: "Ir a login", en: "Go to login", eu: "Joan saioa hastera" })}
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return <p>{t({ es: "Cargando actividad...", en: "Loading activity...", eu: "Jarduera kargatzen..." })}</p>;
  }

  if (auth.user.role === "business") {
    return (
      <section className="reservation-page">
        <header className="card reservation-hero">
          <div>
            <p className="eyebrow">{t({ es: "Panel de negocio", en: "Business panel", eu: "Negozio panela" })}</p>
            <h2>{t({ es: "Actividad del negocio", en: "Business activity", eu: "Negozioaren jarduera" })}</h2>
            <p className="section-copy">
              {t({
                es: "Gestiona reservas, lista de espera y solicitudes manuales asociadas a tu establecimiento.",
                en: "Manage bookings, waitlist demand and manual requests linked to your business.",
                eu: "Kudeatu zure negozioari lotutako erreserbak, itxaron-zerrenda eta eskaera manualak."
              })}
            </p>
          </div>
          <div className="reservation-overview">
            <div>
              <strong>{reservations.length}</strong>
              <span>{t({ es: "solicitudes registradas", en: "tracked bookings", eu: "erregistratutako eskaerak" })}</span>
            </div>
            <div>
              <strong>{waitlistEntries.length}</strong>
              <span>{t({ es: "interesados en espera", en: "waiting leads", eu: "zain dauden interesdunak" })}</span>
            </div>
            <div>
              <strong>{serviceRequests.length}</strong>
              <span>{t({ es: "solicitudes manuales", en: "manual requests", eu: "eskaera manualak" })}</span>
            </div>
            <div>
              <strong>{businessSummary?.name || auth.user.name}</strong>
              <span>{t({ es: "negocio activo", en: "active business", eu: "negozio aktiboa" })}</span>
            </div>
          </div>
        </header>

        <section className="reservation-dashboard">
          <article className="card reservation-stat-card">
            <span>{t({ es: "Total", en: "Total", eu: "Guztira" })}</span>
            <strong>{reservationStats.total}</strong>
            <p>{t({ es: "Solicitudes registradas para tu negocio.", en: "Tracked requests for your business.", eu: "Zure negoziorako erregistratutako eskaerak." })}</p>
          </article>
          <article className="card reservation-stat-card reservation-stat-card-pending">
            <span>{t({ es: "Pendientes", en: "Pending", eu: "Zain" })}</span>
            <strong>{reservationStats.pending}</strong>
            <p>{t({ es: "Reservas que todavia necesitan una respuesta.", en: "Bookings that still need an answer.", eu: "Oraindik erantzuna behar duten erreserbak." })}</p>
          </article>
          <article className="card reservation-stat-card reservation-stat-card-confirmed">
            <span>{t({ es: "Confirmadas", en: "Confirmed", eu: "Berretsiak" })}</span>
            <strong>{reservationStats.confirmed}</strong>
            <p>{t({ es: "Solicitudes ya aceptadas y visibles para el cliente.", en: "Requests already accepted and visible to the client.", eu: "Bezeroarentzat onartu eta ikusgai dauden eskaerak." })}</p>
          </article>
          <article className="card reservation-stat-card reservation-stat-card-cancelled">
            <span>{t({ es: "Canceladas", en: "Cancelled", eu: "Ezeztatuak" })}</span>
            <strong>{reservationStats.cancelled}</strong>
            <p>{t({ es: "Reservas descartadas o anuladas por el negocio.", en: "Bookings discarded or cancelled by the business.", eu: "Negozioak baztertu edo ezeztatutako erreserbak." })}</p>
          </article>
        </section>

        <section className="card" id="activity-reservations">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t({ es: "Seguimiento", en: "Tracking", eu: "Jarraipena" })}</p>
              <h3>{t({ es: "Listado de reservas", en: "Booking list", eu: "Erreserben zerrenda" })}</h3>
            </div>
            <p className="section-copy">
              {t({ es: "Filtra por estado para centrarte en las reservas pendientes o revisar el historial completo.", en: "Filter by status to focus on pending bookings or review the full history.", eu: "Iragazi egoeraren arabera zain dauden erreserbetan zentratzeko edo historia osoa berrikusteko." })}
            </p>
          </div>

          <ReservationFilters
            language={language}
            selectedStatus={selectedStatus}
            onChange={setSelectedStatus}
          />

          {successMessage ? <p className="status-message success">{successMessage}</p> : null}
          {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

          {reservations.length === 0 ? (
            <div className="reservation-empty">
              <h3>{t({ es: "Aun no has recibido reservas", en: "You have not received bookings yet", eu: "Oraindik ez duzu erreserbarik jaso" })}</h3>
              <p>
                {t({ es: "Tu ficha de negocio ya esta lista, pero todavia no hay solicitudes asociadas. Revisa tu perfil y asegurate de que la informacion publica este completa.", en: "Your business profile is ready, but there are no requests linked to it yet. Review your profile and make sure the public information is complete.", eu: "Zure negozioaren fitxa prest dago, baina oraindik ez dago harekin lotutako eskaerarik. Berrikusi profila eta ziurtatu informazio publikoa osatuta dagoela." })}
              </p>
              <Link className="button secondary" to="/profile">
                {t({ es: "Revisar mi ficha", en: "Review my profile", eu: "Berrikusi nire fitxa" })}
              </Link>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="reservation-empty">
              <h3>{t({ es: "No hay reservas con este filtro", en: "No bookings match this filter", eu: "Ez dago erreserbarik iragazki honekin" })}</h3>
              <p>{t({ es: "Cambia de estado para revisar el resto de solicitudes registradas.", en: "Change the status to review the rest of the registered requests.", eu: "Aldatu egoera erregistratutako gainerako eskaerak berrikusteko." })}</p>
            </div>
          ) : (
            <div className="reservation-stack">
              {filteredReservations.map((reservation) => (
                <article className="reservation-item" key={reservation.id}>
                  <div>
                    <p className="eyebrow">{t({ es: "Reserva", en: "Booking", eu: "Erreserba" })} #{reservation.id}</p>
                    <h3>{reservation.customer_name}</h3>
                  </div>
                  <p>
                    <strong>{t({ es: "Email", en: "Email", eu: "Posta elektronikoa" })}:</strong> {reservation.customer_email}
                  </p>
                  <p>
                    <strong>{t({ es: "Fecha", en: "Date", eu: "Data" })}:</strong>{" "}
                    {formatLocaleDateTime(reservation.reservation_date, language)}
                  </p>
                  <p>
                    <strong>{t({ es: "Servicio", en: "Service", eu: "Zerbitzua" })}:</strong> {reservation.service_title || t({ es: "Reserva general", en: "General booking", eu: "Erreserba orokorra" })}
                  </p>
                  <p>
                    <strong>{t({ es: "Personas", en: "Guests", eu: "Pertsonak" })}:</strong> {reservation.people}
                  </p>
                  <p>
                    <strong>{t({ es: "Estado", en: "Status", eu: "Egoera" })}:</strong> {formatReservationStatus(reservation.status, language)}
                  </p>
                  <span className={`reservation-status reservation-status-${reservation.status}`}>
                    {formatReservationStatus(reservation.status, language)}
                  </span>
                  <div className="reservation-actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleStatusUpdate(reservation.id, "confirmed")}
                      disabled={
                        isUpdatingReservationId === reservation.id ||
                        reservation.status === "confirmed"
                      }
                    >
                      {isUpdatingReservationId === reservation.id
                        ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." })
                        : t({ es: "Confirmar", en: "Confirm", eu: "Baieztatu" })}
                    </button>
                    <button
                      type="button"
                      className="button secondary button-danger"
                      onClick={() => handleStatusUpdate(reservation.id, "cancelled")}
                      disabled={
                        isUpdatingReservationId === reservation.id ||
                        reservation.status === "cancelled"
                      }
                    >
                      {isUpdatingReservationId === reservation.id ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." }) : t({ es: "Cancelar", en: "Cancel", eu: "Ezeztatu" })}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {waitlistEntries.length > 0 ? (
          <section className="card" id="activity-waitlist">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t({ es: "Demanda pendiente", en: "Pending demand", eu: "Zain dagoen eskaria" })}</p>
                <h3>{t({ es: "Lista de espera del negocio", en: "Business waitlist", eu: "Negozioaren itxaron-zerrenda" })}</h3>
              </div>
              <p className="section-copy">
                {t({ es: "Usuarios interesados en franjas ya completas. Te sirve para medir demanda y abrir nuevos huecos si quieres ampliar disponibilidad.", en: "Users interested in already full slots. It helps you measure demand and open new availability if you want to expand.", eu: "Jada beteta dauden txandetan interesa duten erabiltzaileak. Eskaria neurtzeko eta erabilgarritasuna zabaldu nahi baduzu hutsune berriak irekitzeko balio dizu." })}
              </p>
            </div>

            <div className="reservation-stack">
              {waitlistEntries.map((entry) => (
                <article className="reservation-item reservation-item-waitlist" key={entry.id}>
                  <div>
                    <p className="eyebrow">{t({ es: "Espera", en: "Waitlist", eu: "Itxaron-zerrenda" })} #{entry.id}</p>
                    <h3>{entry.customer_name}</h3>
                  </div>
                  <p>
                    <strong>{t({ es: "Email", en: "Email", eu: "Posta elektronikoa" })}:</strong> {entry.customer_email}
                  </p>
                  <p>
                    <strong>{t({ es: "Franja solicitada", en: "Requested slot", eu: "Eskatutako txanda" })}:</strong>{" "}
                    {formatLocaleDateTime(entry.desired_slot, language)}
                  </p>
                  <p>
                    <strong>{t({ es: "Servicio", en: "Service", eu: "Zerbitzua" })}:</strong> {entry.service_title || t({ es: "Interes general", en: "General interest", eu: "Interes orokorra" })}
                  </p>
                  <p>
                    <strong>{t({ es: "Personas", en: "Guests", eu: "Pertsonak" })}:</strong> {entry.people}
                  </p>
                  <span className="reservation-status reservation-status-waitlist">
                    {formatWaitlistStatus("active", language)}
                  </span>
                  <div className="reservation-actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleWaitlistStatusUpdate(entry.id, "converted")}
                      disabled={isUpdatingWaitlistId === entry.id}
                    >
                      {isUpdatingWaitlistId === entry.id
                        ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." })
                        : t({ es: "Convertir en reserva", en: "Convert to booking", eu: "Bihurtu erreserba" })}
                    </button>
                    <button
                      type="button"
                      className="button secondary button-danger"
                      onClick={() => handleWaitlistStatusUpdate(entry.id, "cancelled")}
                      disabled={isUpdatingWaitlistId === entry.id}
                    >
                      {isUpdatingWaitlistId === entry.id ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." }) : t({ es: "Descartar", en: "Dismiss", eu: "Baztertu" })}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {serviceRequests.length > 0 ? (
          <section className="card" id="activity-requests">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t({ es: "Solicitudes", en: "Requests", eu: "Eskaerak" })}</p>
                <h3>{t({ es: "Solicitudes manuales del negocio", en: "Manual business requests", eu: "Negozioaren eskaera manualak" })}</h3>
              </div>
              <p className="section-copy">
                {t({ es: "Peticiones recibidas en negocios que trabajan por solicitud en vez de reserva directa.", en: "Requests received in businesses that work with manual requests instead of direct booking.", eu: "Erreserba zuzenaren ordez eskaera bidez lan egiten duten negozioetan jasotako eskaerak." })}
              </p>
            </div>

            <div className="reservation-stack">
              {serviceRequests.map((request) => (
                <article className="reservation-item reservation-item-request" key={request.id}>
                  {(() => {
                    const kindConfig = getRequestServiceKindConfig(request.serviceKind, language);

                    return (
                      <>
                  <div>
                    <p className="eyebrow">{t({ es: "Solicitud", en: "Request", eu: "Eskaera" })} #{request.id}</p>
                    <h3>{request.customerName}</h3>
                  </div>
                  <p>
                    <strong>{t({ es: "Email", en: "Email", eu: "Posta elektronikoa" })}:</strong> {request.customerEmail}
                  </p>
                  <p>
                    <strong>{t({ es: "Servicio", en: "Service", eu: "Zerbitzua" })}:</strong> {request.serviceTitle || t({ es: "Solicitud general", en: "General request", eu: "Eskaera orokorra" })}
                  </p>
                  <p>
                    <strong>{t({ es: "Tipo", en: "Type", eu: "Mota" })}:</strong> {kindConfig.badge}
                  </p>
                  <p>
                    <strong>{kindConfig.dateLabel}:</strong>{" "}
                    {request.preferredDate
                      ? formatLocaleDateTime(request.preferredDate, language)
                      : t({ es: "Flexible", en: "Flexible", eu: "Malgua" })}
                  </p>
                  <p>
                    <strong>{getBusinessRequestQuantityLabel(request, language)}:</strong> {request.participants}
                  </p>
                  {request.recipientName ? (
                    <p>
                      <strong>{kindConfig.recipientLabel}:</strong> {request.recipientName}
                    </p>
                  ) : null}
                  <p>
                    <strong>{t({ es: "Mensaje", en: "Message", eu: "Mezua" })}:</strong> {request.message}
                  </p>
                  <div className="reservation-proposal-grid">
                    <label className="detail-field">
                      <span>{t({ es: "Fecha propuesta", en: "Suggested date", eu: "Proposatutako data" })}</span>
                      <input
                        type="date"
                        value={businessRequestProposedDates[request.id] || ""}
                        onChange={(event) =>
                          setBusinessRequestProposedDates((currentDates) => ({
                            ...currentDates,
                            [request.id]: event.target.value
                          }))
                        }
                      />
                    </label>
                    <label className="detail-field">
                      <span>{t({ es: "Precio orientativo", en: "Estimated price", eu: "Prezio orientagarria" })}</span>
                      <input
                        type="text"
                        placeholder={t({ es: "Ej. 42 €", en: "Eg. 42 €", eu: "Adib. 42 €" })}
                        value={businessRequestQuotedPrices[request.id] || ""}
                        maxLength={80}
                        onChange={(event) =>
                          setBusinessRequestQuotedPrices((currentPrices) => ({
                            ...currentPrices,
                            [request.id]: event.target.value
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className="detail-field">
                    <span>{t({ es: "Respuesta para el cliente", en: "Reply for the client", eu: "Bezeroarentzako erantzuna" })}</span>
                    <textarea
                      rows="3"
                      placeholder={t({ es: "Confirma disponibilidad, siguiente paso o cualquier detalle util.", en: "Confirm availability, next step or any useful detail.", eu: "Baieztatu erabilgarritasuna, hurrengo pausoa edo xehetasun erabilgarriren bat." })}
                      value={businessRequestDrafts[request.id] || ""}
                      maxLength={800}
                      onChange={(event) =>
                        setBusinessRequestDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [request.id]: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="detail-field">
                    <span>{t({ es: "Entrega, recogida o siguiente paso", en: "Delivery, pickup or next step", eu: "Entrega, jasotzea edo hurrengo pausoa" })}</span>
                    <textarea
                      rows="3"
                      placeholder={t({ es: "Indica como se cerrara la propuesta, horario sugerido o cualquier instruccion util.", en: "Explain how the proposal will be closed, the suggested timing or any useful instruction.", eu: "Azaldu nola itxiko den proposamena, gomendatutako ordutegia edo edozein jarraibide erabilgarri." })}
                      value={businessRequestFulfillmentNotes[request.id] || ""}
                      maxLength={600}
                      onChange={(event) =>
                        setBusinessRequestFulfillmentNotes((currentNotes) => ({
                          ...currentNotes,
                          [request.id]: event.target.value
                        }))
                      }
                    />
                  </label>
                  {request.serviceKind === "voucher" ? (
                    <div className="reservation-proposal-grid">
                      <label className="detail-field">
                        <span>{t({ es: "Codigo del bono", en: "Voucher code", eu: "Bonoaren kodea" })}</span>
                        <input
                          type="text"
                          placeholder={t({ es: "Ej. GLOW-NEREA-01", en: "Eg. GLOW-NEREA-01", eu: "Adib. GLOW-NEREA-01" })}
                          value={businessRequestVoucherCodes[request.id] || ""}
                          maxLength={40}
                          onChange={(event) =>
                            setBusinessRequestVoucherCodes((currentCodes) => ({
                              ...currentCodes,
                              [request.id]: event.target.value.toUpperCase()
                            }))
                          }
                        />
                      </label>
                      <label className="detail-field">
                        <span>{t({ es: "Estado del bono", en: "Voucher status", eu: "Bonoaren egoera" })}</span>
                        <select
                          value={businessRequestVoucherStatuses[request.id] || "draft"}
                          onChange={(event) =>
                            setBusinessRequestVoucherStatuses((currentStatuses) => ({
                              ...currentStatuses,
                              [request.id]: event.target.value
                            }))
                          }
                        >
                          {voucherStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}
                  <span className={`reservation-status reservation-status-request reservation-status-request-${request.status}`}>
                    {formatBusinessRequestStatus(request.status, language)}
                  </span>
                  {request.businessReply ? (
                    <p className="reservation-inline-note">
                      {t({ es: "Ultima respuesta enviada al cliente:", en: "Latest reply sent to the client:", eu: "Bezeroari bidalitako azken erantzuna:" })} {request.businessReply}
                    </p>
                  ) : null}
                  {request.proposedDate || request.quotedPriceLabel || request.fulfillmentNote ? (
                    <div className="reservation-proposal-box">
                      <strong>{t({ es: "Ultima propuesta enviada", en: "Latest proposal sent", eu: "Bidalitako azken proposamena" })}</strong>
                      {request.proposedDate ? (
                        <p>
                          <strong>{t({ es: "Fecha sugerida", en: "Suggested date", eu: "Iradokitako data" })}:</strong>{" "}
                          {formatLocaleDateTime(request.proposedDate, language)}
                        </p>
                      ) : null}
                      {request.quotedPriceLabel ? (
                        <p>
                          <strong>{t({ es: "Precio orientativo", en: "Estimated price", eu: "Prezio orientagarria" })}:</strong> {request.quotedPriceLabel}
                        </p>
                      ) : null}
                      {request.voucherCode ? (
                        <p>
                          <strong>{t({ es: "Codigo del bono", en: "Voucher code", eu: "Bonoaren kodea" })}:</strong> {request.voucherCode}
                        </p>
                      ) : null}
                      {request.voucherStatus ? (
                        <p>
                          <strong>{t({ es: "Estado del bono", en: "Voucher status", eu: "Bonoaren egoera" })}:</strong> {formatVoucherStatus(request.voucherStatus, language)}
                        </p>
                      ) : null}
                      {request.fulfillmentNote ? <p>{request.fulfillmentNote}</p> : null}
                      {request.serviceKind === "voucher" &&
                      request.voucherCode &&
                      request.status === "accepted" &&
                      request.voucherStatus !== "redeemed" ? (
                        <div className="reservation-actions">
                          <button
                            type="button"
                            className="button secondary"
                          onClick={() => handleVoucherStatusUpdate(request.id, "redeemed")}
                          disabled={isUpdatingServiceRequestId === request.id}
                        >
                          {isUpdatingServiceRequestId === request.id
                              ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." })
                              : t({ es: "Marcar como canjeado", en: "Mark as redeemed", eu: "Markatu trukatuta bezala" })}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {request.status === "pending" ? (
                    <div className="reservation-actions">
                      <button
                        type="button"
                        className="button secondary"
                      onClick={() => handleServiceRequestStatusUpdate(request.id, "approved")}
                      disabled={isUpdatingServiceRequestId === request.id}
                    >
                        {isUpdatingServiceRequestId === request.id ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." }) : t({ es: "Aprobar", en: "Approve", eu: "Onartu" })}
                      </button>
                      <button
                        type="button"
                        className="button secondary button-danger"
                      onClick={() => handleServiceRequestStatusUpdate(request.id, "rejected")}
                      disabled={isUpdatingServiceRequestId === request.id}
                    >
                        {isUpdatingServiceRequestId === request.id ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." }) : t({ es: "Rechazar", en: "Reject", eu: "Baztertu" })}
                      </button>
                    </div>
                  ) : null}
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    );
  }

  return (
    <section className="reservation-page">
        <header className="card reservation-hero">
          <div>
            <p className="eyebrow">{t({ es: "Panel de usuario", en: "Client panel", eu: "Bezero panela" })}</p>
            <h2>{t({ es: "Mi actividad", en: "My activity", eu: "Nire jarduera" })}</h2>
          <p className="section-copy">
            {t({
              es: "Consulta tus reservas, solicitudes y esperas activas, y revisa rapidamente lo siguiente que tienes pendiente.",
              en: "Review your bookings, requests and active waitlist entries, and quickly see what is still pending.",
              eu: "Kontsultatu zure erreserbak, eskaerak eta itxaron-zerrendako sarrera aktiboak, eta ikusi azkar zer duzun oraindik egiteko."
            })}
          </p>
        </div>
        <div className="reservation-overview">
          <div>
            <strong>{reservations.length}</strong>
            <span>{t({ es: "reservas activas", en: "active bookings", eu: "erreserba aktiboak" })}</span>
          </div>
          <div>
            <strong>{waitlistEntries.length}</strong>
            <span>{t({ es: "lista de espera", en: "waitlist", eu: "itxaron-zerrenda" })}</span>
          </div>
          <div>
            <strong>{serviceRequests.length}</strong>
            <span>{t({ es: "solicitudes", en: "requests", eu: "eskaerak" })}</span>
          </div>
          <div>
            <strong>{auth.user.name}</strong>
            <span>{t({ es: "usuario autenticado", en: "signed-in user", eu: "saioa hasi duen erabiltzailea" })}</span>
          </div>
        </div>
      </header>

      <section className="reservation-dashboard">
        <article className="card reservation-stat-card">
          <span>{t({ es: "Total", en: "Total", eu: "Guztira" })}</span>
          <strong>{reservationStats.total}</strong>
          <p>{t({ es: "Reservas registradas desde tu cuenta.", en: "Bookings created from your account.", eu: "Zure kontutik erregistratutako erreserbak." })}</p>
        </article>
        <article className="card reservation-stat-card reservation-stat-card-pending">
          <span>{t({ es: "Pendientes", en: "Pending", eu: "Zain" })}</span>
          <strong>{reservationStats.pending}</strong>
          <p>{t({ es: "Solicitudes enviadas a la espera de respuesta.", en: "Requests sent and waiting for a response.", eu: "Erantzunaren zain bidalitako eskaerak." })}</p>
        </article>
        <article className="card reservation-stat-card reservation-stat-card-confirmed">
          <span>{t({ es: "Confirmadas", en: "Confirmed", eu: "Berretsiak" })}</span>
          <strong>{reservationStats.confirmed}</strong>
          <p>{t({ es: "Reservas ya aceptadas por el negocio.", en: "Bookings already accepted by the business.", eu: "Negozioak jada onartutako erreserbak." })}</p>
        </article>
        <article className="card reservation-stat-card reservation-stat-card-cancelled">
          <span>{t({ es: "Canceladas", en: "Cancelled", eu: "Ezeztatuak" })}</span>
          <strong>{reservationStats.cancelled}</strong>
          <p>{t({ es: "Solicitudes anuladas o rechazadas.", en: "Requests cancelled or rejected.", eu: "Ezeztatu edo baztertutako eskaerak." })}</p>
        </article>
      </section>

      {nextReservation ? (
        <section className="card reservation-next-card">
          <div>
            <p className="eyebrow">{t({ es: "Siguiente reserva", en: "Next booking", eu: "Hurrengo erreserba" })}</p>
            <h3>{nextReservation.business_name}</h3>
            <p className="section-copy">
              {formatLocaleDateTime(nextReservation.reservation_date, language)} ·{" "}
              {formatPeopleLabel(nextReservation.people, language)}
              {nextReservation.service_title ? ` · ${nextReservation.service_title}` : ""}
            </p>
          </div>
          <span className={`reservation-status reservation-status-${nextReservation.status}`}>
            {formatReservationStatus(nextReservation.status, language)}
          </span>
          <div className="reservation-actions">
            <Link
              className="button secondary"
              to={`/businesses/${nextReservation.business_id}?rebook=1&people=${nextReservation.people}`}
            >
              {t({ es: "Reservar de nuevo", en: "Book again", eu: "Berriz erreserbatu" })}
            </Link>
            {canDownloadReservationCalendar(nextReservation) ? (
              <button
                type="button"
                className="button secondary"
                onClick={() => handleDownloadCalendar(nextReservation)}
              >
                {t({ es: "Anadir al calendario", en: "Add to calendar", eu: "Gehitu egutegira" })}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {waitlistEntries.length > 0 ? (
        <section className="card" id="activity-waitlist">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t({ es: "Interes activo", en: "Active interest", eu: "Interes aktiboa" })}</p>
              <h3>{t({ es: "Lista de espera", en: "Waitlist", eu: "Itxaron-zerrenda" })}</h3>
            </div>
            <p className="section-copy">
              Franjas completas en las que ya has dejado tu interes para que el negocio te tenga
              en cuenta.
            </p>
          </div>

          <div className="reservation-stack">
            {waitlistEntries.map((entry) => (
              <article className="reservation-item reservation-item-waitlist" key={entry.id}>
                <div>
                  <p className="eyebrow">{t({ es: "Lista de espera", en: "Waitlist", eu: "Itxaron-zerrenda" })} #{entry.id}</p>
                  <h3>{entry.business_name}</h3>
                </div>
                <p>
                  <strong>{t({ es: "Franja solicitada", en: "Requested slot", eu: "Eskatutako txanda" })}:</strong>{" "}
                  {formatLocaleDateTime(entry.desired_slot, language)}
                </p>
                <p>
                  <strong>{t({ es: "Servicio", en: "Service", eu: "Zerbitzua" })}:</strong> {entry.service_title || t({ es: "Interes general", en: "General interest", eu: "Interes orokorra" })}
                </p>
                <p>
                  <strong>{t({ es: "Personas", en: "Guests", eu: "Pertsonak" })}:</strong> {entry.people}
                </p>
                <span
                  className={`reservation-status reservation-status-waitlist reservation-status-waitlist-${entry.status}`}
                >
                  {formatWaitlistStatus(entry.status, language)}
                </span>
                <div className="reservation-actions">
                  <Link className="button secondary" to={`/businesses/${entry.business_id}`}>
                    {t({ es: "Ver negocio", en: "View business", eu: "Ikusi negozioa" })}
                  </Link>
                  {entry.status === "converted" ? (
                    <span className="reservation-inline-note">
                      {t({ es: "El negocio ya ha convertido esta espera en una reserva.", en: "The business has already turned this waitlist entry into a booking.", eu: "Negozioak jada itxaron-zerrendako sarrera hau erreserba bihurtu du." })}
                    </span>
                  ) : null}
                  {entry.status === "active" ? (
                    <button
                      type="button"
                      className="button secondary button-danger"
                      onClick={() => handleWaitlistStatusUpdate(entry.id, "cancelled")}
                      disabled={isUpdatingWaitlistId === entry.id}
                    >
                      {isUpdatingWaitlistId === entry.id ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." }) : t({ es: "Salir de espera", en: "Leave waitlist", eu: "Irten itxaron-zerrendatik" })}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {serviceRequests.length > 0 ? (
        <section className="card" id="activity-requests">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t({ es: "Solicitudes", en: "Requests", eu: "Eskaerak" })}</p>
              <h3>{t({ es: "Solicitudes enviadas", en: "Requests sent", eu: "Bidalitako eskaerak" })}</h3>
            </div>
            <p className="section-copy">
              {t({ es: "Negocios que revisan manualmente tu peticion y responden desde su panel.", en: "Businesses that manually review your request and reply from their panel.", eu: "Zure eskaera eskuz berrikusi eta bere paneletik erantzuten duten negozioak." })}
            </p>
          </div>

          <div className="reservation-stack">
            {serviceRequests.map((request) => (
              <article className="reservation-item reservation-item-request" key={request.id}>
                {(() => {
                  const kindConfig = getRequestServiceKindConfig(request.serviceKind, language);

                  return (
                    <>
                <div>
                  <p className="eyebrow">{t({ es: "Solicitud", en: "Request", eu: "Eskaera" })} #{request.id}</p>
                  <h3>{request.businessName}</h3>
                </div>
                <p>
                  <strong>{t({ es: "Servicio", en: "Service", eu: "Zerbitzua" })}:</strong> {request.serviceTitle || t({ es: "Solicitud general", en: "General request", eu: "Eskaera orokorra" })}
                </p>
                <p>
                  <strong>{t({ es: "Tipo", en: "Type", eu: "Mota" })}:</strong> {kindConfig.badge}
                </p>
                <p>
                  <strong>{kindConfig.dateLabel}:</strong>{" "}
                  {request.preferredDate
                    ? formatLocaleDateTime(request.preferredDate, language)
                    : t({ es: "Flexible", en: "Flexible", eu: "Malgua" })}
                </p>
                <p>
                  <strong>{getBusinessRequestQuantityLabel(request, language)}:</strong> {request.participants}
                </p>
                {request.recipientName ? (
                  <p>
                    <strong>{kindConfig.recipientLabel}:</strong> {request.recipientName}
                  </p>
                ) : null}
                <p>
                  <strong>{t({ es: "Mensaje", en: "Message", eu: "Mezua" })}:</strong> {request.message}
                </p>
                <span className={`reservation-status reservation-status-request reservation-status-request-${request.status}`}>
                  {formatBusinessRequestStatus(request.status, language)}
                </span>
                {request.businessReply ? (
                  <p className="reservation-inline-note">
                    {t({ es: "Respuesta del negocio:", en: "Business reply:", eu: "Negozioaren erantzuna:" })} {request.businessReply}
                  </p>
                ) : null}
                {request.proposedDate || request.quotedPriceLabel || request.fulfillmentNote ? (
                  <div className="reservation-proposal-box">
                    <strong>{t({ es: "Propuesta del negocio", en: "Business proposal", eu: "Negozioaren proposamena" })}</strong>
                    {request.proposedDate ? (
                      <p>
                        <strong>{t({ es: "Fecha sugerida", en: "Suggested date", eu: "Iradokitako data" })}:</strong>{" "}
                        {formatLocaleDateTime(request.proposedDate, language)}
                      </p>
                    ) : null}
                    {request.quotedPriceLabel ? (
                      <p>
                        <strong>{t({ es: "Precio orientativo", en: "Estimated price", eu: "Prezio orientagarria" })}:</strong> {request.quotedPriceLabel}
                      </p>
                    ) : null}
                    {request.voucherCode ? (
                      <p>
                        <strong>{t({ es: "Codigo del bono", en: "Voucher code", eu: "Bonoaren kodea" })}:</strong> {request.voucherCode}
                      </p>
                    ) : null}
                    {request.voucherStatus ? (
                      <p>
                        <strong>{t({ es: "Estado del bono", en: "Voucher status", eu: "Bonoaren egoera" })}:</strong> {formatVoucherStatus(request.voucherStatus, language)}
                      </p>
                    ) : null}
                    {request.fulfillmentNote ? <p>{request.fulfillmentNote}</p> : null}
                  </div>
                ) : null}
                <div className="reservation-actions">
                  <Link className="button secondary" to={`/businesses/${request.businessId}`}>
                    {t({ es: "Ver negocio", en: "View business", eu: "Ikusi negozioa" })}
                  </Link>
                  {request.serviceKind === "voucher" && request.voucherCode ? (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleDownloadVoucher(request)}
                    >
                      {t({ es: "Descargar bono", en: "Download voucher", eu: "Deskargatu bonua" })}
                    </button>
                  ) : null}
                  {request.status === "approved" ? (
                    <>
                      <button
                        type="button"
                        className="button secondary"
                      onClick={() => handleCustomerServiceRequestResponse(request.id, "accepted")}
                      disabled={isUpdatingServiceRequestId === request.id}
                    >
                        {isUpdatingServiceRequestId === request.id
                          ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." })
                          : t({ es: "Aceptar propuesta", en: "Accept proposal", eu: "Onartu proposamena" })}
                      </button>
                      <button
                        type="button"
                        className="button secondary button-danger"
                      onClick={() => handleCustomerServiceRequestResponse(request.id, "declined")}
                      disabled={isUpdatingServiceRequestId === request.id}
                    >
                        {isUpdatingServiceRequestId === request.id
                          ? t({ es: "Actualizando...", en: "Updating...", eu: "Eguneratzen..." })
                          : t({ es: "No me interesa", en: "Not interested", eu: "Ez zait interesatzen" })}
                      </button>
                    </>
                  ) : null}
                </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card" id="activity-reservations">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t({ es: "Seguimiento", en: "Tracking", eu: "Jarraipena" })}</p>
            <h3>{t({ es: "Listado de reservas", en: "Booking list", eu: "Erreserben zerrenda" })}</h3>
          </div>
          <p className="section-copy">
            {t({
              es: "Filtra por estado para ver solo las pendientes, revisar las confirmadas o localizar rapidamente las canceladas.",
              en: "Filter by status to focus on pending bookings, revisit confirmed ones or quickly find cancelled items.",
              eu: "Iragazi egoeraren arabera zain daudenak soilik ikusteko, baieztatutakoak berrikusteko edo ezeztatutakoak azkar aurkitzeko."
            })}
          </p>
        </div>

        <ReservationFilters language={language} selectedStatus={selectedStatus} onChange={setSelectedStatus} />

        {successMessage ? <p className="status-message success">{successMessage}</p> : null}
        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

        {reservations.length === 0 ? (
          <div className="reservation-empty">
            <h3>{t({ es: "Aun no has reservado en ningun negocio", en: "You have not booked any business yet", eu: "Oraindik ez duzu negoziorik erreserbatu" })}</h3>
            <p>
              {t({
                es: "Explora el catalogo, entra en una ficha y registra tu primera reserva para empezar a probar el flujo completo de la plataforma.",
                en: "Explore the catalogue, open a business page and create your first booking to try the full platform flow.",
                eu: "Esploratu katalogoa, sartu negozio baten fitxan eta sortu zure lehen erreserba plataformaren fluxu osoa probatzeko."
              })}
            </p>
            <Link className="button secondary" to="/businesses">
              {t({ es: "Explorar negocios", en: "Explore businesses", eu: "Esploratu negozioak" })}
            </Link>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="reservation-empty">
            <h3>{t({ es: "No hay reservas con este filtro", en: "No bookings match this filter", eu: "Ez dago erreserbarik iragazki honekin" })}</h3>
            <p>{t({ es: "Cambia de estado para volver a mostrar el resto del historial.", en: "Change the status to show the rest of the history again.", eu: "Aldatu egoera gainerako historia berriz erakusteko." })}</p>
          </div>
        ) : (
          <div className="reservation-stack">
            {filteredReservations.map((reservation) => (
              <article className="reservation-item" key={reservation.id}>
                <div>
                  <p className="eyebrow">{t({ es: "Reserva", en: "Booking", eu: "Erreserba" })} #{reservation.id}</p>
                  <h3>{reservation.business_name}</h3>
                </div>
                <p>
                  <strong>{t({ es: "Fecha", en: "Date", eu: "Data" })}:</strong>{" "}
                  {formatLocaleDateTime(reservation.reservation_date, language)}
                </p>
                <p>
                  <strong>{t({ es: "Servicio", en: "Service", eu: "Zerbitzua" })}:</strong> {reservation.service_title || t({ es: "Reserva general", en: "General booking", eu: "Erreserba orokorra" })}
                </p>
                <p>
                  <strong>{t({ es: "Personas", en: "Guests", eu: "Pertsonak" })}:</strong> {reservation.people}
                </p>
                <p>
                  <strong>{t({ es: "Estado", en: "Status", eu: "Egoera" })}:</strong> {formatReservationStatus(reservation.status, language)}
                </p>
                <span className={`reservation-status reservation-status-${reservation.status}`}>
                  {formatReservationStatus(reservation.status, language)}
                </span>
                <div className="reservation-actions">
                  <Link className="button secondary" to={`/businesses/${reservation.business_id}`}>
                    {t({ es: "Ver negocio", en: "View business", eu: "Ikusi negozioa" })}
                  </Link>
                  <Link
                    className="button secondary"
                    to={`/businesses/${reservation.business_id}?rebook=1&people=${reservation.people}`}
                  >
                    {t({ es: "Reservar de nuevo", en: "Book again", eu: "Berriz erreserbatu" })}
                  </Link>
                  {canDownloadReservationCalendar(reservation) ? (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleDownloadCalendar(reservation)}
                    >
                      {t({ es: "Anadir al calendario", en: "Add to calendar", eu: "Gehitu egutegira" })}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
