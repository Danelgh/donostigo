import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { pick, useI18n } from "../i18n/I18nProvider.jsx";
import { loginUser } from "../services/api.js";

export default function LoginPage({ auth, isHydratingAuth, onAuthSuccess }) {
  const navigate = useNavigate();
  const { language } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function t(copy, variables) {
    return pick(copy, language, variables);
  }

  function applyDemoAccess(nextEmail) {
    setEmail(nextEmail);
    setPassword("Demo1234");
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const session = await loginUser({ email, password });
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
        <p className="eyebrow">{t({ es: "Acceso", en: "Access", eu: "Sarbidea" })}</p>
        <h2>{t({ es: "Iniciar sesion", en: "Log in", eu: "Saioa hasi" })}</h2>
        <p className="auth-copy">
          {t({
            es: "Accede con tu cuenta para consultar reservas y utilizar las funcionalidades disponibles para usuarios registrados.",
            en: "Sign in to review bookings and use the features available to registered users.",
            eu: "Hasi saioa erreserbak ikusteko eta erregistratutako erabiltzaileentzako funtzioak erabiltzeko."
          })}
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder={t({ es: "Email", en: "Email", eu: "Emaila" })}
            value={email}
            maxLength={150}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t({ es: "Contrasena", en: "Password", eu: "Pasahitza" })}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength="8"
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t({ es: "Entrando...", en: "Signing in...", eu: "Sartzen..." })
              : t({ es: "Entrar", en: "Log in", eu: "Sartu" })}
          </button>
        </form>

        <div className="auth-helper-grid">
          <article className="auth-helper-card">
            <strong>{t({ es: "Acceso rapido cliente", en: "Quick client access", eu: "Bezero sarbide azkarra" })}</strong>
            <p>
              {t({
                es: "Rellena automaticamente la cuenta demo de usuario para probar reservas.",
                en: "Fill the demo client account automatically to test bookings.",
                eu: "Bete automatikoki demo bezero-kontua erreserbak probatzeko."
              })}
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={() => applyDemoAccess("ane@donostigo.local")}
            >
              {t({ es: "Usar cuenta cliente", en: "Use client account", eu: "Erabili bezero-kontua" })}
            </button>
          </article>
          <article className="auth-helper-card">
            <strong>{t({ es: "Acceso rapido negocio", en: "Quick business access", eu: "Negozio sarbide azkarra" })}</strong>
            <p>
              {t({
                es: "Rellena la cuenta demo de negocio para revisar reservas recibidas y gestion.",
                en: "Fill the demo business account to review incoming bookings and operations.",
                eu: "Bete demo negozio-kontua jasotako erreserbak eta kudeaketa ikusteko."
              })}
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={() => applyDemoAccess("surf@donostigo.local")}
            >
              {t({ es: "Usar cuenta negocio", en: "Use business account", eu: "Erabili negozio-kontua" })}
            </button>
          </article>
        </div>

        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

        <p className="auth-footer">
          {t({
            es: "Si todavia no tienes cuenta, puedes ",
            en: "If you do not have an account yet, you can ",
            eu: "Oraindik konturik ez baduzu, hemen "
          })}
          <Link to="/register">{t({ es: "registrarte aqui", en: "sign up here", eu: "erregistratu" })}</Link>.
        </p>
      </article>

      <aside className="card auth-showcase">
        <p className="eyebrow">{t({ es: "Cuentas de prueba", en: "Demo accounts", eu: "Demo kontuak" })}</p>
        <h3>{t({ es: "Accesos disponibles para pruebas", en: "Accounts ready for testing", eu: "Probatzeko prest dauden kontuak" })}</h3>
        <div className="auth-demo-block">
          <strong>{t({ es: "Usuario cliente", en: "Client user", eu: "Bezero erabiltzailea" })}</strong>
          <span>ane@donostigo.local</span>
          <span>Demo1234</span>
        </div>
        <div className="auth-demo-block">
          <strong>{t({ es: "Cuenta de negocio", en: "Business account", eu: "Negozio kontua" })}</strong>
          <span>surf@donostigo.local</span>
          <span>Demo1234</span>
        </div>
        <p className="auth-copy">
          {t({
            es: "Estas cuentas permiten comprobar rapidamente el funcionamiento del sistema de autenticacion durante las pruebas.",
            en: "These accounts let you verify the authentication flow quickly during testing.",
            eu: "Kontu hauek autentifikazio-fluxua azkar egiaztatzeko balio dute probetan."
          })}
        </p>
        <div className="auth-role-list">
          <div>
            <strong>{t({ es: "Cliente", en: "Client", eu: "Bezeroa" })}</strong>
            <span>
              {t({
                es: "Puede reservar, consultar su historial y publicar resenas validas.",
                en: "Can book, review activity history and publish valid reviews.",
                eu: "Erreserbatu, bere jarduera-ibilbidea ikusi eta baliozko iritziak argitaratu ditzake."
              })}
            </span>
          </div>
          <div>
            <strong>{t({ es: "Negocio", en: "Business", eu: "Negozioa" })}</strong>
            <span>
              {t({
                es: "Puede completar su ficha y gestionar el estado de las reservas recibidas.",
                en: "Can complete the public profile and manage incoming bookings.",
                eu: "Bere fitxa osatu eta jasotako erreserben egoera kudeatu dezake."
              })}
            </span>
          </div>
        </div>
      </aside>
    </section>
  );
}
