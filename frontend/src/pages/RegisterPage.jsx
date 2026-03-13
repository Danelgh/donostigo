import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api.js";

export default function RegisterPage({ auth, isHydratingAuth, onAuthSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const session = await registerUser(formData);
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
        <p className="eyebrow">Nueva cuenta</p>
        <h2>Registro</h2>
        <p className="auth-copy">
          Crea una cuenta como usuario cliente o como negocio para acceder a las funciones
          disponibles en esta primera version del proyecto.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            value={formData.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contrasena"
            value={formData.password}
            onChange={(event) => updateField("password", event.target.value)}
            minLength="8"
            required
          />
          <select
            value={formData.role}
            onChange={(event) => updateField("role", event.target.value)}
          >
            <option value="user">Usuario</option>
            <option value="business">Negocio</option>
          </select>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

        <p className="auth-footer">
          Si ya tienes una cuenta creada, puedes <Link to="/login">iniciar sesion aqui</Link>.
        </p>
      </article>

      <aside className="card auth-showcase auth-showcase-warm">
        <p className="eyebrow">Roles</p>
        <h3>Tipos de cuenta disponibles</h3>
        <div className="auth-role-list">
          <div>
            <strong>Usuario cliente</strong>
            <span>Consulta negocios, reserva y revisa su historial.</span>
          </div>
          <div>
            <strong>Negocio local</strong>
            <span>Cuenta preparada para futuras vistas de gestion y panel comercial.</span>
          </div>
        </div>
        <p className="auth-copy">
          El registro ya forma parte del flujo funcional implementado en la aplicacion.
        </p>
      </aside>
    </section>
  );
}
