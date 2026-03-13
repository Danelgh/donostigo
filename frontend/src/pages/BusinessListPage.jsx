import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBusinesses } from "../services/api.js";
import { getBusinessInitials, getCategoryKey } from "../utils/businessTheme.js";

export default function BusinessListPage() {
  const [businesses, setBusinesses] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses()
      .then((data) => {
        setBusinesses(data);
        setHasError(false);
      })
      .catch(() => {
        setBusinesses([]);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
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
            <strong>{businesses.length}</strong>
            <span>negocios visibles</span>
          </div>
          <div>
            <strong>4</strong>
            <span>categorias base</span>
          </div>
        </div>
      </header>

      <div className="category-pills">
        <span>Restauracion</span>
        <span>Deporte</span>
        <span>Bienestar</span>
        <span>Ocio</span>
      </div>

      {businesses.length === 0 ? <p>No hay negocios disponibles en este momento.</p> : null}
      <div className="business-grid">
        {businesses.map((business) => (
          <article
            className="card business-card"
            data-category={getCategoryKey(business.category)}
            key={business.id}
          >
            <div className="business-card-media">
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
