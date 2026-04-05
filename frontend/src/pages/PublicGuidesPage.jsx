import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatLocaleDate, pick, useI18n } from "../i18n/I18nProvider.jsx";
import { fetchPublicSavedLists } from "../services/api.js";
import { getServiceModeConfig } from "../utils/serviceMode.js";

function buildGuideSummary(guides) {
  return {
    guideCount: guides.length,
    businessCount: guides.reduce((total, guide) => total + Number(guide.business_count || 0), 0),
    authorCount: new Set(guides.map((guide) => guide.author_name)).size
  };
}

export default function PublicGuidesPage() {
  const { language } = useI18n();
  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const guideSummary = useMemo(() => buildGuideSummary(guides), [guides]);

  useEffect(() => {
    fetchPublicSavedLists()
      .then((data) => {
        setGuides(data);
      })
      .catch((error) => {
        setGuides([]);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <p>{pick({ es: "Cargando guias publicas...", en: "Loading public guides...", eu: "Gida publikoak kargatzen..." }, language)}</p>;
  }

  if (errorMessage) {
    return (
      <section className="card">
        <h2>{pick({ es: "No se han podido cargar las guias", en: "Guides could not be loaded", eu: "Ezin izan dira gidak kargatu" }, language)}</h2>
        <p>{errorMessage}</p>
      </section>
    );
  }

  return (
    <section className="saved-page">
      <header className="card saved-hero">
        <div>
          <p className="eyebrow">{pick({ es: "Guias", en: "Guides", eu: "Gidak" }, language)}</p>
          <h2>{pick({ es: "Selecciones publicas creadas por la comunidad", en: "Public selections created by the community", eu: "Komunitateak sortutako hautaketa publikoak" }, language)}</h2>
          <p className="section-copy">
            {pick({
              es: "Explora listas compartidas por usuarios de DonostiGo para descubrir negocios desde rutas tematicas, planes concretos o recomendaciones personales.",
              en: "Explore lists shared by DonostiGo users to discover businesses through themed routes, concrete plans or personal recommendations.",
              eu: "Arakatu DonostiGo erabiltzaileek partekatutako zerrendak negozioak ibilbide tematikoen, plan zehatzen edo gomendio pertsonalen bidez ezagutzeko."
            }, language)}
          </p>
        </div>
        <div className="saved-overview">
          <div>
            <strong>{guideSummary.guideCount}</strong>
            <span>{pick({ es: "guias disponibles", en: "available guides", eu: "eskuragarri dauden gidak" }, language)}</span>
          </div>
          <div>
            <strong>{guideSummary.businessCount}</strong>
            <span>{pick({ es: "negocios curados", en: "curated businesses", eu: "katalogatutako negozioak" }, language)}</span>
          </div>
          <div>
            <strong>{guideSummary.authorCount}</strong>
            <span>{pick({ es: "autores activos", en: "active authors", eu: "egile aktiboak" }, language)}</span>
          </div>
        </div>
      </header>

      {guides.length === 0 ? (
        <section className="card saved-empty">
          <h3>{pick({ es: "Todavia no hay guias publicadas", en: "There are no published guides yet", eu: "Oraindik ez dago gida argitaraturik" }, language)}</h3>
          <p>
            {pick({
              es: "Cuando los usuarios empiecen a compartir sus listas, aqui apareceran nuevas formas de recorrer DonostiGo mas alla del catalogo clasico.",
              en: "When users start sharing their lists, this page will reveal new ways to move through DonostiGo beyond the classic catalogue.",
              eu: "Erabiltzaileak beren zerrendak partekatzen hasten direnean, hemen agertuko dira DonostiGo katalogo klasikotik harago ezagutzeko modu berriak."
            }, language)}
          </p>
        </section>
      ) : (
        <div className="saved-guide-grid">
          {guides.map((guide) => (
            <article className="card saved-guide-card" key={guide.id}>
              <div className="saved-list-head">
                <div>
                  <p className="eyebrow">{pick({ es: "Guia publica", en: "Public guide", eu: "Gida publikoa" }, language)}</p>
                  <h3>{guide.name}</h3>
                </div>
                <span className="saved-visibility-badge saved-visibility-badge-public">
                  {pick(
                    {
                      es: "{{count}} negocios",
                      en: "{{count}} businesses",
                      eu: "{{count}} negozio"
                    },
                    language,
                    { count: Number(guide.business_count || 0) }
                  )}
                </span>
              </div>

              <p className="section-copy">
                {guide.description || pick({ es: "Seleccion compartida sin descripcion adicional.", en: "Shared selection without extra description.", eu: "Azalpen gehigarririk gabeko hautaketa partekatua." }, language)}
              </p>

              <div className="saved-list-meta">
                <span>
                  {pick(
                    {
                      es: "Creada por {{author}}",
                      en: "Created by {{author}}",
                      eu: "{{author}} egileak sortua"
                    },
                    language,
                    { author: guide.author_name }
                  )}
                </span>
                <span>{formatLocaleDate(guide.created_at, language)}</span>
              </div>

              <div className="saved-guide-preview">
                {(guide.businesses || []).slice(0, 3).map((business) => {
                  const serviceMode = getServiceModeConfig(business.serviceMode, language);

                  return (
                    <div className="saved-guide-preview-item" key={`${guide.id}-${business.id}`}>
                      <strong>{business.name}</strong>
                      <span>
                        {business.category || pick({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" }, language)} · {serviceMode.badge}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="saved-share-actions">
                <Link className="button" to={`/guides/${guide.shareSlug}`}>
                  {pick({ es: "Abrir guia", en: "Open guide", eu: "Ireki gida" }, language)}
                </Link>
                <Link className="button secondary" to="/businesses">
                  {pick({ es: "Seguir explorando", en: "Keep exploring", eu: "Jarraitu esploratzen" }, language)}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
