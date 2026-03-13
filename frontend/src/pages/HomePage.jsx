import { Link } from "react-router-dom";
import donostigoScene from "../assets/donostigo-scene.svg";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero hero-home">
        <div className="hero-copy">
          <p className="eyebrow">TFG DAW 2026 · Donostia-San Sebastian</p>
          <h2>Consulta negocios locales y gestiona reservas desde una sola web.</h2>
          <p className="hero-text">
            DonostiGo es una aplicacion pensada para reunir en un mismo sitio informacion
            basica de pequenos negocios de Donostia-San Sebastian y facilitar la reserva de
            servicios de forma sencilla.
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
          <div className="hero-visual card">
            <img src={donostigoScene} alt="Ilustracion conceptual de DonostiGo" />
            <div className="hero-visual-badge">
              <span>Proyecto DonostiGo</span>
              <strong>Catalogo de negocios y reservas</strong>
            </div>
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
          <h3>Consulta centralizada</h3>
          <p>
            La plataforma permite consultar establecimientos clasificados por categoria desde
            una unica interfaz.
          </p>
        </article>

        <article className="card feature-card">
          <p className="eyebrow">Reserva</p>
          <h3>Reserva desde el detalle</h3>
          <p>
            Cada ficha de negocio reune la informacion principal y el formulario de reserva
            basico.
          </p>
        </article>

        <article className="card feature-card">
          <p className="eyebrow">Valor local</p>
          <h3>Apoyo al comercio local</h3>
          <p>
            El proyecto busca mejorar la visibilidad digital de pequenos negocios que no
            siempre disponen de herramientas propias.
          </p>
        </article>
      </section>

      <section className="card home-categories">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Categorias</p>
            <h3>Categorias iniciales del proyecto</h3>
          </div>
          <p className="section-copy">
            En esta primera version se ha planteado una clasificacion sencilla para organizar
            los establecimientos mostrados en la web.
          </p>
        </div>

        <div className="category-grid">
          <article className="category-card">
            <span>01</span>
            <h4>Restauracion</h4>
            <p>Bares, cafeterias y otros establecimientos vinculados al sector gastronomico.</p>
          </article>

          <article className="category-card">
            <span>02</span>
            <h4>Deporte</h4>
            <p>Escuelas, actividades y servicios relacionados con el deporte.</p>
          </article>

          <article className="category-card">
            <span>03</span>
            <h4>Bienestar</h4>
            <p>Centros y servicios orientados al cuidado personal y al bienestar.</p>
          </article>

          <article className="category-card">
            <span>04</span>
            <h4>Ocio</h4>
            <p>Opciones de tiempo libre agrupadas en una misma plataforma.</p>
          </article>
        </div>
      </section>

      <section className="card home-proof">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Experiencia</p>
            <h3>Recorrido principal del MVP</h3>
          </div>
          <p className="section-copy">
            La aplicacion ya permite mostrar un flujo basico desde el catalogo hasta la
            gestion de reservas del usuario.
          </p>
        </div>

        <div className="proof-grid">
          <article className="proof-card">
            <span className="proof-step">01</span>
            <h4>Explorar</h4>
            <p>Listado de negocios con acceso rapido a la ficha individual.</p>
          </article>
          <article className="proof-card">
            <span className="proof-step">02</span>
            <h4>Elegir</h4>
            <p>Vista de detalle con informacion ampliada del establecimiento.</p>
          </article>
          <article className="proof-card">
            <span className="proof-step">03</span>
            <h4>Reservar</h4>
            <p>Formulario de reserva y consulta posterior desde el perfil del usuario.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
