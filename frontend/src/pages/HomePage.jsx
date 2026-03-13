import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero hero-home">
        <div className="hero-copy">
          <p className="eyebrow">TFG DAW 2026 · Donostia-San Sebastian</p>
          <h2>Reserva planes locales sin perderte entre webs, redes y formularios sueltos.</h2>
          <p className="hero-text">
            DonostiGo centraliza la informacion de pequenos negocios de la ciudad y convierte
            la busqueda en una experiencia mas clara, rapida y util tanto para clientes como
            para establecimientos.
          </p>

          <div className="hero-actions">
            <Link className="button" to="/businesses">
              Explorar negocios
            </Link>
            <Link className="button secondary" to="/register">
              Crear cuenta
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-card accent">
            <span className="hero-kicker">MVP actual</span>
            <strong>Catalogo, detalle y reserva basica</strong>
            <p>
              Base funcional construida con React, Express y PostgreSQL para el desarrollo del
              TFG.
            </p>
          </div>

          <div className="hero-metrics">
            <div className="hero-metric">
              <strong>3 capas</strong>
              <span>Frontend, backend y base de datos conectados</span>
            </div>
            <div className="hero-metric">
              <strong>API REST</strong>
              <span>Consulta de negocios y detalle desde servidor Express</span>
            </div>
            <div className="hero-metric">
              <strong>Responsive</strong>
              <span>Interfaz preparada para escritorio y movil</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-strip">
        <article className="card feature-card">
          <p className="eyebrow">Descubrimiento</p>
          <h3>Negocios locales en un solo punto</h3>
          <p>
            El usuario consulta establecimientos clasificados por categoria sin depender de
            multiples canales externos.
          </p>
        </article>

        <article className="card feature-card">
          <p className="eyebrow">Reserva</p>
          <h3>Un flujo mas directo</h3>
          <p>
            El detalle del negocio concentra la informacion principal y prepara la solicitud
            de reserva desde una sola vista.
          </p>
        </article>

        <article className="card feature-card">
          <p className="eyebrow">Valor local</p>
          <h3>Mas visibilidad para pequenos comercios</h3>
          <p>
            La plataforma busca facilitar la presencia digital de negocios que normalmente no
            disponen de herramientas propias.
          </p>
        </article>
      </section>

      <section className="card home-categories">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Categorias</p>
            <h3>Una estructura pensada para crecer</h3>
          </div>
          <p className="section-copy">
            La primera version del proyecto organiza la oferta local en bloques claros y
            faciles de recorrer.
          </p>
        </div>

        <div className="category-grid">
          <article className="category-card">
            <span>01</span>
            <h4>Restauracion</h4>
            <p>Bares, cafeterias y espacios gastronomicos con reserva sencilla.</p>
          </article>

          <article className="category-card">
            <span>02</span>
            <h4>Deporte</h4>
            <p>Escuelas, actividades y servicios orientados a un estilo de vida activo.</p>
          </article>

          <article className="category-card">
            <span>03</span>
            <h4>Bienestar</h4>
            <p>Centros y servicios enfocados en salud, cuidado personal y relajacion.</p>
          </article>

          <article className="category-card">
            <span>04</span>
            <h4>Ocio</h4>
            <p>Propuestas de tiempo libre con informacion centralizada y acceso rapido.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
