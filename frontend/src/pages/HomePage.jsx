import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import donostiaHero from "../assets/donostia-hero.jpg";
import donostigoScene from "../assets/donostigo-scene.svg";
import { pick, useI18n } from "../i18n/I18nProvider.jsx";
import {
  fetchBusinesses,
  fetchBusinessAvailability,
  fetchMyBusinessServiceRequests,
  fetchMyReservations,
  fetchMyWaitlistEntries,
  fetchPublicSavedLists,
  fetchRecommendedBusinesses,
  fetchSavedLists
} from "../services/api.js";
import { buildUserActivityItems, formatActivityDate } from "../utils/activityFeed.js";
import {
  getBusinessCoverImage,
  getBusinessInitials,
  getBusinessThemeStyle
} from "../utils/businessTheme.js";
import { getServiceModeConfig } from "../utils/serviceMode.js";

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const CATEGORY_ITEMS = [
  {
    number: "01",
    title: { es: "Restauracion", en: "Food & drink", eu: "Jatetxeak eta edariak" },
    description: {
      es: "Bares, cafeterias y otros establecimientos vinculados al sector gastronomico.",
      en: "Bars, cafés and other places connected to the food scene.",
      eu: "Tabernak, kafetegiak eta gastronomiari lotutako beste toki batzuk."
    }
  },
  {
    number: "02",
    title: { es: "Cafeterias y brunch", en: "Brunch & cafés", eu: "Brunch eta kafetegiak" },
    description: {
      es: "Locales de desayuno, brunch y cafe con reservas para franjas concretas.",
      en: "Breakfast, brunch and coffee spots with time-based bookings.",
      eu: "Gosari, brunch eta kafearen inguruko tokiak, txanden araberako erreserbekin."
    }
  },
  {
    number: "03",
    title: { es: "Deporte", en: "Sports", eu: "Kirola" },
    description: {
      es: "Escuelas, actividades y servicios relacionados con el deporte.",
      en: "Schools, activities and services connected to sport.",
      eu: "Kirolarekin lotutako eskolak, jarduerak eta zerbitzuak."
    }
  },
  {
    number: "04",
    title: { es: "Bienestar y estetica", en: "Wellness & beauty", eu: "Ongizatea eta edertasuna" },
    description: {
      es: "Centros orientados al cuidado personal, tratamientos y bienestar.",
      en: "Studios and centres focused on self-care, treatments and wellness.",
      eu: "Norbere zaintza, tratamendu eta ongizatera bideratutako zentroak."
    }
  },
  {
    number: "05",
    title: { es: "Ocio", en: "Leisure", eu: "Aisia" },
    description: {
      es: "Opciones de tiempo libre agrupadas en una misma plataforma.",
      en: "Leisure options grouped in one platform.",
      eu: "Aisialdiko aukerak plataforma berean bilduta."
    }
  },
  {
    number: "06",
    title: { es: "Turismo y visitas guiadas", en: "Tours & guided visits", eu: "Turismoa eta bisita gidatuak" },
    description: {
      es: "Rutas y experiencias pensadas para visitantes y usuarios locales.",
      en: "Routes and experiences designed for visitors and locals alike.",
      eu: "Bisitarientzat eta tokiko erabiltzaileentzat pentsatutako ibilbide eta esperientziak."
    }
  },
  {
    number: "07",
    title: { es: "Cultura y talleres", en: "Culture & workshops", eu: "Kultura eta tailerrak" },
    description: {
      es: "Actividades creativas, manuales y culturales con plazas reservables.",
      en: "Creative, practical and cultural activities with reservable spots.",
      eu: "Plaza erreserbatuak dituzten jarduera sortzaile, praktiko eta kulturalak."
    }
  },
  {
    number: "08",
    title: { es: "Formacion y clases", en: "Learning & classes", eu: "Prestakuntza eta eskolak" },
    description: {
      es: "Academias, cursos y espacios de aprendizaje con reserva de plaza.",
      en: "Academies, courses and learning spaces with bookable capacity.",
      eu: "Plaza erreserbatuarekin funtzionatzen duten akademia, ikastaro eta ikasketa guneak."
    }
  }
];

const FEATURE_ITEMS = [
  {
    eyebrow: { es: "Descubrimiento", en: "Discovery", eu: "Aurkikuntza" },
    title: { es: "Menos ruido, mejor criterio", en: "Less noise, better judgement", eu: "Zarata gutxiago, irizpide hobea" },
    description: {
      es: "El catálogo no es solo una lista: compara, filtra y entra rápido donde de verdad merece la pena.",
      en: "The catalogue is not just a list: compare, filter and move straight to the places worth your time.",
      eu: "Katalogoa ez da zerrenda hutsa: alderatu, iragazi eta benetan merezi duten tokietara joan zuzenean."
    }
  },
  {
    eyebrow: { es: "Actividad", en: "Activity", eu: "Jarduera" },
    title: { es: "Cada negocio tiene su lógica", en: "Each business has its own flow", eu: "Negozio bakoitzak bere logika du" },
    description: {
      es: "Reservas, plazas, solicitudes y bonos conviven sin convertir la experiencia en un caos.",
      en: "Bookings, sessions, requests and vouchers live together without turning the product into a mess.",
      eu: "Erreserbak, plazak, eskaerak eta bonuak elkarrekin bizi dira esperientzia kaos bihurtu gabe."
    }
  },
  {
    eyebrow: { es: "Curación", en: "Curation", eu: "Kurazioa" },
    title: { es: "Guardar también cuenta", en: "Saving matters too", eu: "Gordetzeak ere balioa du" },
    description: {
      es: "Las listas y guías hacen que la app siga siendo útil incluso cuando todavía no vas a reservar nada.",
      en: "Lists and guides keep the app useful even when you are not ready to book anything yet.",
      eu: "Zerrenda eta gidek aplikazioa erabilgarri mantentzen dute oraindik ezer erreserbatzeko prest ez zaudenean ere."
    }
  }
];

const PROOF_ITEMS = [
  {
    number: "01",
    title: { es: "Explorar", en: "Explore", eu: "Arakatu" },
    description: {
      es: "Catálogo con filtros, comparador y señales visuales claras.",
      en: "A catalogue with filters, comparison and clear visual signals.",
      eu: "Iragazkiak, konparatzailea eta seinale argiak dituen katalogoa."
    }
  },
  {
    number: "02",
    title: { es: "Elegir", en: "Choose", eu: "Aukeratu" },
    description: {
      es: "Fichas con oferta, disponibilidad, mapas y contexto útil.",
      en: "Business pages with offer, availability, maps and useful context.",
      eu: "Eskaintza, erabilgarritasuna, mapak eta testuinguru erabilgarria duten fitxak."
    }
  },
  {
    number: "03",
    title: { es: "Guardar y gestionar", en: "Save and manage", eu: "Gorde eta kudeatu" },
    description: {
      es: "Actividad unificada con reservas, solicitudes, listas y siguientes pasos.",
      en: "Unified activity with bookings, requests, lists and next steps.",
      eu: "Erreserbak, eskaerak, zerrendak eta hurrengo pausoak bateratzen dituen jarduera."
    }
  }
];

export default function HomePage({ auth }) {
  const { language } = useI18n();
  const [featuredGuides, setFeaturedGuides] = useState([]);
  const [recommendedBusinesses, setRecommendedBusinesses] = useState([]);
  const [activityItems, setActivityItems] = useState([]);
  const [liveSpots, setLiveSpots] = useState([]);

  useEffect(() => {
    fetchPublicSavedLists()
      .then((data) => {
        setFeaturedGuides(data.slice(0, 3));
      })
      .catch(() => {
        setFeaturedGuides([]);
      });
  }, []);

  useEffect(() => {
    if (auth?.user.role !== "user") {
      setRecommendedBusinesses([]);
      return;
    }

    fetchRecommendedBusinesses()
      .then((data) => {
        setRecommendedBusinesses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setRecommendedBusinesses([]);
      });
  }, [auth]);

  useEffect(() => {
    if (auth?.user.role !== "user") {
      setActivityItems([]);
      return;
    }

    Promise.all([
      fetchMyReservations(),
      fetchMyWaitlistEntries(),
      fetchMyBusinessServiceRequests(),
      fetchSavedLists()
    ])
      .then(([reservations, waitlistEntries, serviceRequests, savedLists]) => {
        setActivityItems(
          buildUserActivityItems(
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
      .catch(() => {
        setActivityItems([]);
      });
  }, [auth, language]);

  useEffect(() => {
    const dateKey = getTodayDateKey();

    fetchBusinesses()
      .then(async (businesses) => {
        const candidates = (Array.isArray(businesses) ? businesses : [])
          .filter((business) => business.serviceMode !== "request")
          .slice(0, 6);

        const availabilityResponses = await Promise.all(
          candidates.map(async (business) => {
            try {
              const availability = await fetchBusinessAvailability(business.id, {
                date: dateKey,
                people: 2
              });
              const nextSlot = (availability.slots || []).find(
                (slot) => slot.status === "available" || slot.status === "limited"
              );

              if (!nextSlot) {
                return null;
              }

              return {
                business,
                nextSlot,
                rules: availability.rules
              };
            } catch (_error) {
              return null;
            }
          })
        );

        setLiveSpots(availabilityResponses.filter(Boolean).slice(0, 3));
      })
      .catch(() => {
        setLiveSpots([]);
      });
  }, []);

  const featuredGuideBusinessCount = useMemo(
    () =>
      featuredGuides.reduce(
        (total, guide) => total + Number(guide.business_count || 0),
        0
      ),
    [featuredGuides]
  );

  return (
    <div className="home-page">
      <section className="hero hero-home">
        <div className="hero-copy">
          <p className="eyebrow">{pick({ es: "DonostiGo · Donostia-San Sebastian", en: "DonostiGo · Donostia-San Sebastian", eu: "DonostiGo · Donostia-San Sebastian" }, language)}</p>
          <h2>{pick({ es: "Planes y negocios locales, sin ruido.", en: "Local plans and businesses, without the noise.", eu: "Tokiko planak eta negozioak, zaratarik gabe." }, language)}</h2>
          <p className="hero-text">
            {pick(
              {
                es: "Explora sitios con criterio, guarda lo que te interesa y gestiona reservas, solicitudes o bonos sin ir saltando entre pantallas inconexas.",
                en: "Explore with more context, save what matters to you and manage bookings, requests or vouchers without jumping across disconnected screens.",
                eu: "Arakatu testuinguru gehiagorekin, gorde interesatzen zaizuna eta kudeatu erreserbak, eskaerak edo bonuak pantaila nahasietan galdu gabe."
              },
              language
            )}
          </p>

          <div className="hero-actions">
            <Link className="button" to="/businesses">
              {pick({ es: "Explorar negocios", en: "Explore businesses", eu: "Negozioak arakatu" }, language)}
            </Link>
            <Link className="button secondary" to="/register">
              {pick({ es: "Crear cuenta", en: "Create account", eu: "Kontua sortu" }, language)}
            </Link>
            <Link className="button secondary" to="/guides">
              {pick({ es: "Ver guias", en: "View guides", eu: "Gidak ikusi" }, language)}
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-visual card hero-photo-card">
            <img
              className="hero-photo"
              src={donostiaHero}
              alt={pick(
                {
                  es: "Vista panoramica de Donostia-San Sebastian",
                  en: "Panoramic view of Donostia-San Sebastian",
                  eu: "Donostia-San Sebastianen ikuspegi panoramikoa"
                },
                language
              )}
            />
            <div className="hero-visual-badge">
              <span>{pick({ es: "Donostia-San Sebastian", en: "Donostia-San Sebastian", eu: "Donostia-San Sebastian" }, language)}</span>
              <strong>{pick({ es: "Una capa local para descubrir, guardar y volver", en: "A local layer to discover, save and come back", eu: "Ezagutu, gorde eta berriro itzultzeko tokiko geruza" }, language)}</strong>
            </div>
          </div>

          <div className="hero-local-card">
            <img
              src={donostigoScene}
              alt={pick(
                {
                  es: "Ilustracion conceptual de DonostiGo",
                  en: "Concept illustration of DonostiGo",
                  eu: "DonostiGoren ilustrazio kontzeptuala"
                },
                language
              )}
            />
            <div className="hero-local-copy">
              <span>{pick({ es: "Enfoque", en: "Approach", eu: "Ikuspegia" }, language)}</span>
              <strong>{pick({ es: "Negocios locales con actividad real", en: "Local businesses with real activity", eu: "Benetako jarduera duten tokiko negozioak" }, language)}</strong>
              <p>
                {pick(
                  {
                    es: "No todo funciona igual: algunos negocios reservan, otros abren plazas y otros trabajan por solicitud.",
                    en: "Not everything works the same way: some businesses take bookings, others offer session spots and others work through requests.",
                    eu: "Ez da dena berdin funtzionatzen: batzuek erreserbak hartzen dituzte, beste batzuek plazak irekitzen dituzte eta beste batzuek eskaeren bidez lan egiten dute."
                  },
                  language
                )}
              </p>
            </div>
          </div>

          <div className="hero-metrics">
            <div className="hero-metric">
              <strong>{pick({ es: "Actividad unificada", en: "Unified activity", eu: "Jarduera bateratua" }, language)}</strong>
              <span>{pick({ es: "Reservas, solicitudes, espera y bonos en un mismo sitio", en: "Bookings, requests, waitlist and vouchers in one place", eu: "Erreserbak, eskaerak, itxaron-zerrenda eta bonuak toki berean" }, language)}</span>
            </div>
            <div className="hero-metric">
              <strong>{pick({ es: "Curación personal", en: "Personal curation", eu: "Kurazio pertsonala" }, language)}</strong>
              <span>{pick({ es: "Guardados, listas y guías compartibles para descubrir mejor", en: "Saved places, lists and shareable guides to discover better", eu: "Gordetakoak, zerrendak eta partekatzeko gidak hobeto aurkitzeko" }, language)}</span>
            </div>
            <div className="hero-metric">
              <strong>{pick({ es: "Panel para negocio", en: "Business workspace", eu: "Negozioaren panela" }, language)}</strong>
              <span>{pick({ es: "Backoffice con horarios, oferta, alertas e identidad propia", en: "Backoffice with schedules, offer, alerts and identity", eu: "Ordutegi, eskaintza, alerta eta nortasun propioa dituen backofficea" }, language)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-strip">
        {FEATURE_ITEMS.map((item) => (
          <article key={item.title.es} className="card feature-card">
            <p className="eyebrow">{pick(item.eyebrow, language)}</p>
            <h3>{pick(item.title, language)}</h3>
            <p>{pick(item.description, language)}</p>
          </article>
        ))}
      </section>

      <section className="card home-categories">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{pick({ es: "Categorias", en: "Categories", eu: "Kategoriak" }, language)}</p>
            <h3>{pick({ es: "Qué puedes encontrar", en: "What you can find", eu: "Zer aurki dezakezun" }, language)}</h3>
          </div>
          <p className="section-copy">
            {pick(
              {
                es: "Una base amplia para que la plataforma no se limite a bares o reservas simples.",
                en: "A broad base so the platform does not stop at bars or simple bookings.",
                eu: "Oinarri zabala, plataforma taberna edo erreserba sinpleetara mugatu ez dadin."
              },
              language
            )}
          </p>
        </div>

        <div className="category-grid">
          {CATEGORY_ITEMS.map((item) => (
            <article key={item.number} className="category-card">
              <span>{item.number}</span>
              <h4>{pick(item.title, language)}</h4>
              <p>{pick(item.description, language)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card home-proof">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{pick({ es: "Experiencia", en: "Experience", eu: "Esperientzia" }, language)}</p>
            <h3>{pick({ es: "Cómo se mueve la app", en: "How the app flows", eu: "Nola mugitzen den aplikazioa" }, language)}</h3>
          </div>
          <p className="section-copy">
            {pick({ es: "Descubrir, decidir, guardar y volver a tu actividad sin perder el hilo.", en: "Discover, decide, save and get back to your activity without losing the thread.", eu: "Aurkitu, erabaki, gorde eta zure jarduerara itzuli haria galdu gabe." }, language)}
          </p>
        </div>

        <div className="proof-grid">
          {PROOF_ITEMS.map((item) => (
            <article key={item.number} className="proof-card">
              <span className="proof-step">{item.number}</span>
              <h4>{pick(item.title, language)}</h4>
              <p>{pick(item.description, language)}</p>
            </article>
          ))}
        </div>
      </section>

      {liveSpots.length > 0 ? (
        <section className="card home-live-spots">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{pick({ es: "Ahora mismo", en: "Right now", eu: "Orain bertan" }, language)}</p>
              <h3>{pick({ es: "Planes para hoy", en: "Plans for today", eu: "Gaurko planak" }, language)}</h3>
            </div>
            <p className="section-copy">
              {pick({ es: "Disponibilidad real del día para descubrir opciones sin dar demasiadas vueltas.", en: "Live same-day availability to discover options without too much scrolling.", eu: "Egun bereko erabilgarritasun erreala aukerak buelta gehiegirik eman gabe aurkitzeko." }, language)}
            </p>
          </div>

          <div className="home-activity-grid">
            {liveSpots.map(({ business, nextSlot, rules }) => (
              <article
                key={business.id}
                className="home-activity-card home-activity-card-accent"
                style={getBusinessThemeStyle(business)}
              >
                <p className="eyebrow">{getServiceModeConfig(business.serviceMode, language).badge}</p>
                <h4>{business.name}</h4>
                <p>
                  {pick({ es: "Próximo hueco", en: "Next slot", eu: "Hurrengo tartea" }, language)}:{" "}
                  {formatActivityDate(nextSlot.reservationDate, language)}
                  {rules?.serviceTitle ? ` · ${rules.serviceTitle}` : ""}
                </p>
                <div className="recommendation-meta">
                  <span>{business.category || pick({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" }, language)}</span>
                  <span>
                    {nextSlot.remainingCapacity}/{nextSlot.seatCapacity}{" "}
                    {pick({ es: "plazas libres", en: "spots left", eu: "plaza libre" }, language)}
                  </span>
                </div>
                <Link className="button secondary" to={`/businesses/${business.id}`}>
                  {pick({ es: "Ver hueco", en: "View slot", eu: "Tartea ikusi" }, language)}
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {auth?.user.role === "user" && activityItems.length > 0 ? (
        <section className="card home-activity-feed">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{pick({ es: "Actividad útil", en: "Useful activity", eu: "Jarduera erabilgarria" }, language)}</p>
              <h3>{pick({ es: "Lo siguiente que importa", en: "What matters next", eu: "Hurrena axola duena" }, language)}</h3>
            </div>
            <p className="section-copy">
              {pick({ es: "La home también te devuelve a lo que tienes pendiente sin obligarte a rebuscar.", en: "Home also takes you back to what is pending without making you hunt for it.", eu: "Hasierak zain duzunera itzultzen zaitu, gehiegi bilatu behar izan gabe." }, language)}
            </p>
          </div>

          <div className="home-activity-grid">
            {activityItems.map((item) => (
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
      ) : null}

      {auth?.user.role === "user" && recommendedBusinesses.length > 0 ? (
        <section className="card home-recommendations">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{pick({ es: "Para ti", en: "For you", eu: "Zuretzat" }, language)}</p>
              <h3>{pick({ es: "Recomendaciones para ti", en: "Recommendations for you", eu: "Zuretzako gomendioak" }, language)}</h3>
            </div>
            <p className="section-copy">
              {pick({ es: "Una selección basada en tu actividad para seguir descubriendo sin empezar siempre desde cero.", en: "A selection based on your activity so you can keep discovering without always starting from scratch.", eu: "Zure jardueran oinarritutako aukeraketa bat, beti hutsetik hasi gabe aurkitzen jarraitzeko." }, language)}
            </p>
          </div>

          <div className="recommendation-grid">
            {recommendedBusinesses.map((business) => (
              <article
                key={business.id}
                className="card recommendation-card recommendation-card-branded"
                style={getBusinessThemeStyle(business)}
              >
                <div className="recommendation-card-media">
                  <img
                    className="recommendation-card-photo"
                    src={getBusinessCoverImage(business)}
                    alt={`${pick({ es: "Imagen representativa de", en: "Representative image of", eu: "Honen irudi adierazgarria" }, language)} ${business.name}`}
                  />
                  <span className="recommendation-card-initials">
                    {getBusinessInitials(business.name)}
                  </span>
                </div>
                <div className="saved-list-head">
                  <strong>{business.name}</strong>
                  <span className="filter-tag">
                    {business.matchesProfile
                      ? pick({ es: "Afin a tu perfil", en: "Fits your profile", eu: "Zure profilarekin bat" }, language)
                      : pick({ es: "Descubrimiento", en: "Discovery", eu: "Aurkikuntza" }, language)}
                  </span>
                </div>
                <p>{business.heroClaim || business.description}</p>
                <div className="recommendation-meta">
                  <span>{business.category || pick({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" }, language)}</span>
                  <span>{getServiceModeConfig(business.serviceMode, language).badge}</span>
                  <span>
                    {Number(business.average_rating || 0).toFixed(1)} · {business.review_count}{" "}
                    {pick({ es: "reseñas", en: "reviews", eu: "iritzi" }, language)}
                  </span>
                </div>
                <Link className="button secondary" to={`/businesses/${business.id}`}>
                  {pick({ es: "Ver detalle", en: "View details", eu: "Xehetasuna ikusi" }, language)}
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {featuredGuides.length > 0 ? (
        <section className="card home-guides">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{pick({ es: "Comunidad", en: "Community", eu: "Komunitatea" }, language)}</p>
              <h3>{pick({ es: "Guías públicas destacadas", en: "Featured public guides", eu: "Gida publiko nabarmenduak" }, language)}</h3>
            </div>
            <p className="section-copy">
              {pick({ es: "También puedes descubrir sitios desde la curación de otros usuarios, no solo desde el catálogo.", en: "You can also discover places through other users' curation, not only through the catalogue.", eu: "Beste erabiltzaileen kuraziotik ere aurki ditzakezu tokiak, ez katalogotik bakarrik." }, language)}
            </p>
          </div>

          <div className="saved-overview">
            <div>
              <strong>{featuredGuides.length}</strong>
              <span>{pick({ es: "guias visibles ahora mismo", en: "guides visible right now", eu: "orain ikusgai dauden gidak" }, language)}</span>
            </div>
            <div>
              <strong>{featuredGuideBusinessCount}</strong>
              <span>{pick({ es: "negocios reunidos entre las guias destacadas", en: "businesses gathered across featured guides", eu: "gida nabarmenduetan bildutako negozioak" }, language)}</span>
            </div>
            <div>
              <strong>{new Set(featuredGuides.map((guide) => guide.author_name)).size}</strong>
              <span>{pick({ es: "autores compartiendo planes", en: "authors sharing plans", eu: "planak partekatzen dituzten egileak" }, language)}</span>
            </div>
          </div>

          <div className="saved-guide-grid">
            {featuredGuides.map((guide) => (
              <article key={guide.id} className="saved-guide-card">
                <div className="saved-list-head">
                  <strong>{guide.name}</strong>
                  <span className="filter-tag">
                    {guide.business_count} {pick({ es: "sitios", en: "places", eu: "toki" }, language)}
                  </span>
                </div>
                <p>{guide.description || pick({ es: "Guia publica curada por un usuario de DonostiGo.", en: "Public guide curated by a DonostiGo user.", eu: "DonostiGo erabiltzaile batek kuratutako gida publikoa." }, language)}</p>
                <div className="saved-guide-preview">
                  {(guide.business_preview || []).map((business) => (
                    <div key={business.id} className="saved-guide-preview-item">
                      <strong>{business.name}</strong>
                      <span>{business.category || pick({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" }, language)}</span>
                    </div>
                  ))}
                </div>
                <div className="saved-list-meta">
                  <span>{pick({ es: "Por", en: "By", eu: "Egilea" }, language)} {guide.author_name}</span>
                  <Link className="button secondary" to={`/guides/${guide.shareSlug}`}>
                    {pick({ es: "Ver guia", en: "View guide", eu: "Gida ikusi" }, language)}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="home-demo-grid">
        <article className="card home-demo-card">
          <p className="eyebrow">{pick({ es: "Prueba guiada", en: "Guided demo", eu: "Gidatutako demoa" }, language)}</p>
          <h3>{pick({ es: "Recorrido recomendado", en: "Recommended walkthrough", eu: "Gomendatutako ibilbidea" }, language)}</h3>
          <p>
            {pick({ es: "La forma más clara de entender DonostiGo es abrir el catálogo, entrar en una ficha, crear una acción y luego seguirla desde tu actividad.", en: "The clearest way to understand DonostiGo is to open the catalogue, enter a business page, create an action and then follow it from your activity.", eu: "DonostiGo ulertzeko modurik argiena katalogoa irekitzea, fitxa batean sartzea, ekintza bat sortzea eta gero zure jardueratik jarraitzea da." }, language)}
          </p>
          <div className="home-demo-steps">
            <div>
              <span>01</span>
              <strong>{pick({ es: "Explorar negocios", en: "Explore businesses", eu: "Negozioak arakatu" }, language)}</strong>
            </div>
            <div>
              <span>02</span>
              <strong>{pick({ es: "Reservar como cliente", en: "Book as a client", eu: "Bezero gisa erreserbatu" }, language)}</strong>
            </div>
            <div>
              <span>03</span>
              <strong>{pick({ es: "Gestionar como negocio", en: "Manage as a business", eu: "Negozio gisa kudeatu" }, language)}</strong>
            </div>
          </div>
        </article>

        <article className="card home-demo-card home-demo-card-accent">
          <p className="eyebrow">{pick({ es: "Accesos de prueba", en: "Demo access", eu: "Demo sarbideak" }, language)}</p>
          <h3>{pick({ es: "Cuentas listas para demostrar el flujo", en: "Accounts ready to show the flow", eu: "Fluxua erakusteko prest dauden kontuak" }, language)}</h3>
          <div className="home-demo-access">
            <div>
              <strong>{pick({ es: "Cliente", en: "Client", eu: "Bezeroa" }, language)}</strong>
              <span>ane@donostigo.local</span>
            </div>
            <div>
              <strong>{pick({ es: "Negocio", en: "Business", eu: "Negozioa" }, language)}</strong>
              <span>surf@donostigo.local</span>
            </div>
          </div>
          <p>
            {pick({ es: "Ambas utilizan la contrasena demo comun:", en: "Both use the shared demo password:", eu: "Biek demo pasahitz bera erabiltzen dute:" }, language)} <strong>Demo1234</strong>.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/login">
              {pick({ es: "Ir a login", en: "Go to login", eu: "Saioa hastera joan" }, language)}
            </Link>
            <Link className="button secondary" to="/businesses">
              {pick({ es: "Abrir catalogo", en: "Open catalogue", eu: "Katalogoa ireki" }, language)}
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
