import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createReservation, fetchBusinessById } from "../services/api.js";

export default function BusinessDetailPage({ auth }) {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [reservationDate, setReservationDate] = useState("");
  const [people, setPeople] = useState("2");
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);

  useEffect(() => {
    fetchBusinessById(id)
      .then((data) => {
        setBusiness(data);
        setHasError(false);
      })
      .catch(() => {
        setBusiness(null);
        setHasError(true);
      });
  }, [id]);

  async function handleReservationSubmit(event) {
    event.preventDefault();

    if (!auth?.token) {
      setReservationError("Debes iniciar sesion para crear una reserva.");
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
        },
        auth.token
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

  return (
    <section className="detail-page">
      <div className="card detail-hero">
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
          <span className="detail-tag">TFG MVP</span>
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
          </div>

          <div className="detail-section">
            <h3>Descripcion</h3>
            <p>{business.description}</p>
          </div>

          <div className="detail-section">
            <h3>Valor para el usuario</h3>
            <ul className="detail-list">
              <li>Consulta rapida de informacion basica del establecimiento.</li>
              <li>Acceso centralizado a la reserva desde una sola pantalla.</li>
              <li>Navegacion clara entre listado y detalle del negocio.</li>
            </ul>
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
                Despues de reservar puedes revisar el resultado en la seccion de mis reservas.
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
