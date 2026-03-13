import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBusinesses } from "../services/api.js";

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
    <section>
      <h2>Negocios disponibles</h2>
      {businesses.length === 0 ? <p>No hay negocios disponibles en este momento.</p> : null}
      <div className="grid">
        {businesses.map((business) => (
          <article className="card" key={business.id}>
            <p className="eyebrow">{business.category || "Sin categoria"}</p>
            <h3>{business.name}</h3>
            <p>{business.description}</p>
            <Link className="button secondary" to={`/businesses/${business.id}`}>
              Ver detalle
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
