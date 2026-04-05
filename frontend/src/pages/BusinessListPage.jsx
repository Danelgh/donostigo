import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { pick, useI18n } from "../i18n/I18nProvider.jsx";
import { fetchBusinesses, fetchCategories } from "../services/api.js";
import {
  getBusinessCoverImage,
  getBusinessInitials,
  getBusinessThemeStyle,
  getCategoryKey
} from "../utils/businessTheme.js";
import { getServiceModeConfig } from "../utils/serviceMode.js";

function buildBusinessSpotlight(business, serviceMode, language) {
  if (business.heroBadge) {
    return business.heroBadge;
  }

  if (serviceMode.badge === pick({ es: "Solicitud", en: "Request", eu: "Eskaria" }, language)) {
    return pick({ es: "A medida", en: "Tailored", eu: "Neurrira" }, language);
  }

  if (Number(business.average_rating || 0) >= 4.7 && Number(business.review_count || 0) >= 3) {
    return pick({ es: "Top local", en: "Top local", eu: "Tokiko onena" }, language);
  }

  if (Number(business.review_count || 0) >= 5) {
    return pick({ es: "Muy comentado", en: "Highly reviewed", eu: "Asko komentatua" }, language);
  }

  return serviceMode.badge;
}

function buildBusinessCardCopy(business) {
  if (business.heroHighlight) {
    return business.heroHighlight;
  }

  if (business.heroClaim) {
    return business.heroClaim;
  }

  return business.description;
}

export default function BusinessListPage() {
  const { language } = useI18n();
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("name_asc");
  const [comparisonBusinesses, setComparisonBusinesses] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    fetchCategories()
      .then((data) => {
        setCategories(data.map((category) => category.name));
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    const isFirstLoad = !hasLoadedOnceRef.current;
    let isCancelled = false;

    if (isFirstLoad) {
      setIsInitialLoading(true);
    } else {
      setIsFiltering(true);
    }

    fetchBusinesses({
      q: deferredSearchTerm,
      category: selectedCategory,
      sort: selectedSort
    })
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setBusinesses(data);
        setHasError(false);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setBusinesses([]);
        setHasError(true);
      })
      .finally(() => {
        if (isCancelled) {
          return;
        }

        hasLoadedOnceRef.current = true;
        setIsInitialLoading(false);
        setIsFiltering(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [deferredSearchTerm, selectedCategory, selectedSort]);

  if (isInitialLoading) {
    return <p>{pick({ es: "Cargando negocios...", en: "Loading businesses...", eu: "Negozioak kargatzen..." }, language)}</p>;
  }

  if (hasError) {
    return (
      <section className="card">
        <h2>{pick({ es: "No se han podido cargar los negocios", en: "We could not load the businesses", eu: "Ezin izan dira negozioak kargatu" }, language)}</h2>
        <p>{pick({ es: "Comprueba que el backend este arrancado y vuelve a intentarlo.", en: "Check that the backend is running and try again.", eu: "Egiaztatu backend-a martxan dagoela eta saiatu berriro." }, language)}</p>
      </section>
    );
  }

  const availableCategories =
    categories.length > 0
      ? categories
      : Array.from(
          new Set(businesses.map((business) => business.category).filter(Boolean))
        ).sort((leftCategory, rightCategory) => leftCategory.localeCompare(rightCategory, "es"));
  const visibleBusinesses = businesses;
  const hasActiveFilters = Boolean(deferredSearchTerm.trim()) || selectedCategory !== "all";
  const activeSortLabel =
    selectedSort === "rating_desc"
      ? pick({ es: "Mejor valorados", en: "Top rated", eu: "Balorazio onenak" }, language)
      : selectedSort === "name_desc"
        ? pick({ es: "Nombre Z-A", en: "Name Z-A", eu: "Izena Z-A" }, language)
        : pick({ es: "Nombre A-Z", en: "Name A-Z", eu: "Izena A-Z" }, language);
  const featuredBusiness = [...visibleBusinesses].sort((leftBusiness, rightBusiness) => {
    const leftRating = Number(leftBusiness.average_rating || 0);
    const rightRating = Number(rightBusiness.average_rating || 0);

    if (rightRating !== leftRating) {
      return rightRating - leftRating;
    }

    return Number(rightBusiness.review_count || 0) - Number(leftBusiness.review_count || 0);
  })[0];
  const averageVisibleRating =
    visibleBusinesses.length > 0
      ? (
          visibleBusinesses.reduce(
            (totalRating, business) => totalRating + Number(business.average_rating || 0),
            0
          ) / visibleBusinesses.length
        ).toFixed(1)
      : "0.0";

  const activeFilterTags = [];

  if (deferredSearchTerm.trim()) {
    activeFilterTags.push(
      pick({ es: "Busqueda: {{value}}", en: "Search: {{value}}", eu: "Bilaketa: {{value}}" }, language, {
        value: deferredSearchTerm.trim()
      })
    );
  }

  if (selectedCategory !== "all") {
    activeFilterTags.push(
      pick({ es: "Categoria: {{value}}", en: "Category: {{value}}", eu: "Kategoria: {{value}}" }, language, {
        value: selectedCategory
      })
    );
  }

  activeFilterTags.push(
    pick({ es: "Orden: {{value}}", en: "Sort: {{value}}", eu: "Ordena: {{value}}" }, language, {
      value: activeSortLabel
    })
  );

  function handleResetFilters() {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedSort("name_asc");
  }

  function handleToggleComparison(business) {
    setComparisonBusinesses((currentValue) => {
      if (currentValue.some((item) => item.id === business.id)) {
        return currentValue.filter((item) => item.id !== business.id);
      }

      if (currentValue.length >= 3) {
        return [...currentValue.slice(1), business];
      }

      return [...currentValue, business];
    });
  }

  return (
    <section className="listing-page">
      <header className="card listing-hero">
        <div>
          <p className="eyebrow">{pick({ es: "Explora", en: "Explore", eu: "Arakatu" }, language)}</p>
          <h2>{pick({ es: "Negocios en Donostia", en: "Businesses in Donostia", eu: "Donostiako negozioak" }, language)}</h2>
          <p className="section-copy">
            {pick({ es: "Filtra, compara y entra en cada ficha con una lectura más rápida y más clara.", en: "Filter, compare and jump into each page with a cleaner and faster reading flow.", eu: "Iragazi, alderatu eta fitxa bakoitzean sartu irakurketa argiago eta azkarrago batekin." }, language)}
          </p>
        </div>

        <div className="listing-summary">
          <div>
            <strong>{visibleBusinesses.length}</strong>
            <span>{pick({ es: "negocios visibles", en: "visible businesses", eu: "ikusgai dauden negozioak" }, language)}</span>
          </div>
          <div>
            <strong>{availableCategories.length}</strong>
            <span>{pick({ es: "categorias activas", en: "active categories", eu: "kategoria aktiboak" }, language)}</span>
          </div>
        </div>
      </header>

      <section className="card listing-toolbar">
        <label className="listing-field listing-search">
          <span>{pick({ es: "Buscar por nombre", en: "Search by name", eu: "Bilatu izenaren arabera" }, language)}</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={pick({ es: "Ej. surf, brunch, donostia...", en: "E.g. surf, brunch, donostia...", eu: "Adib. surf, brunch, donostia..." }, language)}
          />
        </label>

        <label className="listing-field">
          <span>{pick({ es: "Ordenar por", en: "Sort by", eu: "Ordenatu" }, language)}</span>
          <select
            value={selectedSort}
            onChange={(event) => setSelectedSort(event.target.value)}
          >
            <option value="name_asc">{pick({ es: "Nombre A-Z", en: "Name A-Z", eu: "Izena A-Z" }, language)}</option>
            <option value="name_desc">{pick({ es: "Nombre Z-A", en: "Name Z-A", eu: "Izena Z-A" }, language)}</option>
            <option value="rating_desc">{pick({ es: "Mejor valorados", en: "Top rated", eu: "Balorazio onenak" }, language)}</option>
          </select>
        </label>
      </section>

      <section className="card listing-feedback">
        <div>
          <p className="eyebrow">{pick({ es: "Listado", en: "Listing", eu: "Zerrenda" }, language)}</p>
          <h3>
            {visibleBusinesses.length} {pick({ es: `resultado${visibleBusinesses.length === 1 ? "" : "s"}`, en: `result${visibleBusinesses.length === 1 ? "" : "s"}`, eu: `emaitza${visibleBusinesses.length === 1 ? "" : "k"}` }, language)}
          </h3>
          <p className="section-copy">
            {hasActiveFilters
              ? pick({ es: "Mostrando coincidencias para tu búsqueda y los filtros activos.", en: "Showing matches for your search and active filters.", eu: "Zure bilaketarako eta iragazki aktiboetarako bat datozen emaitzak erakusten." }, language)
              : pick({ es: "Mostrando el catálogo completo ordenado por {{value}}.", en: "Showing the full catalogue sorted by {{value}}.", eu: "Katalogo osoa {{value}} arabera ordenatuta erakusten." }, language, { value: activeSortLabel })}
          </p>
        </div>

        <div className="listing-feedback-actions">
          {isFiltering ? <span className="listing-status">{pick({ es: "Actualizando listado...", en: "Refreshing list...", eu: "Zerrenda eguneratzen..." }, language)}</span> : null}
          <button
            type="button"
            className="button secondary"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters && selectedSort === "name_asc"}
          >
            {pick({ es: "Limpiar filtros", en: "Clear filters", eu: "Iragazkiak garbitu" }, language)}
          </button>
        </div>
      </section>

      {visibleBusinesses.length > 0 ? (
        <section className="listing-insights">
          <article className="card listing-insight-card listing-insight-card-featured">
            <span>{pick({ es: "Negocio destacado", en: "Featured business", eu: "Nabarmendutako negozioa" }, language)}</span>
            <strong>{featuredBusiness?.name || pick({ es: "Sin datos", en: "No data", eu: "Daturik ez" }, language)}</strong>
            <p>
              {featuredBusiness
                ? `${Number(featuredBusiness.average_rating || 0).toFixed(1)} / 5 · ${Number(
                    featuredBusiness.review_count || 0
                  )} ${pick({ es: "resenas visibles", en: "visible reviews", eu: "ikusgai dauden iritziak" }, language)}`
                : pick({ es: "Todavía no hay suficiente información para destacar una ficha.", en: "There is not enough information yet to highlight a business page.", eu: "Oraindik ez dago fitxa bat nabarmentzeko nahikoa informaziorik." }, language)}
            </p>
          </article>

          <article className="card listing-insight-card">
            <span>{pick({ es: "Panorama actual", en: "Current snapshot", eu: "Uneko ikuspegia" }, language)}</span>
            <strong>{averageVisibleRating} / 5</strong>
            <p>{pick({ es: "Valoración media del conjunto visible ahora mismo.", en: "Average rating of the currently visible set.", eu: "Une honetan ikusgai dagoen multzoaren batez besteko balorazioa." }, language)}</p>
          </article>

          <article className="card listing-insight-card">
            <span>{pick({ es: "Filtros activos", en: "Active filters", eu: "Iragazki aktiboak" }, language)}</span>
            <div className="filter-tag-list">
              {activeFilterTags.map((tag) => (
                <span key={tag} className="filter-tag">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      <div className="category-pills">
        <button
          type="button"
          className={selectedCategory === "all" ? "category-pill is-active" : "category-pill"}
          onClick={() => setSelectedCategory("all")}
        >
          {pick({ es: "Todas", en: "All", eu: "Guztiak" }, language)}
        </button>
        {availableCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={selectedCategory === category ? "category-pill is-active" : "category-pill"}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {visibleBusinesses.length === 0 ? (
        <section className="card business-empty-state">
          <h3>
            {hasActiveFilters
              ? pick({ es: "No hay negocios que coincidan con los filtros actuales", en: "No businesses match the current filters", eu: "Ez dago uneko iragazkiekin bat datorren negoziorik" }, language)
              : pick({ es: "No hay negocios disponibles en este momento", en: "No businesses are available right now", eu: "Une honetan ez dago negoziorik erabilgarri" }, language)}
          </h3>
          <p>
            {hasActiveFilters
              ? pick({ es: "Prueba a limpiar la búsqueda o cambiar la categoría para volver a ver opciones.", en: "Try clearing the search or changing the category to see more options.", eu: "Saiatu bilaketa garbitzen edo kategoria aldatzen aukera gehiago ikusteko." }, language)
              : pick({ es: "Cuando haya negocios publicados, aparecerán aquí listos para explorar.", en: "Published businesses will appear here when available.", eu: "Argitaratutako negozioak hemen agertuko dira eskuragarri daudenean." }, language)}
          </p>
          {hasActiveFilters ? (
            <button type="button" className="button secondary" onClick={handleResetFilters}>
              {pick({ es: "Limpiar filtros", en: "Clear filters", eu: "Iragazkiak garbitu" }, language)}
            </button>
          ) : null}
        </section>
      ) : null}

      {comparisonBusinesses.length > 0 ? (
        <section className="card comparison-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{pick({ es: "Comparador rápido", en: "Quick compare", eu: "Konparazio azkarra" }, language)}</p>
              <h3>{pick({ es: "Contrasta hasta 3 opciones", en: "Compare up to 3 options", eu: "Alderatu 3 aukera arte" }, language)}</h3>
            </div>
            <div className="listing-feedback-actions">
              <span className="listing-status">
                {comparisonBusinesses.length} {pick({ es: `seleccionad${comparisonBusinesses.length === 1 ? "o" : "os"}`, en: `selected`, eu: `aukeratuta` }, language)}
              </span>
              <button
                type="button"
                className="button secondary"
                onClick={() => setComparisonBusinesses([])}
              >
                {pick({ es: "Limpiar comparador", en: "Clear compare", eu: "Konparazioa garbitu" }, language)}
              </button>
            </div>
          </div>

          <div className="comparison-grid">
            {comparisonBusinesses.map((business) => {
              const serviceMode = getServiceModeConfig(business.serviceMode, language);

              return (
                <article
                  key={business.id}
                  className="comparison-card"
                  style={getBusinessThemeStyle(business)}
                >
                  <div className="saved-list-head">
                    <strong>{business.name}</strong>
                    <span className="filter-tag">{business.heroBadge || serviceMode.badge}</span>
                  </div>
                  <p>{business.heroClaim || business.description}</p>
                  <div className="comparison-chip-row">
                    <span>{business.category || pick({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" }, language)}</span>
                    <span>{serviceMode.badge}</span>
                    <span>
                      {Number(business.average_rating || 0).toFixed(1)} / 5 ·{" "}
                      {Number(business.review_count || 0)} {pick({ es: "reseñas", en: "reviews", eu: "iritzi" }, language)}
                    </span>
                  </div>
                  <div className="comparison-chip-row">
                    <span>{business.heroHighlight || pick({ es: "Ficha clara, lista para comparar.", en: "A clear business page ready to compare.", eu: "Fitxa argia, alderatzeko prest." }, language)}</span>
                  </div>
                  <div className="business-card-footer-actions">
                    <Link className="button secondary" to={`/businesses/${business.id}`}>
                      {pick({ es: "Abrir ficha", en: "Open page", eu: "Fitxa ireki" }, language)}
                    </Link>
                    <button
                      type="button"
                      className="button tertiary"
                      onClick={() => handleToggleComparison(business)}
                    >
                      {pick({ es: "Quitar", en: "Remove", eu: "Kendu" }, language)}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="business-grid">
        {visibleBusinesses.map((business) => {
          const serviceMode = getServiceModeConfig(business.serviceMode, language);
          const spotlight = buildBusinessSpotlight(business, serviceMode, language);
          const businessThemeStyle = getBusinessThemeStyle(business);
          const coverImage = getBusinessCoverImage(business);
          const isInComparison = comparisonBusinesses.some((item) => item.id === business.id);

          return (
            <article
              className="card business-card"
              data-category={getCategoryKey(business.category)}
              key={business.id}
              style={businessThemeStyle}
            >
              <div className="business-card-media">
                <img
                  className="business-card-photo"
                  src={coverImage}
                  alt={`${pick({ es: "Imagen representativa de", en: "Representative image of", eu: "Honen irudi adierazgarria" }, language)} ${business.name}`}
                />
                <span className="business-card-index">{String(business.id).padStart(2, "0")}</span>
                <span className="business-card-brand-chip">{spotlight}</span>
                <div className="business-card-initials">{getBusinessInitials(business.name)}</div>
                <div className="business-card-media-copy">
                  <span>{business.category || pick({ es: "Negocio local", en: "Local business", eu: "Tokiko negozioa" }, language)}</span>
                  <strong>{business.heroClaim || pick({ es: "Una propuesta local con identidad propia", en: "A local concept with its own identity", eu: "Bere nortasuna duen tokiko proposamena" }, language)}</strong>
                </div>
              </div>

              <div className="business-card-body">
                <p className="eyebrow">{business.category || pick({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" }, language)}</p>
                <h3>{business.name}</h3>
                <p className="business-card-copy">{buildBusinessCardCopy(business)}</p>
                <div className="business-card-metrics">
                  <span>{Number(business.average_rating || 0).toFixed(1)} / 5</span>
                  <span>{Number(business.review_count || 0)} {pick({ es: "resenas", en: "reviews", eu: "iritzi" }, language)}</span>
                  <span>{serviceMode.badge}</span>
                </div>
              </div>

              <div className="business-card-footer">
                <span className="business-meta">
                  {business.heroBadge || "Donostia-San Sebastian"}
                </span>
                <div className="business-card-footer-actions">
                  <button
                    type="button"
                    className={isInComparison ? "button tertiary" : "button secondary"}
                    onClick={() => handleToggleComparison(business)}
                  >
                    {isInComparison
                      ? pick({ es: "En comparador", en: "In compare", eu: "Konparazioan" }, language)
                      : pick({ es: "Comparar", en: "Compare", eu: "Alderatu" }, language)}
                  </button>
                  <Link className="button secondary" to={`/businesses/${business.id}`}>
                    {business.serviceMode === "request"
                      ? pick({ es: "Abrir portal", en: "Open page", eu: "Ataria ireki" }, language)
                      : pick({ es: "Ver detalle", en: "View details", eu: "Xehetasuna ikusi" }, language)}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
