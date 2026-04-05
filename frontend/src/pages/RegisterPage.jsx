import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { pick, useI18n } from "../i18n/I18nProvider.jsx";
import { registerUser } from "../services/api.js";

export default function RegisterPage({ auth, isHydratingAuth, onAuthSuccess }) {
  const navigate = useNavigate();
  const { language } = useI18n();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordLength = formData.password.length;
  const selectedRoleLabel = formData.role === "business"
    ? pick({ es: "Negocio local", en: "Local business", eu: "Tokiko negozioa" }, language)
    : pick({ es: "Usuario cliente", en: "Client user", eu: "Bezero erabiltzailea" }, language);

  function t(copy, variables) {
    return pick(copy, language, variables);
  }

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
      navigate("/onboarding");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isHydratingAuth) {
    return <p>{t({ es: "Verificando sesion...", en: "Checking session...", eu: "Saioa egiaztatzen..." })}</p>;
  }

  if (auth) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <section className="auth-layout">
      <article className="card auth-card">
        <p className="eyebrow">{t({ es: "Nueva cuenta", en: "New account", eu: "Kontu berria" })}</p>
        <h2>{t({ es: "Registro", en: "Sign up", eu: "Erregistroa" })}</h2>
        <p className="auth-copy">
          {t({
            es: "Crea una cuenta como usuario cliente o como negocio para acceder a las funciones disponibles en esta primera version del proyecto.",
            en: "Create an account as a client or as a business to access the features available in this first project version.",
            eu: "Sortu kontu bat bezero edo negozio gisa proiektuaren lehen bertsio honetako funtzioak erabiltzeko."
          })}
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t({ es: "Nombre", en: "Name", eu: "Izena" })}
            value={formData.name}
            maxLength={100}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
          <input
            type="email"
            placeholder={t({ es: "Email", en: "Email", eu: "Emaila" })}
            value={formData.email}
            maxLength={150}
            onChange={(event) => updateField("email", event.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t({ es: "Contrasena", en: "Password", eu: "Pasahitza" })}
            value={formData.password}
            onChange={(event) => updateField("password", event.target.value)}
            minLength="8"
            required
          />
          <p className="detail-note">
            {t({
              es: "Minimo 8 caracteres. Esta version prioriza un acceso funcional y la seguridad basica mediante hash de contrasena y sesion autenticada.",
              en: "Minimum 8 characters. This version focuses on a functional access flow and basic security through password hashing and authenticated sessions.",
              eu: "Gutxienez 8 karaktere. Bertsio honek sarbide funtzionala eta oinarrizko segurtasuna lehenesten ditu, pasahitz-hash eta autentifikatutako saioaren bidez."
            })}
          </p>
          <select
            value={formData.role}
            onChange={(event) => updateField("role", event.target.value)}
          >
            <option value="user">{t({ es: "Usuario", en: "Client", eu: "Bezeroa" })}</option>
            <option value="business">{t({ es: "Negocio", en: "Business", eu: "Negozioa" })}</option>
          </select>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t({ es: "Creando cuenta...", en: "Creating account...", eu: "Kontua sortzen..." })
              : t({ es: "Crear cuenta", en: "Create account", eu: "Sortu kontua" })}
          </button>
        </form>

        <div className="auth-helper-grid">
          <article className="auth-helper-card">
            <strong>{t({ es: "Rol seleccionado", en: "Selected role", eu: "Hautatutako rola" })}</strong>
            <p>{selectedRoleLabel}</p>
          </article>
          <article className="auth-helper-card">
            <strong>{t({ es: "Contrasena", en: "Password", eu: "Pasahitza" })}</strong>
            <p>
              {passwordLength >= 8
                ? t({ es: "Longitud minima completada.", en: "Minimum length reached.", eu: "Gutxieneko luzera beteta." })
                : t(
                    {
                      es: "Faltan {{count}} caracteres para el minimo.",
                      en: "{{count}} characters left to reach the minimum.",
                      eu: "{{count}} karaktere falta dira gutxienekora heltzeko."
                    },
                    { count: 8 - passwordLength }
                  )}
            </p>
          </article>
        </div>

        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

        <p className="auth-footer">
          {t({
            es: "Si ya tienes una cuenta creada, puedes ",
            en: "If you already have an account, you can ",
            eu: "Dagoeneko kontu bat baduzu, hemen "
          })}
          <Link to="/login">{t({ es: "iniciar sesion aqui", en: "log in here", eu: "saioa hasi" })}</Link>.
        </p>
      </article>

      <aside className="card auth-showcase auth-showcase-warm">
        <p className="eyebrow">{t({ es: "Roles", en: "Roles", eu: "Rolak" })}</p>
        <h3>{t({ es: "Tipos de cuenta disponibles", en: "Available account types", eu: "Eskuragarri dauden kontu motak" })}</h3>
        <div className="auth-role-list">
          <div className={formData.role === "user" ? "auth-role-option is-active" : "auth-role-option"}>
            <strong>{t({ es: "Usuario cliente", en: "Client user", eu: "Bezero erabiltzailea" })}</strong>
            <span>{t({ es: "Consulta negocios, reserva y revisa su historial.", en: "Explore businesses, book and review activity.", eu: "Negozioak ikusi, erreserbatu eta jarduera berrikusi." })}</span>
          </div>
          <div className={formData.role === "business" ? "auth-role-option is-active" : "auth-role-option"}>
            <strong>{t({ es: "Negocio local", en: "Local business", eu: "Tokiko negozioa" })}</strong>
            <span>{t({ es: "Cuenta preparada para futuras vistas de gestion y panel comercial.", en: "Account prepared for business management and the commercial panel.", eu: "Kudeaketa eta merkataritza-panelerako prestatutako kontua." })}</span>
          </div>
        </div>
        <div className="auth-role-summary">
          <strong>{selectedRoleLabel}</strong>
          <p>
            {formData.role === "business"
              ? t({
                  es: "Pensada para crear la ficha publica del establecimiento y revisar reservas recibidas.",
                  en: "Built to create the public profile and review incoming bookings.",
                  eu: "Establezimenduaren fitxa publikoa sortu eta jasotako erreserbak berrikusteko pentsatua."
                })
              : t({
                  es: "Pensada para explorar el catalogo, reservar servicios y publicar resenas tras una experiencia valida.",
                  en: "Built to explore the catalogue, book services and publish reviews after a valid experience.",
                  eu: "Katalogoa esploratu, zerbitzuak erreserbatu eta esperientzia baliozko baten ondoren iritziak argitaratzeko pentsatua."
                })}
          </p>
        </div>
        <p className="auth-copy">
          {t({
            es: "El registro ya forma parte del flujo funcional implementado en la aplicacion.",
            en: "Sign up is already part of the functional flow implemented in the app.",
            eu: "Erregistroa aplikazioan ezarritako fluxu funtzionalaren parte da jada."
          })}
        </p>
      </aside>
    </section>
  );
}
