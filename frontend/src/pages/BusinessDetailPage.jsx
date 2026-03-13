import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createBusinessReview,
  createReservation,
  fetchBusinessById
} from "../services/api.js";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl } from "../utils/maps.js";
import { getBusinessInitials, getCategoryKey } from "../utils/businessTheme.js";

export default function BusinessDetailPage({ auth }) {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [reservationDate, setReservationDate] = useState("");
  const [people, setPeople] = useState("2");
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  async function loadBusiness() {
    try {
      const data = await fetchBusinessById(id);
      setBusiness(data);
      setHasError(false);
    } catch (_error) {
      setBusiness(null);
      setHasError(true);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, [id]);

  async function handleReservationSubmit(event) {
    event.preventDefault();

    if (!auth) {
      setReservationError("Debes iniciar sesion para crear una reserva.");
      setReservationMessage("");
      return;
    }

    if (auth.user.role !== "user") {
      setReservationError("Solo las cuentas de usuario cliente pueden crear reservas.");
      setReservationMessage("");
      return;
    }

    setIsSubmittingReservation(true);
    setReservationError("");
    setReservationMessage("");

    try {
      await createReservation(
        {
          businessId: business.id,
          reservationDate,
          people: Number(people)
        }
      );

      setReservationMessage("Reserva registrada correctamente.");
      setReservationDate("");
      setPeople("2");
    } catch (error) {
      setReservationError(error.message);
    } finally {
      setIsSubmittingReservation(false);
    }
  }

  async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!auth) {
      setReviewError("Debes iniciar sesion para publicar una resena.");
      setReviewMessage("");
      return;
    }

    if (auth.user.role !== "user") {
      setReviewError("Solo las cuentas de usuario cliente pueden publicar resenas.");
      setReviewMessage("");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");
    setReviewMessage("");

    try {
      const response = await createBusinessReview(
        business.id,
        {
          rating: Number(reviewRating),
          comment: reviewComment
        }
      );

      setReviewMessage(response.message);
      await loadBusiness();
    } catch (error) {
      setReviewError(error.message);
    } finally {
      setIsSubmittingReview(false);
    }
  }

  if (hasError) {
    return (
      <section className="card">
        <p className="eyebrow">Detalle</p>
        <h2>No se ha podido cargar el negocio</h2>
        <p>Revisa que el backend este en marcha y vuelve a intentarlo.</p>
        <Link className="button secondary" to="/businesses">
          Volver al listado
        </Link>
      </section>
    );
  }

  if (!business) {
    return <p>Cargando negocio...</p>;
  }

  const categoryKey = getCategoryKey(business.category);
  const averageRating = Number(business.average_rating || 0);
  const reviewCount = Number(business.review_count || 0);
  const mapsEmbedUrl = buildGoogleMapsEmbedUrl(business.address);
  const mapsSearchUrl = buildGoogleMapsSearchUrl(business.address);

  return (
    <section className="detail-page">
      <div className="card detail-hero" data-category={categoryKey}>
        <div>
          <Link className="detail-back" to="/businesses">
            Volver a negocios
          </Link>
          <p className="eyebrow">{business.category || "Sin categoria"}</p>
          <h2>{business.name}</h2>
          <p className="detail-lead">{business.description}</p>
        </div>

        <div className="detail-tags">
          <span className="detail-tag">Negocio local</span>
          <span className="detail-tag">Reserva online</span>
          <span className="detail-tag">{reviewCount} resenas</span>
        </div>

        <div className="detail-poster">
          <span className="detail-poster-mark">{getBusinessInitials(business.name)}</span>
          <div className="detail-poster-copy">
            <strong>{business.name}</strong>
            <span>{business.address}</span>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <article className="card">
          <h3>Informacion del establecimiento</h3>

          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span>Direccion</span>
              <strong>{business.address}</strong>
            </div>

            <div className="detail-info-item">
              <span>Telefono</span>
              <strong>{business.phone || "Pendiente de completar"}</strong>
            </div>

            <div className="detail-info-item">
              <span>Categoria</span>
              <strong>{business.category || "Sin categoria"}</strong>
            </div>

            <div className="detail-info-item">
              <span>Disponibilidad</span>
              <strong>Activa para reservas</strong>
            </div>

            <div className="detail-info-item">
              <span>Valoracion media</span>
              <strong>{averageRating.toFixed(1)} / 5</strong>
            </div>

            <div className="detail-info-item">
              <span>Opiniones</span>
              <strong>{reviewCount} publicadas</strong>
            </div>
          </div>

          <div className="detail-section">
            <h3>Descripcion</h3>
            <p>{business.description}</p>
          </div>

          <div className="detail-section">
            <div className="section-heading">
              <div>
                <h3>Ubicacion</h3>
              </div>
              {mapsSearchUrl ? (
                <a
                  className="button secondary"
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir en Google Maps
                </a>
              ) : null}
            </div>

            <p className="section-copy">
              La direccion guardada en la ficha del negocio se utiliza para mostrar esta vista
              rapida y facilitar la apertura de Google Maps.
            </p>

            {mapsEmbedUrl ? (
              <div className="map-embed-shell">
                <iframe
                  title={`Ubicacion de ${business.name}`}
                  src={mapsEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <p>No hay una direccion suficiente para mostrar la ubicacion.</p>
            )}
          </div>

          <div className="detail-section">
            <h3>Valor para el usuario</h3>
            <ul className="detail-list">
              <li>Consulta rapida de informacion basica del establecimiento.</li>
              <li>Acceso centralizado a la reserva desde una sola pantalla.</li>
              <li>Navegacion clara entre listado y detalle del negocio.</li>
            </ul>
          </div>

          <div className="detail-section detail-quote">
            <p>
              Esta vista reune la informacion principal del negocio y sirve como base para la
              reserva dentro del flujo planteado en el MVP.
            </p>
          </div>
        </article>

        <aside className="card detail-aside">
          <p className="eyebrow">Reserva</p>
          <h3>Reserva rapida</h3>
          {!auth ? (
            <>
              <p className="detail-aside-copy">
                Para completar una reserva debes iniciar sesion con una cuenta de usuario.
              </p>
              <Link className="button" to="/login">
                Ir a login
              </Link>
            </>
          ) : auth.user.role === "business" ? (
            <p className="detail-aside-copy">
              Las cuentas de negocio pueden consultar el catalogo, pero la reserva solo esta
              disponible para usuarios cliente.
            </p>
          ) : (
            <>
              <p className="detail-aside-copy">
                Sesion iniciada como <strong>{auth.user.name}</strong>. Completa los datos para
                registrar una solicitud.
              </p>

              <form className="form" onSubmit={handleReservationSubmit}>
                <input
                  type="datetime-local"
                  value={reservationDate}
                  onChange={(event) => setReservationDate(event.target.value)}
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Numero de personas"
                  value={people}
                  onChange={(event) => setPeople(event.target.value)}
                  required
                />
                <button type="submit" disabled={isSubmittingReservation}>
                  {isSubmittingReservation ? "Guardando..." : "Reservar"}
                </button>
              </form>

              {reservationMessage ? (
                <p className="status-message success">{reservationMessage}</p>
              ) : null}
              {reservationError ? <p className="status-message error">{reservationError}</p> : null}

              <p className="detail-note">
                Puedes revisar la solicitud en la seccion de mis reservas.
              </p>
            </>
          )}
        </aside>
      </div>

      <div className="review-layout">
        <article className="card review-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Comunidad</p>
              <h3>Resenas del negocio</h3>
            </div>
            <p className="section-copy">
              Opiniones publicadas por usuarios con alguna reserva registrada en este
              establecimiento.
            </p>
          </div>

          {business.reviews?.length ? (
            <div className="review-stack">
              {business.reviews.map((review) => (
                <article className="review-item" key={review.id}>
                  <div className="review-item-head">
                    <div className="review-author">
                      {review.author_avatar ? (
                        <img
                          className="review-avatar"
                          src={review.author_avatar}
                          alt={`Foto de ${review.author_name}`}
                        />
                      ) : (
                        <span className="review-avatar review-avatar-fallback">
                          {getBusinessInitials(review.author_name)}
                        </span>
                      )}
                      <div>
                        <strong>{review.author_name}</strong>
                        <span>
                          {review.author_city || "Usuario de DonostiGo"} · {review.rating}/5
                        </span>
                      </div>
                    </div>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  <p>{review.comment}</p>
                </article>
              ))}
            </div>
          ) : (
            <p>Todavia no hay resenas publicadas para este negocio.</p>
          )}
        </article>

        <aside className="card review-editor">
          <p className="eyebrow">Tu opinion</p>
          <h3>Publicar o actualizar resena</h3>

          {!auth ? (
            <>
              <p className="detail-aside-copy">
                Inicia sesion con una cuenta cliente para dejar una opinion.
              </p>
              <Link className="button" to="/login">
                Ir a login
              </Link>
            </>
          ) : auth.user.role === "business" ? (
            <p className="detail-aside-copy">
              Las cuentas de negocio no pueden publicar resenas en el catalogo.
            </p>
          ) : (
            <>
              <p className="detail-aside-copy">
                Solo se aceptan resenas de usuarios que hayan reservado previamente en este
                negocio. Si vuelves a enviar la resena, se actualiza la anterior.
              </p>

              <form className="form" onSubmit={handleReviewSubmit}>
                <select
                  value={reviewRating}
                  onChange={(event) => setReviewRating(event.target.value)}
                >
                  <option value="5">5 / 5</option>
                  <option value="4">4 / 5</option>
                  <option value="3">3 / 5</option>
                  <option value="2">2 / 5</option>
                  <option value="1">1 / 5</option>
                </select>
                <textarea
                  rows="5"
                  placeholder="Cuenta como ha sido la experiencia"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  minLength="12"
                  required
                />
                <button type="submit" disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Publicando..." : "Guardar resena"}
                </button>
              </form>

              {reviewMessage ? <p className="status-message success">{reviewMessage}</p> : null}
              {reviewError ? <p className="status-message error">{reviewError}</p> : null}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
