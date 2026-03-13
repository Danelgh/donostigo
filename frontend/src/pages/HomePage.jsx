import { Link } from "react-router-dom";
import donostiaHero from "../assets/donostia-hero.jpg";
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
          <div className="hero-visual card hero-photo-card">
            <img
              className="hero-photo"
              src={donostiaHero}
              alt="Vista panoramica de Donostia-San Sebastian"
            />
            <div className="hero-visual-badge">
              <span>Donostia-San Sebastian</span>
              <strong>Negocios locales y reservas en un mismo entorno</strong>
            </div>
          </div>

          <div className="hero-local-card">
            <img src={donostigoScene} alt="Ilustracion conceptual de DonostiGo" />
            <div className="hero-local-copy">
              <span>Enfoque del proyecto</span>
              <strong>Una propuesta digital centrada en el comercio local</strong>
              <p>
                La plataforma toma como referencia la ciudad de Donostia para reunir
                negocios, categorias y reservas en una experiencia sencilla.
              </p>
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
            <h3>Categorias principales del catalogo</h3>
          </div>
          <p className="section-copy">
            El catalogo se ha ampliado con varias categorias para representar mejor la
            diversidad de negocios locales que puede reunir la plataforma.
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
            <h4>Cafeterias y brunch</h4>
            <p>Locales de desayuno, brunch y cafe con reservas para franjas concretas.</p>
          </article>

          <article className="category-card">
            <span>03</span>
            <h4>Deporte</h4>
            <p>Escuelas, actividades y servicios relacionados con el deporte.</p>
          </article>

          <article className="category-card">
            <span>04</span>
            <h4>Bienestar y estetica</h4>
            <p>Centros orientados al cuidado personal, tratamientos y bienestar.</p>
          </article>

          <article className="category-card">
            <span>05</span>
            <h4>Ocio</h4>
            <p>Opciones de tiempo libre agrupadas en una misma plataforma.</p>
          </article>

          <article className="category-card">
            <span>06</span>
            <h4>Turismo y visitas guiadas</h4>
            <p>Rutas y experiencias pensadas para visitantes y usuarios locales.</p>
          </article>

          <article className="category-card">
            <span>07</span>
            <h4>Cultura y talleres</h4>
            <p>Actividades creativas, manuales y culturales con plazas reservables.</p>
          </article>

          <article className="category-card">
            <span>08</span>
            <h4>Formacion y clases</h4>
            <p>Academias, cursos y espacios de aprendizaje con reserva de plaza.</p>
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
