import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBusinesses, fetchCategories } from "../services/api.js";
import {
  getBusinessInitials,
  getCategoryImage,
  getCategoryKey
} from "../utils/businessTheme.js";

export default function BusinessListPage() {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("name_asc");
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
    return <p>Cargando negocios...</p>;
  }

  if (hasError) {
    return (
      <section className="card">
        <h2>No se han podido cargar los negocios</h2>
        <p>Comprueba que el backend este arrancado y vuelve a intentarlo.</p>
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
      ? "Mejor valorados"
      : selectedSort === "name_desc"
        ? "Nombre Z-A"
        : "Nombre A-Z";

  function handleResetFilters() {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedSort("name_asc");
  }

  return (
    <section className="listing-page">
      <header className="card listing-hero">
        <div>
          <p className="eyebrow">Catalogo local</p>
          <h2>Negocios disponibles</h2>
          <p className="section-copy">
            Listado inicial de establecimientos registrados en la plataforma, clasificados por
            categoria y preparados para consultar su detalle.
          </p>
        </div>

        <div className="listing-summary">
          <div>
            <strong>{visibleBusinesses.length}</strong>
            <span>negocios visibles</span>
          </div>
          <div>
            <strong>{availableCategories.length}</strong>
            <span>categorias activas</span>
          </div>
        </div>
      </header>

      <section className="card listing-toolbar">
        <label className="listing-field listing-search">
          <span>Buscar por nombre</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Ej. surf, brunch, donosti..."
          />
        </label>

        <label className="listing-field">
          <span>Ordenar por</span>
          <select
            value={selectedSort}
            onChange={(event) => setSelectedSort(event.target.value)}
          >
            <option value="name_asc">Nombre A-Z</option>
            <option value="name_desc">Nombre Z-A</option>
            <option value="rating_desc">Mejor valorados</option>
          </select>
        </label>
      </section>

      <section className="card listing-feedback">
        <div>
          <p className="eyebrow">Exploracion</p>
          <h3>
            {visibleBusinesses.length} resultado{visibleBusinesses.length === 1 ? "" : "s"}
          </h3>
          <p className="section-copy">
            {hasActiveFilters
              ? `Mostrando coincidencias para la busqueda actual, la categoria seleccionada y el orden ${activeSortLabel}.`
              : `Mostrando el catalogo completo ordenado por ${activeSortLabel}.`}
          </p>
        </div>

        <div className="listing-feedback-actions">
          {isFiltering ? <span className="listing-status">Actualizando listado...</span> : null}
          <button
            type="button"
            className="button secondary"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters && selectedSort === "name_asc"}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <div className="category-pills">
        <button
          type="button"
          className={selectedCategory === "all" ? "category-pill is-active" : "category-pill"}
          onClick={() => setSelectedCategory("all")}
        >
          Todas
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
        <p>
          {hasActiveFilters
            ? "No hay negocios que coincidan con la busqueda o filtros seleccionados."
            : "No hay negocios disponibles en este momento."}
        </p>
      ) : null}
      <div className="business-grid">
        {visibleBusinesses.map((business) => (
          <article
            className="card business-card"
            data-category={getCategoryKey(business.category)}
            key={business.id}
          >
            <div className="business-card-media">
              <img
                className="business-card-photo"
                src={getCategoryImage(business.category)}
                alt={`Imagen representativa de ${business.category || "la categoria del negocio"}`}
              />
              <span className="business-card-index">{String(business.id).padStart(2, "0")}</span>
              <div className="business-card-initials">{getBusinessInitials(business.name)}</div>
            </div>

            <div className="business-card-body">
              <p className="eyebrow">{business.category || "Sin categoria"}</p>
              <h3>{business.name}</h3>
              <p>{business.description}</p>
              <div className="business-card-metrics">
                <span>{Number(business.average_rating || 0).toFixed(1)} / 5</span>
                <span>{Number(business.review_count || 0)} resenas</span>
              </div>
            </div>

            <div className="business-card-footer">
              <span className="business-meta">Donostia-San Sebastian</span>
              <Link className="button secondary" to={`/businesses/${business.id}`}>
                Ver detalle
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
