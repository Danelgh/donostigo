import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import logoPrometeo from "./assets/logo-prometeo.jpg";
import logoThePowerFp from "./assets/logo-thepowerfp.png";
import BusinessDetailPage from "./pages/BusinessDetailPage.jsx";
import BusinessListPage from "./pages/BusinessListPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyReservationsPage from "./pages/MyReservationsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { fetchCurrentUser, logoutUser } from "./services/api.js";
import { getBusinessInitials } from "./utils/businessTheme.js";

export default function App() {
  const [auth, setAuth] = useState(null);
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then((data) => {
        setAuth({
          user: data.user
        });
      })
      .catch(() => {
        setAuth(null);
      })
      .finally(() => {
        setIsHydratingAuth(false);
      });
  }, []);

  function handleAuthSuccess(session) {
    setAuth({ user: session.user });
    setIsHydratingAuth(false);
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (_error) {
      // Aunque falle la API, cerramos el estado local para no bloquear la interfaz.
    } finally {
      setAuth(null);
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
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand-link" to="/">
          <h1>DonostiGo</h1>
        </Link>

        <nav className="topbar-nav">
          <Link to="/">Inicio</Link>
          <Link to="/businesses">Negocios</Link>
          <Link to="/my-reservations">Mis reservas</Link>
          {auth ? <Link to="/profile">Mi perfil</Link> : null}
        </nav>

        <div className="topbar-actions">
          {isHydratingAuth ? (
            <div className="user-badge">
              <strong>Verificando sesion</strong>
              <span>Comprobando acceso guardado</span>
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
                    <span>{auth.user.role === "business" ? "Negocio" : "Usuario"}</span>
                  </div>
                </div>
              </div>
              <button type="button" className="button secondary" onClick={handleLogout}>
                Cerrar sesion
              </button>
            </>
          ) : (
            <>
              <Link className="button secondary" to="/login">
                Login
              </Link>
              <Link className="button" to="/register">
                Registro
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
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
            path="/profile"
            element={<ProfilePage auth={auth} onUserUpdate={handleUserUpdate} />}
          />
          <Route path="/businesses" element={<BusinessListPage />} />
          <Route path="/businesses/:id" element={<BusinessDetailPage auth={auth} />} />
          <Route path="/my-reservations" element={<MyReservationsPage auth={auth} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="site-footer-copy">
          <strong>DonostiGo</strong>
          <p>
            Proyecto academico desarrollado como Trabajo de Fin de Grado de Desarrollo de
            Aplicaciones Web.
          </p>
        </div>

        <div className="site-footer-logos">
          <div className="site-footer-logo-block">
            <span>Centro / programa</span>
            <img src={logoThePowerFp} alt="Logo de ThePower FP" />
          </div>
          <div className="site-footer-logo-block">
            <span>Entorno academico</span>
            <img src={logoPrometeo} alt="Logo de Prometeo" />
          </div>
        </div>
      </footer>
    </div>
  );
}
