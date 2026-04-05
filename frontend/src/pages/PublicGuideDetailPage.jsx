import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatLocaleDate, pick, useI18n } from "../i18n/I18nProvider.jsx";
import { clonePublicSavedList, fetchPublicSavedListBySlug } from "../services/api.js";
import { getServiceModeConfig } from "../utils/serviceMode.js";

function buildGuideUrl(slug) {
  if (!slug) {
    return "";
  }

  if (typeof window === "undefined") {
    return `/guides/${slug}`;
  }

  return `${window.location.origin}/guides/${slug}`;
}

export default function PublicGuideDetailPage({ auth }) {
  const { language } = useI18n();
  const { slug } = useParams();
  const [guide, setGuide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    if (!slug) {
      setGuide(null);
      setErrorMessage(pick({ es: "La guia indicada no es valida", en: "The requested guide is not valid", eu: "Eskatutako gida ez da baliozkoa" }, language));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    fetchPublicSavedListBySlug(slug)
      .then((data) => {
        setGuide(data);
      })
      .catch((error) => {
        setGuide(null);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [language, slug]);

  async function handleCopyGuideUrl() {
    const shareUrl = buildGuideUrl(guide?.shareSlug);

    if (!shareUrl) {
      setFeedbackMessage(pick({ es: "La guia aun no tiene un enlace publico valido", en: "This guide does not have a valid public link yet", eu: "Gida honek ez du oraindik esteka publiko baliodunik" }, language));
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setFeedbackMessage(pick({ es: "Enlace copiado al portapapeles", en: "Link copied to clipboard", eu: "Esteka arbelean kopiatu da" }, language));
    } catch (_error) {
      setFeedbackMessage(pick({ es: "No se ha podido copiar el enlace automaticamente", en: "The link could not be copied automatically", eu: "Ezin izan da esteka automatikoki kopiatu" }, language));
    }
  }

  async function handleCloneGuide() {
    if (!slug) {
      return;
    }

    setIsCloning(true);
    setFeedbackMessage("");

    try {
      const response = await clonePublicSavedList(slug);
      setFeedbackMessage(`${response.message}: ${response.list.name}`);
    } catch (error) {
      setFeedbackMessage(error.message);
    } finally {
      setIsCloning(false);
    }
  }

  if (isLoading) {
    return <p>{pick({ es: "Cargando guia...", en: "Loading guide...", eu: "Gida kargatzen..." }, language)}</p>;
  }

  if (errorMessage) {
    return (
      <section className="card not-found-page">
        <p className="eyebrow">{pick({ es: "Guia", en: "Guide", eu: "Gida" }, language)}</p>
        <h2>{pick({ es: "No hemos encontrado esta guia", en: "We could not find this guide", eu: "Ezin izan dugu gida hau aurkitu" }, language)}</h2>
        <p className="section-copy">{errorMessage}</p>
        <div className="hero-actions">
          <Link className="button" to="/guides">
            {pick({ es: "Volver a guias", en: "Back to guides", eu: "Itzuli gidetara" }, language)}
          </Link>
          <Link className="button secondary" to="/businesses">
            {pick({ es: "Ir al catalogo", en: "Go to catalogue", eu: "Joan katalogora" }, language)}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="saved-page">
      <header className="card saved-hero">
        <div>
          <p className="eyebrow">{pick({ es: "Guia publica", en: "Public guide", eu: "Gida publikoa" }, language)}</p>
          <h2>{guide.name}</h2>
          <p className="section-copy">
            {guide.description || pick({ es: "Seleccion compartida sin descripcion adicional.", en: "Shared selection without extra description.", eu: "Azalpen gehigarririk gabeko hautaketa partekatua." }, language)}
          </p>
        </div>
        <div className="saved-overview">
          <div>
            <strong>{Number(guide.business_count || 0)}</strong>
            <span>{pick({ es: "negocios en esta guia", en: "businesses in this guide", eu: "gida honetako negozioak" }, language)}</span>
          </div>
          <div>
            <strong>{guide.author_name}</strong>
            <span>{pick({ es: "persona que la comparte", en: "person sharing it", eu: "partekatzen duen pertsona" }, language)}</span>
          </div>
          <div>
            <strong>{formatLocaleDate(guide.created_at, language)}</strong>
            <span>{pick({ es: "fecha de publicacion", en: "publish date", eu: "argitalpen-data" }, language)}</span>
          </div>
        </div>
      </header>

      <section className="saved-layout">
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{pick({ es: "Recorrido", en: "Route", eu: "Ibilbidea" }, language)}</p>
              <h3>{pick({ es: "Negocios incluidos", en: "Included businesses", eu: "Sartutako negozioak" }, language)}</h3>
            </div>
            <p className="section-copy">
              {pick({
                es: "Puedes abrir cada ficha para reservar, guardar el negocio en tus listas o seguir navegando desde esta seleccion.",
                en: "Open each profile to book, save the business to your lists or keep exploring from this selection.",
                eu: "Fitxa bakoitza ireki dezakezu erreserbatzeko, negozioa zure zerrendetan gordetzeko edo hautaketa honetatik esploratzen jarraitzeko."
              }, language)}
            </p>
          </div>

          <div className="saved-business-stack">
            {(guide.businesses || []).map((business) => {
              const serviceMode = getServiceModeConfig(business.serviceMode, language);

              return (
                <article className="saved-business-item" key={`${guide.id}-${business.id}`}>
                  <div>
                    <strong>{business.name}</strong>
                    <span>
                      {business.category || pick({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" }, language)} · {serviceMode.badge} ·{" "}
                      {Number(business.average_rating || 0).toFixed(1)} / 5
                    </span>
                  </div>
                  <p className="section-copy">
                    {business.description || pick({ es: "Negocio guardado dentro de esta seleccion publica.", en: "Business included in this public selection.", eu: "Hautaketa publiko honetan gordetako negozioa." }, language)}
                  </p>
                  <div className="saved-business-actions">
                    <Link className="button" to={`/businesses/${business.id}`}>
                      {pick({ es: "Abrir ficha", en: "Open profile", eu: "Ireki fitxa" }, language)}
                    </Link>
                    <Link className="button secondary" to="/saved-lists">
                      {pick({ es: "Guardar en mis listas", en: "Save to my lists", eu: "Gorde nire zerrendetan" }, language)}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <aside className="card saved-sidecard">
          <p className="eyebrow">{pick({ es: "Compartir", en: "Share", eu: "Partekatu" }, language)}</p>
          <h3>{pick({ es: "Usa esta guia como recorrido publico", en: "Use this guide as a public route", eu: "Erabili gida hau ibilbide publiko gisa" }, language)}</h3>
          <div className="saved-tip-list">
            <div>
              <strong>{pick({ es: "Enlace publico", en: "Public link", eu: "Esteka publikoa" }, language)}</strong>
              <span>{buildGuideUrl(guide.shareSlug)}</span>
            </div>
            <div>
              <strong>{pick({ es: "Ideal para demo", en: "Ideal for demo", eu: "Demorako aproposa" }, language)}</strong>
              <span>
                {pick({
                  es: "Muestra que DonostiGo no solo reserva: tambien permite descubrir y curar planes.",
                  en: "It shows that DonostiGo is not only for booking: it also helps discover and curate plans.",
                  eu: "DonostiGo ez dela erreserbatzeko soilik erakusten du: planak aurkitu eta kuratzeko ere balio du."
                }, language)}
              </span>
            </div>
          </div>
          <div className="saved-share-actions">
            <button type="button" className="button" onClick={handleCopyGuideUrl}>
              {pick({ es: "Copiar enlace", en: "Copy link", eu: "Kopiatu esteka" }, language)}
            </button>
            {auth?.user.role === "user" ? (
              <button type="button" className="button secondary" onClick={handleCloneGuide} disabled={isCloning}>
                {isCloning
                  ? pick({ es: "Guardando...", en: "Saving...", eu: "Gordetzen..." }, language)
                  : pick({ es: "Guardar en mis listas", en: "Save to my lists", eu: "Gorde nire zerrendetan" }, language)}
              </button>
            ) : null}
            <Link className="button secondary" to="/guides">
              {pick({ es: "Ver mas guias", en: "View more guides", eu: "Ikusi gida gehiago" }, language)}
            </Link>
          </div>
          {!auth ? (
            <p className="section-copy">
              {pick({
                es: "Si inicias sesion como usuario cliente tambien podras copiar esta guia a tus guardados personales.",
                en: "If you sign in as a client user, you will also be able to copy this guide into your personal saved lists.",
                eu: "Bezero gisa saioa hasten baduzu, gida hau zure gordetako zerrendetara kopiatu ahal izango duzu."
              }, language)}
            </p>
          ) : null}
          {feedbackMessage ? <p className="status-message success">{feedbackMessage}</p> : null}
        </aside>
      </section>
    </section>
  );
}
