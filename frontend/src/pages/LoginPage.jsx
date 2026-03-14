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
      navigate("/profile");
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
    return <Navigate to="/profile" replace />;
  }

  return (
    <section className="auth-layout">
      <article className="card auth-card">
        <p className="eyebrow">Acceso</p>
        <h2>Iniciar sesion</h2>
        <p className="auth-copy">
          Accede con tu cuenta para consultar reservas y utilizar las funcionalidades
          disponibles para usuarios registrados.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            maxLength={150}
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
      </article>

      <aside className="card auth-showcase">
        <p className="eyebrow">Cuentas de prueba</p>
        <h3>Accesos disponibles para pruebas</h3>
        <div className="auth-demo-block">
          <strong>Usuario cliente</strong>
          <span>ane@donostigo.local</span>
          <span>Demo1234</span>
        </div>
        <div className="auth-demo-block">
          <strong>Cuenta de negocio</strong>
          <span>surf@donostigo.local</span>
          <span>Demo1234</span>
        </div>
        <p className="auth-copy">
          Estas cuentas permiten comprobar rapidamente el funcionamiento del sistema de
          autenticacion durante las pruebas.
        </p>
      </aside>
    </section>
  );
}
