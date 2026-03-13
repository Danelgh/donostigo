import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchCategories,
  fetchMyBusinessProfile,
  saveMyBusinessProfile,
  updateCurrentUser
} from "../services/api.js";
import { getBusinessInitials } from "../utils/businessTheme.js";

function createInitialState(user) {
  return {
    name: user?.name ?? "",
    city: user?.city ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    bio: user?.bio ?? "",
    instagramUrl: user?.instagramUrl ?? "",
    tiktokUrl: user?.tiktokUrl ?? "",
    featuredPostUrl: user?.featuredPostUrl ?? ""
  };
}

export default function ProfilePage({ auth, onUserUpdate }) {
  const [formData, setFormData] = useState(createInitialState(auth?.user));
  const [businessFormData, setBusinessFormData] = useState({
    name: "",
    categoryId: "",
    description: "",
    address: "",
    phone: ""
  });
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBusinessData, setIsLoadingBusinessData] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [businessSuccessMessage, setBusinessSuccessMessage] = useState("");
  const [businessErrorMessage, setBusinessErrorMessage] = useState("");

  useEffect(() => {
    setFormData(createInitialState(auth?.user));
  }, [auth]);

  useEffect(() => {
    if (!auth || auth.user.role !== "business") {
      setCategories([]);
      setBusinessFormData({
        name: "",
        categoryId: "",
        description: "",
        address: "",
        phone: ""
      });
      setBusinessSuccessMessage("");
      setBusinessErrorMessage("");
      return;
    }

    setIsLoadingBusinessData(true);
    setBusinessErrorMessage("");

    Promise.all([fetchCategories(), fetchMyBusinessProfile()])
      .then(([categoryData, businessData]) => {
        setCategories(categoryData);

        if (businessData.business) {
          setBusinessFormData({
            name: businessData.business.name ?? auth.user.name,
            categoryId: businessData.business.categoryId
              ? String(businessData.business.categoryId)
              : "",
            description: businessData.business.description ?? "",
            address: businessData.business.address ?? "",
            phone: businessData.business.phone ?? ""
          });
          return;
        }

        setBusinessFormData({
          name: auth.user.name,
          categoryId: "",
          description: "",
          address: "",
          phone: ""
        });
      })
      .catch((error) => {
        setCategories([]);
        setBusinessErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoadingBusinessData(false);
      });
  }, [auth]);

  const socialLinks = useMemo(
    () =>
      [
        { label: "Instagram", value: formData.instagramUrl },
        { label: "TikTok", value: formData.tiktokUrl },
        { label: "Publicacion destacada", value: formData.featuredPostUrl }
      ].filter((item) => item.value),
    [formData.featuredPostUrl, formData.instagramUrl, formData.tiktokUrl]
  );

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBusinessField(field, value) {
    setBusinessFormData((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await updateCurrentUser(formData);
      onUserUpdate(response.user);
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBusinessSubmit(event) {
    event.preventDefault();
    setIsLoadingBusinessData(true);
    setBusinessSuccessMessage("");
    setBusinessErrorMessage("");

    try {
      const response = await saveMyBusinessProfile({
        ...businessFormData,
        categoryId: Number(businessFormData.categoryId)
      });
      setBusinessSuccessMessage(response.message);
      setBusinessFormData({
        name: response.business.name ?? "",
        categoryId: response.business.categoryId ? String(response.business.categoryId) : "",
        description: response.business.description ?? "",
        address: response.business.address ?? "",
        phone: response.business.phone ?? ""
      });
    } catch (error) {
      setBusinessErrorMessage(error.message);
    } finally {
      setIsLoadingBusinessData(false);
    }
  }

  if (!auth) {
    return (
      <section className="card auth-card">
        <h2>Mi perfil</h2>
        <p className="auth-copy">
          Inicia sesion para editar tu perfil, anadir una foto y mostrar tus enlaces sociales.
        </p>
        <Link className="button" to="/login">
          Ir a login
        </Link>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <header className="card profile-hero">
        <div className="profile-hero-copy">
          <p className="eyebrow">Perfil</p>
          <h2>Tu espacio personal dentro de DonostiGo</h2>
          <p className="section-copy">
            En esta fase puedes editar los datos basicos del perfil, mostrar una foto mediante
            URL y enlazar tus redes o una publicacion destacada.
          </p>
        </div>

        <div className="profile-hero-meta">
          <div>
            <strong>{auth.user.role === "business" ? "Cuenta de negocio" : "Cuenta cliente"}</strong>
            <span>{auth.user.email}</span>
          </div>
          <div>
            <strong>Visibilidad</strong>
            <span>Datos visibles dentro de la aplicacion</span>
          </div>
        </div>
      </header>

      <div className="profile-layout">
        <div className="profile-stack">
          <article className="card">
            <h3>Editar perfil</h3>
            <p className="section-copy">
              Puedes ajustar la informacion publica sin tocar el email ni la contrasena.
            </p>

            <form className="form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Nombre visible"
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Ciudad"
                value={formData.city}
                onChange={(event) => updateField("city", event.target.value)}
              />
              <input
                type="url"
                placeholder="URL de la foto de perfil"
                value={formData.avatarUrl}
                onChange={(event) => updateField("avatarUrl", event.target.value)}
              />
              <textarea
                rows="5"
                placeholder="Presentacion breve"
                value={formData.bio}
                onChange={(event) => updateField("bio", event.target.value)}
              />
              <input
                type="url"
                placeholder="URL de Instagram"
                value={formData.instagramUrl}
                onChange={(event) => updateField("instagramUrl", event.target.value)}
              />
              <input
                type="url"
                placeholder="URL de TikTok"
                value={formData.tiktokUrl}
                onChange={(event) => updateField("tiktokUrl", event.target.value)}
              />
              <input
                type="url"
                placeholder="URL de publicacion destacada"
                value={formData.featuredPostUrl}
                onChange={(event) => updateField("featuredPostUrl", event.target.value)}
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar perfil"}
              </button>
            </form>

            {successMessage ? <p className="status-message success">{successMessage}</p> : null}
            {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
          </article>

          {auth.user.role === "business" ? (
            <article className="card">
              <h3>Ficha del negocio</h3>
              <p className="section-copy">
                Esta parte es la que realmente crea o actualiza tu negocio dentro del catalogo.
                Si la dejas vacia, tu cuenta existe, pero tu establecimiento no aparece en la
                plataforma.
              </p>

              {isLoadingBusinessData && categories.length === 0 ? <p>Cargando ficha...</p> : null}

              <form className="form" onSubmit={handleBusinessSubmit}>
                <input
                  type="text"
                  placeholder="Nombre comercial"
                  value={businessFormData.name}
                  onChange={(event) => updateBusinessField("name", event.target.value)}
                  required
                />
                <select
                  value={businessFormData.categoryId}
                  onChange={(event) => updateBusinessField("categoryId", event.target.value)}
                  required
                >
                  <option value="">Selecciona una categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <textarea
                  rows="5"
                  placeholder="Descripcion del negocio"
                  value={businessFormData.description}
                  onChange={(event) => updateBusinessField("description", event.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Direccion"
                  value={businessFormData.address}
                  onChange={(event) => updateBusinessField("address", event.target.value)}
                  required
                />
                <p className="detail-note">
                  Esta direccion se utilizara para mostrar la ubicacion del negocio y abrirla
                  directamente en Google Maps desde la ficha publica.
                </p>
                <input
                  type="text"
                  placeholder="Telefono"
                  value={businessFormData.phone}
                  onChange={(event) => updateBusinessField("phone", event.target.value)}
                />
                <button type="submit" disabled={isLoadingBusinessData}>
                  {isLoadingBusinessData ? "Guardando..." : "Guardar ficha del negocio"}
                </button>
              </form>

              {businessSuccessMessage ? (
                <p className="status-message success">{businessSuccessMessage}</p>
              ) : null}
              {businessErrorMessage ? (
                <p className="status-message error">{businessErrorMessage}</p>
              ) : null}
            </article>
          ) : null}
        </div>

        <aside className="card profile-preview">
          <p className="eyebrow">Vista previa</p>
          <div className="profile-preview-header">
            {formData.avatarUrl ? (
              <img
                className="profile-avatar"
                src={formData.avatarUrl}
                alt={`Foto de perfil de ${formData.name || auth.user.name}`}
              />
            ) : (
              <span className="profile-avatar profile-avatar-fallback">
                {getBusinessInitials(formData.name || auth.user.name)}
              </span>
            )}
            <div>
              <h3>{formData.name || auth.user.name}</h3>
              <p>{formData.city || "Donostia-San Sebastian"}</p>
            </div>
          </div>

          <p className="profile-bio">
            {formData.bio || "Todavia no has escrito una presentacion para tu perfil."}
          </p>

          <div className="profile-socials">
            <strong>Enlaces visibles</strong>
            {socialLinks.length === 0 ? (
              <p className="section-copy">
                Anade una URL para que tu perfil muestre redes o una publicacion destacada.
              </p>
            ) : (
              <div className="profile-link-list">
                {socialLinks.map((link) => (
                  <a key={link.label} href={link.value} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {auth.user.role === "business" ? (
            <div className="profile-socials">
              <strong>Estado del negocio</strong>
              <p className="section-copy">
                {businessFormData.description && businessFormData.address
                  ? "La ficha tiene datos suficientes para formar parte del catalogo."
                  : "Todavia falta completar la ficha comercial para que el negocio quede bien presentado."}
              </p>
            </div>
          ) : null}

          <p className="detail-note">
            La integracion automatica con redes sociales queda planteada como mejora futura. En
            esta version se muestran enlaces manuales.
          </p>
        </aside>
      </div>
    </section>
  );
}
