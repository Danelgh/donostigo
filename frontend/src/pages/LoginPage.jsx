import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api.js";

export default function LoginPage({ auth, isHydratingAuth, onAuthSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const session = await loginUser({ email, password });
      onAuthSuccess(session);
      navigate("/my-reservations");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isHydratingAuth) {
    return <p>Verificando sesion...</p>;
  }

  if (auth) {
    return <Navigate to="/my-reservations" replace />;
  }

  return (
    <section className="card auth-card">
      <p className="eyebrow">Acceso</p>
      <h2>Iniciar sesion</h2>
      <p className="auth-copy">
        Accede con tu cuenta para consultar reservas o realizar nuevas solicitudes desde el
        detalle del negocio.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contrasena"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength="8"
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <p className="auth-footer">
        Si todavia no tienes cuenta, puedes <Link to="/register">registrarte aqui</Link>.
      </p>
    </section>
  );
}
