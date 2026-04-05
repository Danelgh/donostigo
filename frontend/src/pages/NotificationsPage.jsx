import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { pick, useI18n } from "../i18n/I18nProvider.jsx";
import {
  fetchMyBusinessServiceRequests,
  fetchMyReservations,
  fetchMyWaitlistEntries,
  fetchSavedLists
} from "../services/api.js";
import { buildUserNotificationFeed } from "../utils/activityFeed.js";

function groupNotificationsBySection(items) {
  const groups = new Map();

  items.forEach((item) => {
    const currentGroup = groups.get(item.section) || [];
    currentGroup.push(item);
    groups.set(item.section, currentGroup);
  });

  return Array.from(groups.entries());
}

function getSectionLabels(language) {
  return {
    actividad: pick(
      { es: "Actividad inmediata", en: "Immediate activity", eu: "Berehalako jarduera" },
      language
    ),
    solicitudes: pick(
      { es: "Solicitudes y propuestas", en: "Requests and proposals", eu: "Eskaerak eta proposamenak" },
      language
    ),
    espera: pick(
      { es: "Lista de espera", en: "Waitlist", eu: "Itxaron-zerrenda" },
      language
    ),
    bonos: pick(
      { es: "Bonos y codigos", en: "Vouchers and codes", eu: "Bonuak eta kodeak" },
      language
    ),
    curacion: pick(
      { es: "Guardados y guias", en: "Saved items and guides", eu: "Gordetakoak eta gidak" },
      language
    )
  };
}

export default function NotificationsPage({ auth, isHydratingAuth }) {
  const { language } = useI18n();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(auth));
  const [errorMessage, setErrorMessage] = useState("");

  const sectionLabels = useMemo(() => getSectionLabels(language), [language]);

  useEffect(() => {
    if (!auth || auth.user.role !== "user") {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    Promise.all([
      fetchMyReservations(),
      fetchMyWaitlistEntries(),
      fetchMyBusinessServiceRequests(),
      fetchSavedLists()
    ])
      .then(([reservations, waitlistEntries, serviceRequests, savedLists]) => {
        setNotifications(
          buildUserNotificationFeed(
            {
              reservations,
              waitlistEntries,
              serviceRequests: serviceRequests.requests || serviceRequests,
              savedLists
            },
            language
          )
        );
      })
      .catch((error) => {
        setNotifications([]);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [auth, language]);

  const notificationGroups = useMemo(
    () => groupNotificationsBySection(notifications),
    [notifications]
  );

  if (isHydratingAuth) {
    return <p>{pick({ es: "Preparando avisos...", en: "Preparing updates...", eu: "Abisuak prestatzen..." }, language)}</p>;
  }

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  if (auth.user.role !== "user") {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="home-page">
      <section className="card listing-hero">
        <div>
          <p className="eyebrow">{pick({ es: "Avisos", en: "Updates", eu: "Abisuak" }, language)}</p>
          <h2>{pick({ es: "Centro de actividad para cliente", en: "Client activity centre", eu: "Bezeroaren jarduera-zentroa" }, language)}</h2>
          <p className="section-copy">
            {pick({
              es: "Aqui reunimos lo que requiere respuesta, seguimiento o simplemente contexto util para que no tengas que ir adivinando que revisar despues.",
              en: "This view gathers what needs a response, follow-up or simply useful context so you do not have to guess what to check next.",
              eu: "Hemen erantzuna, jarraipena edo testuinguru erabilgarria behar duen guztia biltzen dugu, gero zer berrikusi asmatu behar ez izateko."
            }, language)}
          </p>
        </div>
        <div className="listing-summary">
          <div>
            <strong>{notifications.length}</strong>
            <span>{pick({ es: "avisos utiles ahora mismo", en: "useful updates right now", eu: "orain erabilgarri dauden abisuak" }, language)}</span>
          </div>
          <div>
            <strong>{notificationGroups.length}</strong>
            <span>{pick({ es: "bloques de actividad detectados", en: "activity groups detected", eu: "atzemandako jarduera multzoak" }, language)}</span>
          </div>
        </div>
      </section>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
      {isLoading ? <p>{pick({ es: "Cargando avisos...", en: "Loading updates...", eu: "Abisuak kargatzen..." }, language)}</p> : null}

      {!isLoading && notifications.length === 0 ? (
        <section className="card business-empty-state">
          <strong>{pick({ es: "Ahora mismo no hay avisos urgentes", en: "There are no urgent updates right now", eu: "Une honetan ez dago premiazko abisurik" }, language)}</strong>
          <p>
            {pick({
              es: "Eso no significa que la app este vacia. Puedes aprovechar para revisar negocios, guardar sitios o montar una guia nueva.",
              en: "That does not mean the app is empty. You can use this moment to explore businesses, save places or build a new guide.",
              eu: "Horrek ez du esan nahi aplikazioa hutsik dagoenik. Negozioak berrikusi, tokiak gorde edo gida berri bat sor dezakezu."
            }, language)}
          </p>
          <div className="hero-actions">
            <Link className="button secondary" to="/businesses">
              {pick({ es: "Explorar negocios", en: "Explore businesses", eu: "Negozioak esploratu" }, language)}
            </Link>
            <Link className="button tertiary" to="/saved-lists">
              {pick({ es: "Abrir guardados", en: "Open saved lists", eu: "Gordetakoak ireki" }, language)}
            </Link>
          </div>
        </section>
      ) : null}

      {notificationGroups.map(([section, items]) => (
        <section key={section} className="card home-activity-feed">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{pick({ es: "Actividad", en: "Activity", eu: "Jarduera" }, language)}</p>
              <h3>{sectionLabels[section] || pick({ es: "Avisos", en: "Updates", eu: "Abisuak" }, language)}</h3>
            </div>
            <p className="section-copy">
              {pick({
                es: "Acciones o senales que te ayudan a seguir el hilo sin perder tiempo navegando a ciegas.",
                en: "Actions and signals that help you stay on top of things without navigating blindly.",
                eu: "Hariari eusten laguntzen dizuten ekintzak eta seinaleak, itsu-itsuan nabigatu gabe."
              }, language)}
            </p>
          </div>

          <div className="home-activity-grid">
            {items.map((item) => (
              <article
                key={item.id}
                className={`home-activity-card home-activity-card-${item.tone}`}
              >
                <p className="eyebrow">{item.eyebrow}</p>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <Link className="button secondary" to={item.href}>
                  {item.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
