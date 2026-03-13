import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyReservations } from "../services/api.js";

export default function MyReservationsPage({ auth }) {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(auth?.token && auth.user.role === "user"));
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!auth?.token || auth.user.role !== "user") {
      setReservations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    fetchMyReservations(auth.token)
      .then((data) => {
        setReservations(data);
      })
      .catch((error) => {
        setReservations([]);
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

  if (auth.user.role !== "user") {
    return (
      <section className="card auth-card">
        <h2>Mis reservas</h2>
        <p className="auth-copy">
          Esta vista esta disponible para cuentas de usuario cliente. Las cuentas de negocio
          podran tener su propio panel en una fase posterior.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return <p>Cargando reservas...</p>;
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
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
