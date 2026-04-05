import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { formatLocaleDateTime, pick, useI18n } from "../i18n/I18nProvider.jsx";
import {
  addBusinessToSavedList,
  createBusinessReview,
  createBusinessServiceRequest,
  createSavedList,
  createReservation,
  fetchBusinessAvailability,
  fetchMyBusinessProfile,
  fetchSavedLists,
  fetchBusinessById,
  joinReservationWaitlist,
  saveBusinessReviewResponse
} from "../services/api.js";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl } from "../utils/maps.js";
import {
  getBusinessCoverImage,
  getBusinessInitials,
  getBusinessThemeStyle,
  getCategoryKey
} from "../utils/businessTheme.js";
import { getServiceModeConfig } from "../utils/serviceMode.js";
import { getRequestServiceKindConfig } from "../utils/requestServiceKind.js";

function buildMinReservationDay() {
  const currentDate = new Date();
  const timezoneOffsetInMilliseconds = currentDate.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(currentDate.getTime() - timezoneOffsetInMilliseconds);

  return localDate.toISOString().slice(0, 10);
}

function buildMaxReservationDay() {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 45);
  const timezoneOffsetInMilliseconds = currentDate.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(currentDate.getTime() - timezoneOffsetInMilliseconds);

  return localDate.toISOString().slice(0, 10);
}

function buildAccessSummary(auth, isHydratingAuth, language) {
  if (isHydratingAuth) {
    return {
      label: pick({ es: "Verificando sesion", en: "Checking session", eu: "Saioa egiaztatzen" }, language),
      description: pick({ es: "Comprobando si existe una cuenta activa antes de habilitar acciones privadas.", en: "Checking whether an active account exists before enabling private actions.", eu: "Ekintza pribatuak gaitu aurretik kontu aktiborik dagoen egiaztatzen." }, language)
    };
  }

  if (!auth) {
    return {
      label: pick({ es: "Acceso publico", en: "Public access", eu: "Sarbide publikoa" }, language),
      description: pick({ es: "Puedes consultar la ficha, pero necesitas iniciar sesion para reservar o resenar.", en: "You can browse the profile, but you need to sign in to book or review.", eu: "Fitxa ikusi dezakezu, baina saioa hasi behar duzu erreserbatzeko edo iritzia emateko." }, language)
    };
  }

  if (auth.user.role === "business") {
    return {
      label: pick({ es: "Cuenta de negocio", en: "Business account", eu: "Negozio kontua" }, language),
      description: pick({ es: "Puedes revisar la ficha, pero las reservas y resenas estan limitadas a cuentas cliente.", en: "You can review the profile, but bookings and reviews are limited to client accounts.", eu: "Fitxa berrikusi dezakezu, baina erreserbak eta iritziak bezero-kontuetara mugatuta daude." }, language)
    };
  }

  return {
    label: pick({ es: "Cuenta cliente", en: "Client account", eu: "Bezero kontua" }, language),
    description: pick({ es: "Tienes acceso a reservas y, si completas una visita confirmada, tambien a resenas.", en: "You can book and, after a confirmed visit, publish reviews.", eu: "Erreserbatzeko sarbidea duzu eta, bisita baieztatu bat egin ondoren, iritziak argitara ditzakezu." }, language)
  };
}

function getRatingCopy(rating, language) {
  const numericRating = Number(rating);

  if (numericRating === 5) {
    return pick({ es: "Excelente · experiencia muy recomendable", en: "Excellent · highly recommended experience", eu: "Bikaina · oso gomendagarria" }, language);
  }

  if (numericRating === 4) {
    return pick({ es: "Muy buena · valoracion claramente positiva", en: "Very good · clearly positive rating", eu: "Oso ona · balorazio oso positiboa" }, language);
  }

  if (numericRating === 3) {
    return pick({ es: "Correcta · experiencia aceptable", en: "Fair · acceptable experience", eu: "Zuzena · esperientzia onargarria" }, language);
  }

  if (numericRating === 2) {
    return pick({ es: "Mejorable · hubo varios puntos flojos", en: "Needs work · there were several weak points", eu: "Hobetu beharrekoa · puntu ahul batzuk egon ziren" }, language);
  }

  return pick({ es: "Deficiente · experiencia por debajo de lo esperado", en: "Poor · below expectations", eu: "Eskasa · espero zena baino okerragoa" }, language);
}

export default function BusinessDetailPage({ auth, isHydratingAuth }) {
  const { language } = useI18n();
  const t = (copy, variables) => pick(copy, language, variables);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [business, setBusiness] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [reservationDay, setReservationDay] = useState(buildMinReservationDay());
  const [selectedSlotDate, setSelectedSlotDate] = useState("");
  const [people, setPeople] = useState("2");
  const [availability, setAvailability] = useState([]);
  const [availabilityRules, setAvailabilityRules] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityRefreshTick, setAvailabilityRefreshTick] = useState(0);
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [waitlistError, setWaitlistError] = useState("");
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [selectedBookingServiceId, setSelectedBookingServiceId] = useState("");
  const [requestServiceId, setRequestServiceId] = useState("");
  const [requestPreferredDate, setRequestPreferredDate] = useState("");
  const [requestQuantity, setRequestQuantity] = useState("1");
  const [requestRecipientName, setRequestRecipientName] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [savedLists, setSavedLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [savedListName, setSavedListName] = useState("");
  const [savedListDescription, setSavedListDescription] = useState("");
  const [savedListMessage, setSavedListMessage] = useState("");
  const [savedListError, setSavedListError] = useState("");
  const [isLoadingSavedLists, setIsLoadingSavedLists] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [rebookMessage, setRebookMessage] = useState("");
  const [ownedBusinessId, setOwnedBusinessId] = useState(null);
  const [businessResponseDrafts, setBusinessResponseDrafts] = useState({});
  const [businessResponseMessage, setBusinessResponseMessage] = useState("");
  const [businessResponseError, setBusinessResponseError] = useState("");
  const [isSubmittingBusinessResponseId, setIsSubmittingBusinessResponseId] = useState(null);

  async function loadBusiness() {
    try {
      const data = await fetchBusinessById(id);
      setBusiness(data);
      setHasError(false);
    } catch (_error) {
      setBusiness(null);
      setHasError(true);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, [id]);

  useEffect(() => {
    const shouldRebook = searchParams.get("rebook") === "1";
    const rebookPeople = Number.parseInt(searchParams.get("people"), 10);

    if (!shouldRebook) {
      setRebookMessage("");
      return;
    }

    if (Number.isInteger(rebookPeople) && rebookPeople > 0) {
      setPeople(String(rebookPeople));
      setRebookMessage(
        pick(
          {
            es: "Modo repetir reserva activado. Hemos rellenado {{count}} persona{{suffix}} como punto de partida.",
            en: "Repeat booking mode enabled. We filled {{count}} guest{{suffix}} as a starting point.",
            eu: "Erreserba berriz egiteko modua aktibatu da. Hasierako puntutzat {{count}} pertsona{{suffix}} bete dugu."
          },
          language,
          {
            count: rebookPeople,
            suffix: rebookPeople === 1 ? "" : pick({ es: "s", en: "s", eu: "" }, language)
          }
        )
      );
      return;
    }

    setRebookMessage(pick({ es: "Modo repetir reserva activado. Solo falta elegir fecha y confirmar.", en: "Repeat booking mode enabled. You only need to choose a date and confirm.", eu: "Erreserba berriz egiteko modua aktibatu da. Data aukeratu eta baieztatu besterik ez da falta." }, language));
  }, [language, searchParams]);

  useEffect(() => {
    if (business?.serviceMode === "request") {
      setAvailability([]);
      setAvailabilityRules(null);
      setSelectedSlotDate("");
      setAvailabilityError("");
      setIsLoadingAvailability(false);
      return;
    }

    const parsedPeople = Number.parseInt(people, 10);

    if (!business?.id || !reservationDay || !Number.isInteger(parsedPeople) || parsedPeople <= 0) {
      setAvailability([]);
      setAvailabilityRules(null);
      setSelectedSlotDate("");
      return;
    }

    if (business.services?.length > 0 && !selectedBookingServiceId) {
      setAvailability([]);
      setAvailabilityRules(null);
      setSelectedSlotDate("");
      return;
    }

    setIsLoadingAvailability(true);
    setAvailabilityError("");

    fetchBusinessAvailability(business.id, {
      date: reservationDay,
      people: parsedPeople,
      serviceId: selectedBookingServiceId || undefined
    })
      .then((data) => {
        setAvailability(data.slots);
        setAvailabilityRules(data.rules);
        setSelectedSlotDate((currentValue) => {
          if (
            currentValue &&
            data.slots.some((slot) => slot.reservationDate === currentValue && slot.status !== "full")
          ) {
            return currentValue;
          }

          return data.slots.find((slot) => slot.status !== "full")?.reservationDate || "";
        });
      })
      .catch((error) => {
        setAvailability([]);
        setAvailabilityRules(null);
        setSelectedSlotDate("");
        setAvailabilityError(error.message);
      })
      .finally(() => {
        setIsLoadingAvailability(false);
      });
  }, [
    availabilityRefreshTick,
    business?.id,
    business?.serviceMode,
    people,
    reservationDay,
    selectedBookingServiceId
  ]);

  useEffect(() => {
    if (business?.serviceMode !== "request") {
      setRequestServiceId("");
      setSelectedBookingServiceId((currentValue) => {
        if (!business?.services?.length) {
          return "";
        }

        if (
          currentValue &&
          business.services.some((service) => String(service.id) === currentValue)
        ) {
          return currentValue;
        }

        return String(business.services[0]?.id || "");
      });
      return;
    }

    setSelectedBookingServiceId("");
    setRequestServiceId((currentValue) => {
      if (
        currentValue &&
        business.services?.some((service) => String(service.id) === currentValue)
      ) {
        return currentValue;
      }

      return String(business.services?.[0]?.id || "");
    });
  }, [business]);

  useEffect(() => {
    if (!auth || auth.user.role !== "user") {
      setSavedLists([]);
      setSelectedListId("");
      setSavedListMessage("");
      setSavedListError("");
      return;
    }

    setIsLoadingSavedLists(true);
    setSavedListError("");

    fetchSavedLists()
      .then((data) => {
        setSavedLists(data);
        setSelectedListId((currentValue) => currentValue || String(data[0]?.id || ""));
      })
      .catch((error) => {
        setSavedLists([]);
        setSavedListError(error.message);
      })
      .finally(() => {
        setIsLoadingSavedLists(false);
      });
  }, [auth, id]);

  useEffect(() => {
    if (!auth || auth.user.role !== "business") {
      setOwnedBusinessId(null);
      return;
    }

    fetchMyBusinessProfile()
      .then((data) => {
        setOwnedBusinessId(data.business?.id ?? null);
      })
      .catch(() => {
        setOwnedBusinessId(null);
      });
  }, [auth]);

  async function handleReservationSubmit(event) {
    event.preventDefault();

    if (!auth) {
      setReservationError(pick({ es: "Debes iniciar sesion para crear una reserva.", en: "You need to sign in to create a booking.", eu: "Saioa hasi behar duzu erreserba bat sortzeko." }, language));
      setReservationMessage("");
      return;
    }

    if (auth.user.role !== "user") {
      setReservationError(pick({ es: "Solo las cuentas de usuario cliente pueden crear reservas.", en: "Only client accounts can create bookings.", eu: "Bezero-kontuek bakarrik sor ditzakete erreserbak." }, language));
      setReservationMessage("");
      return;
    }

    if (!selectedSlotDate) {
      setReservationError(pick({ es: "Selecciona una franja disponible antes de confirmar la reserva.", en: "Select an available slot before confirming the booking.", eu: "Hautatu erabilgarri dagoen txanda bat erreserba baieztatu aurretik." }, language));
      setReservationMessage("");
      return;
    }

    if (selectedSlot?.status === "full") {
      setReservationError(
        pick({ es: "La franja seleccionada ya esta completa. Puedes unirte a la lista de espera.", en: "The selected slot is already full. You can join the waitlist.", eu: "Hautatutako txanda beteta dago jada. Itxaron-zerrendan sar zaitezke." }, language)
      );
      setReservationMessage("");
      return;
    }

    setIsSubmittingReservation(true);
    setReservationError("");
    setReservationMessage("");
    setWaitlistMessage("");
    setWaitlistError("");

    try {
      await createReservation(
        {
          businessId: business.id,
          businessServiceId: selectedBookingServiceId ? Number(selectedBookingServiceId) : null,
          reservationDate: selectedSlotDate,
          people: Number(people)
        }
      );

      setReservationMessage(pick({ es: "Reserva registrada correctamente.", en: "Booking created successfully.", eu: "Erreserba ondo sortu da." }, language));
      setPeople("2");
      setAvailabilityRefreshTick((currentTick) => currentTick + 1);
    } catch (error) {
      setReservationError(error.message);
    } finally {
      setIsSubmittingReservation(false);
    }
  }

  async function handleJoinWaitlist() {
    if (!auth) {
      setWaitlistError(pick({ es: "Debes iniciar sesion para unirte a la lista de espera.", en: "You need to sign in to join the waitlist.", eu: "Saioa hasi behar duzu itxaron-zerrendan sartzeko." }, language));
      setWaitlistMessage("");
      return;
    }

    if (auth.user.role !== "user") {
      setWaitlistError(pick({ es: "Solo las cuentas de usuario cliente pueden usar la lista de espera.", en: "Only client accounts can use the waitlist.", eu: "Bezero-kontuek bakarrik erabil dezakete itxaron-zerrenda." }, language));
      setWaitlistMessage("");
      return;
    }

    if (!selectedSlotDate || selectedSlot?.status !== "full") {
      setWaitlistError(pick({ es: "Selecciona una franja completa para apuntarte a la lista de espera.", en: "Select a full slot to join the waitlist.", eu: "Hautatu beteta dagoen txanda bat itxaron-zerrendan sartzeko." }, language));
      setWaitlistMessage("");
      return;
    }

    setIsSubmittingWaitlist(true);
    setWaitlistError("");
    setWaitlistMessage("");
    setReservationError("");

    try {
      const response = await joinReservationWaitlist({
        businessId: business.id,
        businessServiceId: selectedBookingServiceId ? Number(selectedBookingServiceId) : null,
        desiredSlot: selectedSlotDate,
        people: Number(people)
      });

      setWaitlistMessage(response.message);
    } catch (error) {
      setWaitlistError(error.message);
    } finally {
      setIsSubmittingWaitlist(false);
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!auth) {
      setReviewError(pick({ es: "Debes iniciar sesion para publicar una resena.", en: "You need to sign in to publish a review.", eu: "Saioa hasi behar duzu iritzi bat argitaratzeko." }, language));
      setReviewMessage("");
      return;
    }

    if (auth.user.role !== "user") {
      setReviewError(pick({ es: "Solo las cuentas de usuario cliente pueden publicar resenas.", en: "Only client accounts can publish reviews.", eu: "Bezero-kontuek bakarrik argitaratu ditzakete iritziak." }, language));
      setReviewMessage("");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");
    setReviewMessage("");

    try {
      const response = await createBusinessReview(
        business.id,
        {
          rating: Number(reviewRating),
          comment: reviewComment
        }
      );

      setReviewMessage(response.message);
      setReviewComment("");
      await loadBusiness();
    } catch (error) {
      setReviewError(error.message);
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleRequestSubmit(event) {
    event.preventDefault();

    if (!auth) {
      setRequestError(pick({ es: "Debes iniciar sesion para enviar una solicitud.", en: "You need to sign in to send a request.", eu: "Saioa hasi behar duzu eskaera bat bidaltzeko." }, language));
      setRequestMessage("");
      return;
    }

    if (auth.user.role !== "user") {
      setRequestError(pick({ es: "Solo las cuentas de usuario cliente pueden enviar solicitudes.", en: "Only client accounts can send requests.", eu: "Bezero-kontuek bakarrik bidal ditzakete eskaerak." }, language));
      setRequestMessage("");
      return;
    }

    setIsSubmittingRequest(true);
    setRequestError("");
    setRequestMessage("");

    try {
      const response = await createBusinessServiceRequest({
        businessId: business.id,
        businessServiceId: requestServiceId ? Number(requestServiceId) : null,
        preferredDate: requestPreferredDate || null,
        participants: Number(requestQuantity),
        recipientName: requestRecipientName,
        message: requestNote
      });

      setRequestMessage(response.message);
      setRequestNote("");
      setRequestPreferredDate("");
      setRequestRecipientName("");
      setRequestQuantity("1");
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  const currentBusinessId = business?.id ?? null;
  const categoryKey = getCategoryKey(business?.category);
  const averageRating = Number(business?.average_rating || 0);
  const reviewCount = Number(business?.review_count || 0);
  const serviceMode = getServiceModeConfig(business?.serviceMode, language);
  const mapsEmbedUrl = buildGoogleMapsEmbedUrl(business?.address);
  const mapsSearchUrl = buildGoogleMapsSearchUrl(business?.address);
  const posterImage = getBusinessCoverImage(business);
  const businessThemeStyle = getBusinessThemeStyle(business);
  const minimumReservationDay = buildMinReservationDay();
  const maximumReservationDay = buildMaxReservationDay();
  const accessSummary = buildAccessSummary(auth, isHydratingAuth, language);
  const reviewCharacterCount = reviewComment.trim().length;
  const reviewCharactersRemaining = Math.max(500 - reviewCharacterCount, 0);
  const reviewHelperCopy = getRatingCopy(reviewRating, language);
  const visibleScheduleRules = business?.scheduleRules?.filter((rule) => rule.isOpen) || [];
  const visibleScheduleExceptions = business?.scheduleExceptions || [];
  const listsContainingBusiness = currentBusinessId
    ? savedLists.filter((list) =>
        list.businesses.some((savedBusiness) => savedBusiness.id === currentBusinessId)
      )
    : [];
  const availableListsToSave = currentBusinessId
    ? savedLists.filter(
        (list) => !list.businesses.some((savedBusiness) => savedBusiness.id === currentBusinessId)
      )
    : savedLists;
  const canManageReviewResponses =
    auth?.user.role === "business" && currentBusinessId && ownedBusinessId === currentBusinessId;
  const selectedBookingService =
    business?.services?.find((service) => String(service.id) === selectedBookingServiceId) || null;
  const selectedRequestService =
    business?.services?.find((service) => String(service.id) === requestServiceId) || null;
  const requestKindConfig = getRequestServiceKindConfig(selectedRequestService?.kind, language);
  const selectedSlot =
    availability.find((slot) => slot.reservationDate === selectedSlotDate) || null;
  const availableSlotCount = availability.filter((slot) => slot.status !== "full").length;
  const isRequestMode = business?.serviceMode === "request";

  useEffect(() => {
    if (availableListsToSave.length === 0) {
      if (!savedLists.some((list) => String(list.id) === selectedListId)) {
        setSelectedListId("");
      }
      return;
    }

    if (!availableListsToSave.some((list) => String(list.id) === selectedListId)) {
      setSelectedListId(String(availableListsToSave[0].id));
    }
  }, [availableListsToSave, savedLists, selectedListId]);

  useEffect(() => {
    if (!business?.reviews?.length) {
      return;
    }

    setBusinessResponseDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      business.reviews.forEach((review) => {
        if (nextDrafts[review.id] === undefined) {
          nextDrafts[review.id] = review.business_response || "";
        }
      });

      return nextDrafts;
    });
  }, [business]);

  async function refreshSavedLists() {
    const data = await fetchSavedLists();
    setSavedLists(data);
    setSelectedListId((currentValue) => {
      if (currentValue && data.some((list) => String(list.id) === currentValue)) {
        return currentValue;
      }

      return String(data[0]?.id || "");
    });
  }

  async function handleSaveBusiness() {
    setIsSavingBusiness(true);
    setSavedListError("");
    setSavedListMessage("");

    try {
      await addBusinessToSavedList(Number(selectedListId), {
        businessId: business.id
      });
      await refreshSavedLists();
      setSavedListMessage(
        t({
          es: "Negocio guardado correctamente en la lista seleccionada.",
          en: "Business saved successfully in the selected list.",
          eu: "Negozioa ondo gorde da hautatutako zerrendan."
        })
      );
    } catch (error) {
      setSavedListError(error.message);
    } finally {
      setIsSavingBusiness(false);
    }
  }

  async function handleCreateListAndSave(event) {
    event.preventDefault();
    setIsCreatingList(true);
    setSavedListError("");
    setSavedListMessage("");

    try {
      const response = await createSavedList({
        name: savedListName,
        description: savedListDescription
      });
      await addBusinessToSavedList(response.list.id, {
        businessId: business.id
      });
      setSavedListName("");
      setSavedListDescription("");
      await refreshSavedLists();
      setSavedListMessage(t({ es: "Lista creada y negocio guardado correctamente.", en: "List created and business saved successfully.", eu: "Zerrenda sortu eta negozioa ondo gorde da." }));
    } catch (error) {
      setSavedListError(error.message);
    } finally {
      setIsCreatingList(false);
    }
  }

  async function handleBusinessResponseSubmit(event, reviewId) {
    event.preventDefault();
    setIsSubmittingBusinessResponseId(reviewId);
    setBusinessResponseError("");
    setBusinessResponseMessage("");

    try {
      const response = await saveBusinessReviewResponse(business.id, reviewId, {
        response: businessResponseDrafts[reviewId] || ""
      });

      setBusiness((currentBusiness) => ({
        ...currentBusiness,
        reviews: currentBusiness.reviews.map((review) =>
          review.id === reviewId ? response.review : review
        )
      }));
      setBusinessResponseDrafts((currentDrafts) => ({
        ...currentDrafts,
        [reviewId]: response.review.business_response || ""
      }));
      setBusinessResponseMessage(response.message);
    } catch (error) {
      setBusinessResponseError(error.message);
    } finally {
      setIsSubmittingBusinessResponseId(null);
    }
  }

  if (hasError) {
    return (
      <section className="card">
        <p className="eyebrow">{t({ es: "Detalle", en: "Detail", eu: "Xehetasuna" })}</p>
        <h2>{t({ es: "No se ha podido cargar el negocio", en: "The business could not be loaded", eu: "Ezin izan da negozioa kargatu" })}</h2>
        <p>{t({ es: "Revisa que el backend este en marcha y vuelve a intentarlo.", en: "Check that the backend is running and try again.", eu: "Egiaztatu backend-a martxan dagoela eta saiatu berriro." })}</p>
        <Link className="button secondary" to="/businesses">
          {t({ es: "Volver al listado", en: "Back to list", eu: "Itzuli zerrendara" })}
        </Link>
      </section>
    );
  }

  if (!business) {
    return <p>{t({ es: "Cargando negocio...", en: "Loading business...", eu: "Negozioa kargatzen..." })}</p>;
  }

  return (
    <section className="detail-page">
      <div className="card detail-hero" data-category={categoryKey} style={businessThemeStyle}>
        <div>
          <Link className="detail-back" to="/businesses">
            {t({ es: "Volver a negocios", en: "Back to businesses", eu: "Itzuli negozioetara" })}
          </Link>
          <p className="eyebrow">{business.category || t({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" })}</p>
          <h2>{business.name}</h2>
          <p className="detail-lead">{business.heroClaim || business.description}</p>
          {business.heroHighlight ? (
            <div className="detail-hero-note">
              <strong>{t({ es: "Que destaca aqui", en: "What stands out here", eu: "Zer nabarmentzen da hemen" })}</strong>
              <p>{business.heroHighlight}</p>
            </div>
          ) : null}
        </div>

        <div className="detail-tags">
          <span className="detail-tag">{business.heroBadge || t({ es: "Negocio local", en: "Local business", eu: "Tokiko negozioa" })}</span>
          <span className="detail-tag">{serviceMode.badge}</span>
          <span className="detail-tag">{t({ es: "{{count}} resenas", en: "{{count}} reviews", eu: "{{count}} iritzi" }, { count: reviewCount })}</span>
        </div>

        <div className="detail-poster">
          <img
            className="detail-poster-photo"
            src={posterImage}
            alt={`Imagen representativa de ${business.category || t({ es: "la categoria del negocio", en: "the business category", eu: "negozioaren kategoria" })}`}
          />
          <span className="detail-poster-mark">{getBusinessInitials(business.name)}</span>
          <div className="detail-poster-copy">
            <strong>{business.name}</strong>
            <span>{business.address}</span>
          </div>
        </div>
      </div>

      <section className="detail-highlights">
        <article className="card detail-highlight-card">
          <span>{t({ es: "Valoracion media", en: "Average rating", eu: "Batez besteko balorazioa" })}</span>
          <strong>{averageRating.toFixed(1)} / 5</strong>
          <p>{t({ es: "Promedio de las opiniones publicadas.", en: "Average of published reviews.", eu: "Argitaratutako iritzien batez bestekoa." })}</p>
        </article>
        <article className="card detail-highlight-card">
          <span>{t({ es: "Opiniones", en: "Reviews", eu: "Iritziak" })}</span>
          <strong>{reviewCount}</strong>
          <p>{t({ es: "Resenas visibles ahora mismo.", en: "Reviews visible right now.", eu: "Une honetan ikusgai dauden iritziak." })}</p>
        </article>
        <article className="card detail-highlight-card">
          <span>{t({ es: "Ubicacion", en: "Location", eu: "Kokapena" })}</span>
          <strong>{mapsSearchUrl ? "Google Maps" : t({ es: "Pendiente", en: "Pending", eu: "Zain" })}</strong>
          <p>
            {mapsSearchUrl
              ? t({ es: "La direccion se puede abrir directamente en el mapa.", en: "The address can be opened directly on the map.", eu: "Helbidea zuzenean ireki daiteke mapan." })
              : t({ es: "Todavia no hay una direccion suficiente para abrir la localizacion.", en: "There is not enough address information to open the location yet.", eu: "Oraindik ez dago kokapena irekitzeko adina helbide-informaziorik." })}
          </p>
        </article>
        <article className="card detail-highlight-card detail-highlight-card-accent">
          <span>{t({ es: "Estado de acceso", en: "Access state", eu: "Sarbide egoera" })}</span>
          <strong>{accessSummary.label}</strong>
          <p>{accessSummary.description}</p>
        </article>
        {business.heroClaim ? (
          <article className="card detail-highlight-card detail-highlight-card-soft">
            <span>{t({ es: "Propuesta", en: "Offer", eu: "Proposamena" })}</span>
            <strong>{business.heroBadge || business.name}</strong>
            <p>{business.heroClaim}</p>
          </article>
        ) : null}
      </section>

      <div className="detail-layout">
        <article className="card">
          <h3>{t({ es: "Informacion del establecimiento", en: "Business information", eu: "Establezimenduaren informazioa" })}</h3>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span>{t({ es: "Direccion", en: "Address", eu: "Helbidea" })}</span>
              <strong>{business.address}</strong>
            </div>

            <div className="detail-info-item">
              <span>{t({ es: "Telefono", en: "Phone", eu: "Telefonoa" })}</span>
              <strong>{business.phone || t({ es: "Pendiente de completar", en: "To be completed", eu: "Osatzeko" })}</strong>
            </div>

            <div className="detail-info-item">
              <span>{t({ es: "Categoria", en: "Category", eu: "Kategoria" })}</span>
              <strong>{business.category || t({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" })}</strong>
            </div>

            <div className="detail-info-item">
              <span>{t({ es: "Modo de servicio", en: "Service mode", eu: "Zerbitzu modua" })}</span>
              <strong>{serviceMode.badge}</strong>
            </div>

            <div className="detail-info-item">
              <span>{t({ es: "Valoracion media", en: "Average rating", eu: "Batez besteko balorazioa" })}</span>
              <strong>{averageRating.toFixed(1)} / 5</strong>
            </div>

            <div className="detail-info-item">
              <span>{t({ es: "Opiniones", en: "Reviews", eu: "Iritziak" })}</span>
              <strong>{t({ es: "{{count}} publicadas", en: "{{count}} published", eu: "{{count}} argitaratuta" }, { count: reviewCount })}</strong>
            </div>
          </div>

          <div className="detail-section">
            <h3>{t({ es: "Descripcion", en: "Description", eu: "Deskribapena" })}</h3>
            <p>{business.description}</p>
          </div>

          {business.visitNote ? (
            <div className="detail-section">
              <h3>{t({ es: "Antes de venir", en: "Before you come", eu: "Etorri aurretik" })}</h3>
              <p>{business.visitNote}</p>
            </div>
          ) : null}

          {visibleScheduleRules.length > 0 ? (
            <div className="detail-section">
              <h3>{t({ es: "Horarios del negocio", en: "Business schedule", eu: "Negozioaren ordutegia" })}</h3>
              <div className="profile-checklist">
                {visibleScheduleRules.map((rule) => (
                  <div key={rule.dayOfWeek} className="profile-checklist-item is-complete">
                    <span>{rule.label}</span>
                    <strong>
                      {rule.openTime} · {rule.closeTime}
                    </strong>
                    <p>{t({ es: "Se generan nuevas franjas cada {{minutes}} minutos.", en: "New slots are generated every {{minutes}} minutes.", eu: "Txanda berriak {{minutes}} minuturo sortzen dira." }, { minutes: rule.slotIntervalMinutes })}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {visibleScheduleExceptions.length > 0 ? (
            <div className="detail-section">
              <h3>{t({ es: "Fechas especiales", en: "Special dates", eu: "Data bereziak" })}</h3>
              <div className="profile-checklist">
                {visibleScheduleExceptions.map((exception, index) => (
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
                          ? t({ es: "Ese dia no habra agenda publica.", en: "There will be no public schedule that day.", eu: "Egun horretan ez da egutegi publikorik egongo." })
                          : t({ es: "Nueva franja cada {{minutes}} minutos.", en: "New slot every {{minutes}} minutes.", eu: "Txanda berria {{minutes}} minuturo." }, { minutes: exception.slotIntervalMinutes }))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {business.services?.length ? (
            <div className="detail-section">
              <h3>{t({ es: "Servicios destacados", en: "Featured services", eu: "Zerbitzu nabarmenduak" })}</h3>
              <div className="saved-list-grid">
                {business.services.map((service) => (
                  <article key={service.id} className="saved-list-card">
                    <div className="saved-list-head">
                      <strong>{service.title}</strong>
                      <div className="filter-tag-list">
                        <span className="filter-tag">
                          {getRequestServiceKindConfig(service.kind, language).badge}
                        </span>
                        {service.priceLabel ? <span className="filter-tag">{service.priceLabel}</span> : null}
                      </div>
                    </div>
                    <p>{service.description}</p>
                    <div className="saved-list-meta">
                      <span>
                        {service.durationMinutes ? `${service.durationMinutes} min` : t({ es: "Duracion flexible", en: "Flexible duration", eu: "Iraupen malgua" })}
                      </span>
                      <span>
                        {service.capacity ? t({ es: "{{count}} plazas", en: "{{count}} seats", eu: "{{count}} plaza" }, { count: service.capacity }) : t({ es: "Capacidad variable", en: "Variable capacity", eu: "Edukiera aldakorra" })}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {business.cancellationPolicy ? (
            <div className="detail-section">
              <h3>{t({ es: "Politica de cancelacion", en: "Cancellation policy", eu: "Ezeztapen politika" })}</h3>
              <p>{business.cancellationPolicy}</p>
            </div>
          ) : null}

          {business.faqs?.length ? (
            <div className="detail-section">
              <h3>{t({ es: "Preguntas frecuentes", en: "Frequently asked questions", eu: "Ohiko galderak" })}</h3>
              <div className="profile-checklist">
                {business.faqs.map((faq) => (
                  <div key={faq.id || faq.question} className="profile-checklist-item is-complete">
                    <span>{t({ es: "FAQ", en: "FAQ", eu: "FAQ" })}</span>
                    <strong>{faq.question}</strong>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="detail-section">
            <div className="section-heading">
              <div>
                <h3>{t({ es: "Ubicacion", en: "Location", eu: "Kokapena" })}</h3>
              </div>
              {mapsSearchUrl ? (
                <a
                  className="button secondary"
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t({ es: "Abrir en Google Maps", en: "Open in Google Maps", eu: "Ireki Google Maps-en" })}
                </a>
              ) : null}
            </div>

            <p className="section-copy">
              {t({ es: "La direccion guardada en la ficha del negocio se utiliza para mostrar esta vista rapida y facilitar la apertura de Google Maps.", en: "The address stored in the business profile is used to show this quick view and make Google Maps opening easier.", eu: "Negozioaren fitxan gordetako helbidea ikuspegi azkar hau erakusteko eta Google Maps irekitzea errazteko erabiltzen da." })}
            </p>

            {mapsEmbedUrl ? (
              <div className="map-embed-shell">
                <iframe
                  title={`Ubicacion de ${business.name}`}
                  src={mapsEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <p>{t({ es: "No hay una direccion suficiente para mostrar la ubicacion.", en: "There is not enough address information to show the location.", eu: "Ez dago kokapena erakusteko adina helbide-informaziorik." })}</p>
            )}
          </div>

          <div className="detail-section">
            <h3>{t({ es: "Valor para el usuario", en: "User value", eu: "Erabiltzailearentzako balioa" })}</h3>
            <ul className="detail-list">
              <li>{t({ es: "Consulta rapida de informacion basica del establecimiento.", en: "Quick access to the key business information.", eu: "Establezimenduaren oinarrizko informaziorako sarbide azkarra." })}</li>
              <li>{t({ es: "Acceso centralizado a la reserva desde una sola pantalla.", en: "Centralised booking access from a single screen.", eu: "Pantaila bakar batetik erreserbatzeko sarbide zentralizatua." })}</li>
              <li>{t({ es: "Navegacion clara entre listado y detalle del negocio.", en: "Clear navigation between the listing and the business detail.", eu: "Zerrendaren eta negozioaren xehetasunaren arteko nabigazio argia." })}</li>
            </ul>
          </div>

          <div className="detail-section detail-quote">
            <p>
              {t({ es: "Esta vista reune la informacion principal del negocio y sirve como base para la reserva dentro del flujo planteado en el MVP.", en: "This view gathers the key business information and works as the booking base inside the current product flow.", eu: "Ikuspegi honek negozioaren informazio nagusia biltzen du eta egungo produktu-fluxuan erreserbarako oinarri gisa balio du." })}
            </p>
          </div>
        </article>

        <aside className="card detail-aside">
          <p className="eyebrow">{serviceMode.panelEyebrow}</p>
          <h3>{serviceMode.panelTitle}</h3>
          <div className="detail-flow-card">
            <span>{t({ es: "Estado actual", en: "Current state", eu: "Uneko egoera" })}</span>
            <strong>{accessSummary.label}</strong>
            <p>{accessSummary.description}</p>
          </div>
          <div className="detail-availability-box">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t({ es: "Disponibilidad", en: "Availability", eu: "Erabilgarritasuna" })}</p>
                <h4>{isRequestMode ? t({ es: "Cuadra la solicitud", en: "Shape the request", eu: "Doitu eskaera" }) : t({ es: "Elige fecha y franja", en: "Choose a date and slot", eu: "Aukeratu data eta txanda" })}</h4>
              </div>
              {!isRequestMode ? (
                <span className="detail-availability-badge">
                  {t({ es: "{{count}} huecos visibles", en: "{{count}} visible openings", eu: "{{count}} hutsune ikusgai" }, { count: availableSlotCount })}
                </span>
              ) : null}
            </div>
            <div className="detail-availability-controls">
              {isRequestMode ? (
                <label className="detail-field">
                  <span>{requestKindConfig.quantityLabel}</span>
                  <input
                    type="number"
                    min="1"
                    value={requestQuantity}
                    onChange={(event) => setRequestQuantity(event.target.value)}
                    required
                  />
                </label>
              ) : (
                <label className="detail-field">
                  <span>{serviceMode.peopleLabel}</span>
                  <input
                    type="number"
                    min="1"
                    value={people}
                    onChange={(event) => setPeople(event.target.value)}
                    required
                  />
                </label>
              )}
              {!isRequestMode && business.services?.length ? (
                <label className="detail-field">
                  <span>{t({ es: "Servicio", en: "Service", eu: "Zerbitzua" })}</span>
                  <select
                    value={selectedBookingServiceId}
                    onChange={(event) => setSelectedBookingServiceId(event.target.value)}
                  >
                    {business.services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="detail-field">
                <span>{isRequestMode ? requestKindConfig.dateLabel : t({ es: "Fecha", en: "Date", eu: "Data" })}</span>
                <input
                  type="date"
                  value={isRequestMode ? requestPreferredDate : reservationDay}
                  min={minimumReservationDay}
                  max={maximumReservationDay}
                  onChange={(event) =>
                    isRequestMode
                      ? setRequestPreferredDate(event.target.value)
                      : setReservationDay(event.target.value)
                  }
                  required={!isRequestMode}
                />
              </label>
            </div>

            {isRequestMode ? (
              <>
                {business.services?.length ? (
                  <label className="detail-field">
                    <span>{t({ es: "Servicio", en: "Service", eu: "Zerbitzua" })}</span>
                    <select
                      value={requestServiceId}
                      onChange={(event) => setRequestServiceId(event.target.value)}
                    >
                      {business.services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="detail-field">
                  <span>{requestKindConfig.messageLabel}</span>
                  <textarea
                    rows="4"
                    placeholder={requestKindConfig.messagePlaceholder}
                    value={requestNote}
                    minLength={12}
                    maxLength={800}
                    onChange={(event) => setRequestNote(event.target.value)}
                    required
                  />
                </label>

                {requestKindConfig.showRecipientField ? (
                  <label className="detail-field">
                    <span>{requestKindConfig.recipientLabel}</span>
                    <input
                      type="text"
                      placeholder={requestKindConfig.recipientPlaceholder}
                      value={requestRecipientName}
                      maxLength={120}
                      onChange={(event) => setRequestRecipientName(event.target.value)}
                    />
                  </label>
                ) : null}

                <p className="detail-note">
                  {requestKindConfig.helperCopy}{" "}
                  {requestPreferredDate ? "" : requestKindConfig.datePlaceholderCopy}
                </p>

                {selectedRequestService ? (
                  <div className="detail-flow-card detail-flow-card-soft">
                    <span>{requestKindConfig.badge} seleccionado</span>
                    <strong>{selectedRequestService.title}</strong>
                    <p>
                      {requestKindConfig.quantityUnit(Number(requestQuantity) || 1)}
                      {requestPreferredDate ? ` · ${requestKindConfig.dateLabel.toLowerCase()}: ${requestPreferredDate}` : ""}
                    </p>
                    {selectedRequestService.priceLabel ? (
                      <small>{selectedRequestService.priceLabel}</small>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : availabilityRules ? (
              <p className="detail-note">
                {availabilityRules.isClosed
                  ? availabilityRules.exceptionNote
                    ? `No hay agenda abierta para esta fecha. Nota del negocio: ${availabilityRules.exceptionNote}`
                    : "No hay agenda abierta para esta fecha. Prueba con otro día o revisa las fechas especiales."
                  : selectedBookingService
                    ? t(
                        {
                          es: "Agenda activa para {{service}}. Cada franja muestra el hueco restante para {{people}} persona{{suffix}}.",
                          en: "Live schedule for {{service}}. Each slot shows the remaining capacity for {{people}} guest{{suffix}}.",
                          eu: "{{service}} zerbitzurako agenda aktiboa. Txanda bakoitzak {{people}} pertsonarentzako geratzen den edukiera erakusten du."
                        },
                        {
                          service: selectedBookingService.title,
                          people,
                          suffix: people === "1" ? "" : "s"
                        }
                      )
                    : t(
                        {
                          es: "Cada franja muestra el hueco restante para {{people}} persona{{suffix}}.",
                          en: "Each slot shows the remaining capacity for {{people}} guest{{suffix}}.",
                          eu: "Txanda bakoitzak {{people}} pertsonarentzako geratzen den edukiera erakusten du."
                        },
                        {
                          people,
                          suffix: people === "1" ? "" : "s"
                        }
                      )}
              </p>
            ) : null}

            {!isRequestMode && isLoadingAvailability ? (
              <p className="detail-note">
                {t({ es: "Calculando huecos disponibles...", en: "Calculating available openings...", eu: "Hutsune erabilgarriak kalkulatzen..." })}
              </p>
            ) : !isRequestMode && availability.length ? (
              <div className="reservation-slot-grid">
                {availability.map((slot) => (
                  <button
                    key={slot.reservationDate}
                    type="button"
                    className={
                      selectedSlotDate === slot.reservationDate
                        ? `reservation-slot is-${slot.status} is-active`
                        : `reservation-slot is-${slot.status}`
                    }
                    onClick={() => setSelectedSlotDate(slot.reservationDate)}
                  >
                    <strong>{slot.label}</strong>
                    <span>
                      {slot.status === "full"
                        ? t({ es: "Completa · lista de espera", en: "Full · waitlist", eu: "Beteta · itxaron-zerrenda" })
                        : t({ es: "{{remaining}}/{{capacity}} plazas", en: "{{remaining}}/{{capacity}} seats", eu: "{{remaining}}/{{capacity}} plaza" }, { remaining: slot.remainingCapacity, capacity: slot.seatCapacity })}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="detail-note">
                {availabilityRules?.isClosed
                  ? t({ es: "Este dia no tiene agenda activa en el negocio. Prueba con otra fecha.", en: "This day has no active schedule for the business. Try another date.", eu: "Egun honek ez du agenda aktiborik negozio honetan. Saiatu beste data batekin." })
                  : t({ es: "No hay franjas disponibles para esta fecha. Prueba con otro dia o menos personas.", en: "There are no available slots for this date. Try another day or fewer guests.", eu: "Ez dago txanda erabilgarririk data honetarako. Saiatu beste egun batekin edo pertsona gutxiagorekin." })}
              </p>
            )}

            {!isRequestMode && selectedSlot ? (
              <div className="detail-flow-card detail-flow-card-soft">
                <span>{serviceMode.selectedSlotLabel}</span>
                <strong>{selectedSlot.label}</strong>
                <p>
                  {selectedSlot.status === "full"
                    ? serviceMode.fullSlotCopy
                    : serviceMode.selectedSlotCopy(selectedSlot)}
                </p>
                {availabilityRules?.serviceTitle ? (
                  <small>
                    {t({ es: "Servicio", en: "Service", eu: "Zerbitzua" })}: {availabilityRules.serviceTitle}
                    {availabilityRules.durationMinutes
                      ? ` · ${availabilityRules.durationMinutes} min`
                      : ""}
                  </small>
                ) : null}
              </div>
            ) : null}

            {!isRequestMode && availabilityError ? (
              <p className="status-message error">{availabilityError}</p>
            ) : null}
          </div>
          {isHydratingAuth ? (
            <p className="detail-aside-copy">{t({ es: "Verificando sesion antes de habilitar la reserva...", en: "Checking session before enabling booking...", eu: "Saioa egiaztatzen erreserba gaitu aurretik..." })}</p>
          ) : !auth ? (
            <>
              <p className="detail-aside-copy">
                {t({ es: "Para continuar debes iniciar sesion con una cuenta de usuario.", en: "To continue, sign in with a client account.", eu: "Jarraitzeko, hasi saioa erabiltzaile-kontu batekin." })}
              </p>
              <Link className="button" to="/login">
                {t({ es: "Ir a login", en: "Go to login", eu: "Joan saioa hastera" })}
              </Link>
            </>
          ) : auth.user.role === "business" ? (
            <p className="detail-aside-copy">
              {t({ es: "Las cuentas de negocio pueden consultar el catalogo, pero la reserva solo esta disponible para usuarios cliente.", en: "Business accounts can browse the catalogue, but booking is only available to client users.", eu: "Negozio-kontuek katalogoa ikusi dezakete, baina erreserba bezero-erabiltzaileentzat bakarrik dago erabilgarri." })}
            </p>
          ) : (
            <>
              <p className="detail-aside-copy">
                {t(
                  {
                    es: "Sesion iniciada como {{name}}. Completa los datos para continuar con este {{mode}}.",
                    en: "Signed in as {{name}}. Complete the details to continue with this {{mode}}.",
                    eu: "{{name}} gisa hasi duzu saioa. Osatu datuak {{mode}} honekin jarraitzeko."
                  },
                  {
                    name: auth.user.name,
                    mode: serviceMode.badge.toLowerCase()
                  }
                )}
              </p>

              {rebookMessage ? <p className="status-message success">{rebookMessage}</p> : null}

              {isRequestMode ? (
                <>
                  <form className="form" onSubmit={handleRequestSubmit}>
                    <button type="submit" disabled={isSubmittingRequest}>
                      {isSubmittingRequest ? t({ es: "Enviando...", en: "Sending...", eu: "Bidaltzen..." }) : serviceMode.primaryAction}
                    </button>
                  </form>

                  {requestMessage ? <p className="status-message success">{requestMessage}</p> : null}
                  {requestError ? <p className="status-message error">{requestError}</p> : null}
                </>
              ) : (
                <>
                  <form className="form" onSubmit={handleReservationSubmit}>
                    <button type="submit" disabled={isSubmittingReservation}>
                      {isSubmittingReservation
                        ? t({ es: "Guardando...", en: "Saving...", eu: "Gordetzen..." })
                        : serviceMode.primaryAction}
                    </button>
                  </form>

                  {selectedSlot?.status === "full" ? (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={handleJoinWaitlist}
                      disabled={isSubmittingWaitlist}
                    >
                      {isSubmittingWaitlist ? t({ es: "Apuntando...", en: "Joining...", eu: "Gehitzen..." }) : serviceMode.listWaitCopy}
                    </button>
                  ) : null}

                  {reservationMessage ? (
                    <p className="status-message success">{reservationMessage}</p>
                  ) : null}
                  {reservationError ? <p className="status-message error">{reservationError}</p> : null}
                  {waitlistMessage ? <p className="status-message success">{waitlistMessage}</p> : null}
                  {waitlistError ? <p className="status-message error">{waitlistError}</p> : null}
                </>
              )}

              <p className="detail-note">
                {t({ es: "Puedes revisar el estado desde la seccion de mi actividad.", en: "You can check the status from your activity page.", eu: "Egoera nire jarduera ataletik berrikusi dezakezu." })}
              </p>

              <div className="detail-save-box">
                <p className="eyebrow">{t({ es: "Guardar", en: "Save", eu: "Gorde" })}</p>
                <h4>{t({ es: "Guardar para mas tarde", en: "Save for later", eu: "Gorde geroago" })}</h4>

                {isLoadingSavedLists ? (
                  <p className="detail-note">{t({ es: "Cargando tus listas personales...", en: "Loading your personal lists...", eu: "Zure zerrenda pertsonalak kargatzen..." })}</p>
                ) : availableListsToSave.length > 0 ? (
                  <>
                    <select
                      value={selectedListId}
                      onChange={(event) => setSelectedListId(event.target.value)}
                    >
                      {availableListsToSave.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={handleSaveBusiness}
                      disabled={!selectedListId || isSavingBusiness}
                    >
                      {isSavingBusiness ? t({ es: "Guardando...", en: "Saving...", eu: "Gordetzen..." }) : t({ es: "Guardar negocio", en: "Save business", eu: "Gorde negozioa" })}
                    </button>
                  </>
                ) : savedLists.length > 0 ? (
                  <p className="detail-note">
                    {t({ es: "Este negocio ya esta guardado en todas tus listas disponibles.", en: "This business is already saved in all your available lists.", eu: "Negozio hau dagoeneko gorde duzu zure zerrenda erabilgarri guztietan." })}
                  </p>
                ) : (
                  <form className="form" onSubmit={handleCreateListAndSave}>
                    <input
                      type="text"
                      placeholder={t({ es: "Nombre de la primera lista", en: "Name of the first list", eu: "Lehen zerrendaren izena" })}
                      value={savedListName}
                      maxLength={100}
                      onChange={(event) => setSavedListName(event.target.value)}
                      required
                    />
                    <textarea
                      rows="3"
                      placeholder={t({ es: "Descripcion opcional", en: "Optional description", eu: "Aukerako deskribapena" })}
                      value={savedListDescription}
                      maxLength={300}
                      onChange={(event) => setSavedListDescription(event.target.value)}
                    />
                    <button type="submit" disabled={isCreatingList}>
                      {isCreatingList ? t({ es: "Creando...", en: "Creating...", eu: "Sortzen..." }) : t({ es: "Crear lista y guardar", en: "Create list and save", eu: "Sortu zerrenda eta gorde" })}
                    </button>
                  </form>
                )}

                {listsContainingBusiness.length > 0 ? (
                  <div className="detail-save-tags">
                    {listsContainingBusiness.map((list) => (
                      <span key={list.id} className="filter-tag">
                        {list.name}
                      </span>
                    ))}
                  </div>
                ) : null}

                {savedListMessage ? (
                  <p className="status-message success">{savedListMessage}</p>
                ) : null}
                {savedListError ? <p className="status-message error">{savedListError}</p> : null}
              </div>
            </>
          )}
        </aside>
      </div>

      <div className="review-layout" id="reviews">
        <article className="card review-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t({ es: "Comunidad", en: "Community", eu: "Komunitatea" })}</p>
              <h3>{t({ es: "Resenas del negocio", en: "Business reviews", eu: "Negozioaren iritziak" })}</h3>
            </div>
            <p className="section-copy">
              {t({ es: "Opiniones publicadas por usuarios con una reserva confirmada y ya pasada en este establecimiento.", en: "Reviews published by users with a confirmed and completed booking at this business.", eu: "Establezimendu honetan baieztatutako eta egindako erreserba duten erabiltzaileen iritziak." })}
            </p>
          </div>

          {business.reviews?.length ? (
            <div className="review-stack">
              {business.reviews.map((review) => (
                <article className="review-item" key={review.id}>
                  <div className="review-item-head">
                    <div className="review-author">
                      {review.author_avatar ? (
                        <img
                          className="review-avatar"
                          src={review.author_avatar}
                          alt={`Foto de ${review.author_name}`}
                        />
                      ) : (
                        <span className="review-avatar review-avatar-fallback">
                          {getBusinessInitials(review.author_name)}
                        </span>
                      )}
                      <div>
                        <strong>{review.author_name}</strong>
                        <span>
                          {review.author_city || t({ es: "Usuario de DonostiGo", en: "DonostiGo user", eu: "DonostiGo erabiltzailea" })} · {review.rating}/5
                        </span>
                      </div>
                    </div>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString(
                        language === "en" ? "en-GB" : language === "eu" ? "eu-ES" : "es-ES"
                      )}
                    </span>
                  </div>
                  <p>{review.comment}</p>
                  {review.business_response ? (
                    <div className="review-response">
                      <span>{t({ es: "Respuesta del negocio", en: "Business reply", eu: "Negozioaren erantzuna" })}</span>
                      <p>{review.business_response}</p>
                      {review.business_response_updated_at ? (
                        <small>
                          {t({ es: "Actualizada el", en: "Updated on", eu: "Eguneratua:" })}{" "}
                          {new Date(review.business_response_updated_at).toLocaleDateString(language === "en" ? "en-GB" : language === "eu" ? "eu-ES" : "es-ES")}
                        </small>
                      ) : null}
                    </div>
                  ) : null}

                  {canManageReviewResponses ? (
                    <form
                      className="review-response-form"
                      onSubmit={(event) => handleBusinessResponseSubmit(event, review.id)}
                    >
                      <textarea
                        rows="3"
                        placeholder={t({ es: "Responder como negocio", en: "Reply as business", eu: "Erantzun negozio gisa" })}
                        value={businessResponseDrafts[review.id] || ""}
                        maxLength={400}
                        onChange={(event) =>
                          setBusinessResponseDrafts((currentDrafts) => ({
                            ...currentDrafts,
                            [review.id]: event.target.value
                          }))
                        }
                        required
                      />
                      <button
                        type="submit"
                        className="button secondary"
                        disabled={isSubmittingBusinessResponseId === review.id}
                      >
                        {isSubmittingBusinessResponseId === review.id
                          ? t({ es: "Guardando...", en: "Saving...", eu: "Gordetzen..." })
                          : review.business_response
                            ? t({ es: "Actualizar respuesta", en: "Update reply", eu: "Eguneratu erantzuna" })
                            : t({ es: "Responder resena", en: "Reply to review", eu: "Erantzun iritziari" })}
                      </button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p>{t({ es: "Todavia no hay resenas publicadas para este negocio.", en: "There are no published reviews for this business yet.", eu: "Oraindik ez dago negozio honetarako iritzi argitaraturik." })}</p>
          )}
        </article>

        <aside className="card review-editor">
          <p className="eyebrow">{t({ es: "Tu opinion", en: "Your review", eu: "Zure iritzia" })}</p>
          <h3>{t({ es: "Publicar o actualizar resena", en: "Publish or update a review", eu: "Argitaratu edo eguneratu iritzia" })}</h3>
          <div className="detail-requirements">
            <div className="detail-requirement-item">
              <span>01</span>
              <strong>{t({ es: "Cuenta cliente", en: "Client account", eu: "Bezero kontua" })}</strong>
            </div>
            <div className="detail-requirement-item">
              <span>02</span>
              <strong>{t({ es: "Reserva confirmada", en: "Confirmed booking", eu: "Erreserba baieztatua" })}</strong>
            </div>
            <div className="detail-requirement-item">
              <span>03</span>
              <strong>{t({ es: "Fecha ya pasada", en: "Past date", eu: "Iraganeko data" })}</strong>
            </div>
          </div>

          {isHydratingAuth ? (
            <p className="detail-aside-copy">
              {t({ es: "Verificando sesion antes de habilitar la publicacion de resenas.", en: "Checking session before enabling review publishing.", eu: "Saioa egiaztatzen iritziak argitaratzea gaitu aurretik." })}
            </p>
          ) : !auth ? (
            <>
              <p className="detail-aside-copy">
                {t({ es: "Inicia sesion con una cuenta cliente para dejar una opinion.", en: "Sign in with a client account to leave a review.", eu: "Hasi saioa bezero-kontu batekin iritzia uzteko." })}
              </p>
              <Link className="button" to="/login">
                {t({ es: "Ir a login", en: "Go to login", eu: "Joan saioa hastera" })}
              </Link>
            </>
          ) : auth.user.role === "business" ? (
            <p className="detail-aside-copy">
              {t({ es: "Las cuentas de negocio no pueden publicar resenas en el catalogo.", en: "Business accounts cannot publish reviews in the catalogue.", eu: "Negozio-kontuek ezin dituzte katalogoan iritziak argitaratu." })}
            </p>
          ) : (
            <>
              <p className="detail-aside-copy">
                {t({ es: "Solo se aceptan resenas de usuarios con una reserva confirmada y ya pasada en este negocio. Si vuelves a enviar la resena, se actualiza la anterior.", en: "Only reviews from users with a confirmed and completed booking at this business are accepted. If you submit again, the previous review is updated.", eu: "Negozio honetan baieztatutako eta egindako erreserba duten erabiltzaileen iritziak bakarrik onartzen dira. Berriro bidaltzen baduzu, aurrekoa eguneratuko da." })}
              </p>

              <div className="review-helper-card">
                <div>
                  <span>{t({ es: "Valoracion seleccionada", en: "Selected rating", eu: "Hautatutako balorazioa" })}</span>
                  <strong>{reviewRating} / 5</strong>
                </div>
                <p>{reviewHelperCopy}</p>
              </div>

              <form className="form" onSubmit={handleReviewSubmit}>
                <select
                  value={reviewRating}
                  onChange={(event) => setReviewRating(event.target.value)}
                >
                  <option value="5">5 / 5</option>
                  <option value="4">4 / 5</option>
                  <option value="3">3 / 5</option>
                  <option value="2">2 / 5</option>
                  <option value="1">1 / 5</option>
                </select>
                <textarea
                  rows="5"
                  placeholder={t({ es: "Cuenta como ha sido la experiencia", en: "Describe how the experience went", eu: "Kontatu nolakoa izan den esperientzia" })}
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  minLength={12}
                  maxLength={500}
                  required
                />
                <div className="review-editor-meta">
                  <span>
                    {reviewCharacterCount < 12
                      ? t({ es: "Faltan {{count}} caracteres para el minimo", en: "{{count}} characters left to reach the minimum", eu: "{{count}} karaktere falta dira gutxienekora heltzeko" }, { count: 12 - reviewCharacterCount })
                      : t({ es: "Longitud minima completada", en: "Minimum length completed", eu: "Gutxieneko luzera beteta" })}
                  </span>
                  <span>{t({ es: "{{count}} caracteres disponibles", en: "{{count}} characters available", eu: "{{count}} karaktere erabilgarri" }, { count: reviewCharactersRemaining })}</span>
                </div>
                <button type="submit" disabled={isSubmittingReview}>
                  {isSubmittingReview ? t({ es: "Publicando...", en: "Publishing...", eu: "Argitaratzen..." }) : t({ es: "Guardar resena", en: "Save review", eu: "Gorde iritzia" })}
                </button>
              </form>

              {reviewMessage ? <p className="status-message success">{reviewMessage}</p> : null}
              {reviewError ? <p className="status-message error">{reviewError}</p> : null}
              {businessResponseMessage ? (
                <p className="status-message success">{businessResponseMessage}</p>
              ) : null}
              {businessResponseError ? (
                <p className="status-message error">{businessResponseError}</p>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
