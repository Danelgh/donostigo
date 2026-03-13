import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="card not-found-page">
      <p className="eyebrow">404</p>
      <h2>Esta pagina no existe</h2>
      <p className="section-copy">
        La ruta a la que has intentado acceder no forma parte de DonostiGo o todavia no esta
        disponible en esta version del proyecto.
      </p>
      <div className="hero-actions">
        <Link className="button" to="/">
          Volver al inicio
        </Link>
        <Link className="button secondary" to="/businesses">
          Ir al catalogo
        </Link>
      </div>
    </section>
  );
}
