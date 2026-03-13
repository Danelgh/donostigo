import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import BusinessDetailPage from "./pages/BusinessDetailPage.jsx";
import BusinessListPage from "./pages/BusinessListPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyReservationsPage from "./pages/MyReservationsPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { fetchCurrentUser } from "./services/api.js";

const AUTH_STORAGE_KEY = "donostigo_auth";

function loadStoredAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (_error) {
    return null;
  }
}

export default function App() {
  const [storedAuth] = useState(loadStoredAuth);
  const [auth, setAuth] = useState(null);
  const [isHydratingAuth, setIsHydratingAuth] = useState(Boolean(storedAuth?.token));

  useEffect(() => {
    if (!storedAuth?.token) {
      setIsHydratingAuth(false);
      return;
    }

    fetchCurrentUser(storedAuth.token)
      .then((data) => {
        setAuth({
          token: storedAuth.token,
          user: data.user
        });
      })
      .catch(() => {
        setAuth(null);
      })
      .finally(() => {
        setIsHydratingAuth(false);
      });
  }, [storedAuth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (auth) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [auth]);

  function handleAuthSuccess(session) {
    setAuth(session);
    setIsHydratingAuth(false);
  }

  function handleLogout() {
    setAuth(null);
    setIsHydratingAuth(false);
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
                <strong>{auth.user.name}</strong>
                <span>{auth.user.role === "business" ? "Negocio" : "Usuario"}</span>
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
          <Route path="/businesses" element={<BusinessListPage />} />
          <Route path="/businesses/:id" element={<BusinessDetailPage auth={auth} />} />
          <Route path="/my-reservations" element={<MyReservationsPage auth={auth} />} />
        </Routes>
      </main>
    </div>
  );
}
