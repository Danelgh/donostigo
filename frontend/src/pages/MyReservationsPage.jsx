import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBusinessReservations, fetchMyReservations } from "../services/api.js";

function formatReservationStatus(status) {
  if (status === "confirmed") {
    return "Confirmada";
  }

  if (status === "cancelled") {
    return "Cancelada";
  }

  return "Pendiente";
}

export default function MyReservationsPage({ auth }) {
  const [reservations, setReservations] = useState([]);
  const [businessSummary, setBusinessSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(auth));
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!auth) {
      setReservations([]);
      setBusinessSummary(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const request =
      auth.user.role === "business" ? fetchBusinessReservations() : fetchMyReservations();

    request
      .then((data) => {
        if (auth.user.role === "business") {
          setBusinessSummary(data.business);
          setReservations(data.reservations);
          return;
        }

        setBusinessSummary(null);
        setReservations(data);
      })
      .catch((error) => {
        setReservations([]);
        setBusinessSummary(null);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [auth]);

  if (!auth) {
    return (
      <section className="card auth-card">
        <h2>Mis reservas</h2>
        <p className="auth-copy">
          Debes iniciar sesion para consultar las reservas registradas en tu cuenta.
        </p>
        <Link className="button" to="/login">
          Ir a login
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return <p>Cargando reservas...</p>;
  }

  if (auth.user.role === "business") {
    return (
      <section className="reservation-page">
        <header className="card reservation-hero">
          <div>
            <p className="eyebrow">Panel de negocio</p>
            <h2>Reservas recibidas</h2>
            <p className="section-copy">
              Vista basica para consultar las solicitudes asociadas a tu establecimiento.
            </p>
          </div>
          <div className="reservation-overview">
            <div>
              <strong>{reservations.length}</strong>
              <span>solicitudes registradas</span>
            </div>
            <div>
              <strong>{businessSummary?.name || auth.user.name}</strong>
              <span>negocio activo</span>
            </div>
          </div>
        </header>

        <section className="card">
          {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

          {reservations.length === 0 ? (
            <p>Todavia no has recibido reservas para tu negocio.</p>
          ) : (
            <div className="reservation-stack">
              {reservations.map((reservation) => (
                <article className="reservation-item" key={reservation.id}>
                  <div>
                    <p className="eyebrow">Reserva #{reservation.id}</p>
                    <h3>{reservation.customer_name}</h3>
                  </div>
                  <p>
                    <strong>Email:</strong> {reservation.customer_email}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {new Date(reservation.reservation_date).toLocaleString("es-ES")}
                  </p>
                  <p>
                    <strong>Personas:</strong> {reservation.people}
                  </p>
                  <p>
                    <strong>Estado:</strong> {reservation.status}
                  </p>
                  <span className={`reservation-status reservation-status-${reservation.status}`}>
                    {formatReservationStatus(reservation.status)}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    );
  }

  return (
    <section className="reservation-page">
      <header className="card reservation-hero">
        <div>
          <p className="eyebrow">Panel de usuario</p>
          <h2>Mis reservas</h2>
          <p className="section-copy">
            Vista basica para consultar las reservas realizadas por el usuario autenticado.
          </p>
        </div>
        <div className="reservation-overview">
          <div>
            <strong>{reservations.length}</strong>
            <span>reservas activas</span>
          </div>
          <div>
            <strong>{auth.user.name}</strong>
            <span>usuario autenticado</span>
          </div>
        </div>
      </header>

      <section className="card">
        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

        {reservations.length === 0 ? (
          <p>Todavia no tienes reservas registradas.</p>
        ) : (
          <div className="reservation-stack">
            {reservations.map((reservation) => (
              <article className="reservation-item" key={reservation.id}>
                <div>
                  <p className="eyebrow">Reserva #{reservation.id}</p>
                  <h3>{reservation.business_name}</h3>
                </div>
                <p>
                  <strong>Fecha:</strong>{" "}
                  {new Date(reservation.reservation_date).toLocaleString("es-ES")}
                </p>
                <p>
                  <strong>Personas:</strong> {reservation.people}
                </p>
                <p>
                  <strong>Estado:</strong> {reservation.status}
                </p>
                <span className={`reservation-status reservation-status-${reservation.status}`}>
                  {formatReservationStatus(reservation.status)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
