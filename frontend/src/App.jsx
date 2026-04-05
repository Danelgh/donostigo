import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import logoPrometeo from "./assets/logo-prometeo.jpg";
import logoThePowerFp from "./assets/logo-thepowerfp.png";
import { LANGUAGE_OPTIONS, pick, useI18n } from "./i18n/I18nProvider.jsx";
import BusinessDetailPage from "./pages/BusinessDetailPage.jsx";
import BusinessListPage from "./pages/BusinessListPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyReservationsPage from "./pages/MyReservationsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PublicGuideDetailPage from "./pages/PublicGuideDetailPage.jsx";
import PublicGuidesPage from "./pages/PublicGuidesPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import SavedListsPage from "./pages/SavedListsPage.jsx";
import { fetchCurrentUser, logoutUser } from "./services/api.js";
import { getBusinessInitials } from "./utils/businessTheme.js";
import { getOnboardingState } from "./utils/onboarding.js";

export default function App() {
  const { language, setLanguage } = useI18n();
  const location = useLocation();
  const [auth, setAuth] = useState(null);
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);
  const [isOnboardingPending, setIsOnboardingPending] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  function syncOnboardingStatus(nextUser) {
    if (!nextUser) {
      setIsOnboardingPending(false);
      return;
    }

    const onboardingState = getOnboardingState(nextUser);
    setIsOnboardingPending(!onboardingState.completedAt);
  }

  useEffect(() => {
    fetchCurrentUser()
      .then((data) => {
        setAuth({
          user: data.user
        });
        syncOnboardingStatus(data.user);
      })
      .catch(() => {
        setAuth(null);
        setIsOnboardingPending(false);
      })
      .finally(() => {
        setIsHydratingAuth(false);
      });
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 820) {
        setIsMobileNavOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleAuthSuccess(session) {
    setAuth({ user: session.user });
    syncOnboardingStatus(session.user);
    setIsHydratingAuth(false);
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (_error) {
      // Aunque falle la API, cerramos el estado local para no bloquear la interfaz.
    } finally {
      setAuth(null);
      setIsOnboardingPending(false);
      setIsHydratingAuth(false);
    }
  }

  function handleUserUpdate(user) {
    setAuth((currentAuth) => {
      if (!currentAuth) {
        return currentAuth;
      }

      return {
        ...currentAuth,
        user
      };
    });
    syncOnboardingStatus(user);
  }

  return (
    <div className="app-shell">
      <header className={isMobileNavOpen ? "topbar is-mobile-open" : "topbar"}>
        <div className="topbar-head">
          <Link className="brand-link" to="/">
            <div>
              <h1>DonostiGo</h1>
              <span className="brand-subtitle">
                {pick(
                  {
                    es: "Donostia · planes y negocios locales",
                    en: "Donostia · local plans and businesses",
                    eu: "Donostia · tokiko planak eta negozioak"
                  },
                  language
                )}
              </span>
            </div>
          </Link>

          <button
            type="button"
            className="topbar-menu-button"
            aria-expanded={isMobileNavOpen}
            aria-controls="topbar-panel"
            aria-label={pick(
              {
                es: isMobileNavOpen ? "Cerrar navegación" : "Abrir navegación",
                en: isMobileNavOpen ? "Close navigation" : "Open navigation",
                eu: isMobileNavOpen ? "Nabigazioa itxi" : "Nabigazioa ireki"
              },
              language
            )}
            onClick={() => setIsMobileNavOpen((current) => !current)}
          >
            <span />
            <span />
          </button>
        </div>

        <div className="topbar-panel" id="topbar-panel">
          <nav className="topbar-nav">
            <NavLink to="/" end>{pick({ es: "Inicio", en: "Home", eu: "Hasiera" }, language)}</NavLink>
            <NavLink to="/businesses">{pick({ es: "Negocios", en: "Businesses", eu: "Negozioak" }, language)}</NavLink>
            <NavLink to="/guides">{pick({ es: "Guias", en: "Guides", eu: "Gidak" }, language)}</NavLink>
            {auth?.user.role === "user" ? (
              <NavLink to="/notifications">{pick({ es: "Avisos", en: "Updates", eu: "Abisuak" }, language)}</NavLink>
            ) : null}
            {auth?.user.role === "user" ? (
              <NavLink to="/saved-lists">{pick({ es: "Guardados", en: "Saved", eu: "Gordetakoak" }, language)}</NavLink>
            ) : null}
            <NavLink to="/my-reservations">{pick({ es: "Mi actividad", en: "Activity", eu: "Jarduera" }, language)}</NavLink>
            {auth ? <NavLink to="/profile">{pick({ es: "Mi perfil", en: "Profile", eu: "Profila" }, language)}</NavLink> : null}
          </nav>

          <div className="topbar-actions">
            <div className="language-switcher" aria-label={pick({ es: "Idioma", en: "Language", eu: "Hizkuntza" }, language)}>
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={language === option.value ? "language-switcher-button is-active" : "language-switcher-button"}
                  onClick={() => setLanguage(option.value)}
                >
                  <span
                    className={`language-switcher-flag language-switcher-flag-${option.value}`}
                    aria-hidden="true"
                  />
                  <span>{option.shortLabel}</span>
                </button>
              ))}
            </div>
            {isHydratingAuth ? (
              <div className="user-badge">
                <strong>{pick({ es: "Verificando sesion", en: "Checking session", eu: "Saioa egiaztatzen" }, language)}</strong>
                <span>{pick({ es: "Comprobando acceso guardado", en: "Checking saved access", eu: "Gordetako sarbidea egiaztatzen" }, language)}</span>
              </div>
            ) : auth ? (
              <>
                <div className="user-badge">
                  <div className="user-badge-row">
                    {auth.user.avatarUrl ? (
                      <img
                        className="topbar-avatar"
                        src={auth.user.avatarUrl}
                        alt={`Foto de ${auth.user.name}`}
                      />
                    ) : (
                      <span className="topbar-avatar topbar-avatar-fallback">
                        {getBusinessInitials(auth.user.name)}
                      </span>
                    )}
                    <div>
                      <strong>{auth.user.name}</strong>
                      <span>
                        {auth.user.role === "business"
                          ? pick({ es: "Cuenta negocio", en: "Business account", eu: "Negozio kontua" }, language)
                          : pick({ es: "Cuenta cliente", en: "Client account", eu: "Bezero kontua" }, language)}
                        {isOnboardingPending
                          ? ` · ${pick({ es: "perfil pendiente", en: "profile pending", eu: "profila osatu gabe" }, language)}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
                {isOnboardingPending ? (
                  <Link className="topbar-quiet-link" to="/onboarding">
                    {pick({ es: "Completar perfil", en: "Complete profile", eu: "Profila osatu" }, language)}
                  </Link>
                ) : null}
                <button type="button" className="button secondary" onClick={handleLogout}>
                  {pick({ es: "Cerrar sesion", en: "Log out", eu: "Saioa itxi" }, language)}
                </button>
              </>
            ) : (
              <>
                <Link className="button secondary" to="/login">
                  {pick({ es: "Login", en: "Login", eu: "Saioa hasi" }, language)}
                </Link>
                <Link className="button" to="/register">
                  {pick({ es: "Registro", en: "Sign up", eu: "Erregistratu" }, language)}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="content">
        <div className="page-transition" key={`${location.pathname}${location.search}`}>
          <Routes location={location}>
          <Route path="/" element={<HomePage auth={auth} />} />
          <Route
            path="/login"
            element={
              <LoginPage
                auth={auth}
                isHydratingAuth={isHydratingAuth}
                onAuthSuccess={handleAuthSuccess}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterPage
                auth={auth}
                isHydratingAuth={isHydratingAuth}
                onAuthSuccess={handleAuthSuccess}
              />
            }
          />
          <Route
            path="/onboarding"
            element={
              <OnboardingPage
                auth={auth}
                isHydratingAuth={isHydratingAuth}
                onUserUpdate={handleUserUpdate}
                onOnboardingChange={syncOnboardingStatus}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                auth={auth}
                isHydratingAuth={isHydratingAuth}
                onUserUpdate={handleUserUpdate}
              />
            }
          />
          <Route path="/businesses" element={<BusinessListPage />} />
          <Route path="/guides" element={<PublicGuidesPage />} />
          <Route path="/guides/:slug" element={<PublicGuideDetailPage auth={auth} />} />
          <Route
            path="/businesses/:id"
            element={<BusinessDetailPage auth={auth} isHydratingAuth={isHydratingAuth} />}
          />
          <Route
            path="/notifications"
            element={<NotificationsPage auth={auth} isHydratingAuth={isHydratingAuth} />}
          />
          <Route
            path="/saved-lists"
            element={<SavedListsPage auth={auth} isHydratingAuth={isHydratingAuth} />}
          />
          <Route
            path="/my-reservations"
            element={<MyReservationsPage auth={auth} isHydratingAuth={isHydratingAuth} />}
          />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer-copy">
          <strong>DonostiGo</strong>
          <p>
            {pick(
              {
                es: "Una plataforma local para descubrir negocios, guardar planes y seguir toda tu actividad desde un mismo sitio.",
                en: "A local platform to discover businesses, save plans and track your activity from one place.",
                eu: "Negozioak ezagutzeko, planak gordetzeko eta jarduera toki bakarretik jarraitzeko tokiko plataforma bat."
              },
              language
            )}
          </p>
        </div>

        <div className="site-footer-logos">
          <div className="site-footer-logo-block">
            <span>{pick({ es: "Centro", en: "School", eu: "Ikastegia" }, language)}</span>
            <img src={logoThePowerFp} alt="Logo de ThePower FP" />
          </div>
          <div className="site-footer-logo-block">
            <span>{pick({ es: "Programa", en: "Programme", eu: "Programa" }, language)}</span>
            <img src={logoPrometeo} alt="Logo de Prometeo" />
          </div>
        </div>
      </footer>
    </div>
  );
}
