import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatLocaleDate, pick, useI18n } from "../i18n/I18nProvider.jsx";
import {
  createSavedList,
  deleteSavedList,
  fetchSavedLists,
  removeBusinessFromSavedList,
  updateSavedList
} from "../services/api.js";
import { getServiceModeConfig } from "../utils/serviceMode.js";

function buildSavedSummary(lists) {
  const totalBusinesses = lists.reduce((total, list) => total + list.businesses.length, 0);
  const uniqueBusinessCount = new Set(
    lists.flatMap((list) => list.businesses.map((business) => business.id))
  ).size;

  return {
    listCount: lists.length,
    totalBusinesses,
    uniqueBusinessCount,
    publicListCount: lists.filter((list) => list.isPublic).length
  };
}

function buildGuideUrl(shareSlug) {
  if (!shareSlug) {
    return "";
  }

  if (typeof window === "undefined") {
    return `/guides/${shareSlug}`;
  }

  return `${window.location.origin}/guides/${shareSlug}`;
}

export default function SavedListsPage({ auth, isHydratingAuth }) {
  const { language } = useI18n();
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(auth));
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [activeListId, setActiveListId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function t(copy, variables) {
    return pick(copy, language, variables);
  }

  useEffect(() => {
    if (!auth || auth.user.role !== "user") {
      setLists([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    fetchSavedLists()
      .then((data) => {
        setLists(data);
      })
      .catch((error) => {
        setLists([]);
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [auth]);

  const savedSummary = useMemo(() => buildSavedSummary(lists), [lists]);

  function updateField(field, value) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value
    }));
  }

  function replaceList(updatedList) {
    setLists((currentLists) =>
      currentLists.map((list) => (list.id === updatedList.id ? updatedList : list))
    );
  }

  async function handleCreateList(event) {
    event.preventDefault();
    setIsCreatingList(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await createSavedList(formData);
      setLists((currentLists) => [response.list, ...currentLists]);
      setFormData({
        name: "",
        description: "",
        isPublic: false
      });
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsCreatingList(false);
    }
  }

  async function handleToggleListVisibility(list) {
    setActiveListId(list.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await updateSavedList(list.id, {
        name: list.name,
        description: list.description,
        isPublic: !list.isPublic
      });

      replaceList(response.list);
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setActiveListId(null);
    }
  }

  async function handleCopyGuideLink(shareSlug) {
    const shareUrl = buildGuideUrl(shareSlug);
    setErrorMessage("");
    setSuccessMessage("");

    if (!shareUrl) {
      setErrorMessage(t({ es: "La guia todavia no tiene un enlace publico disponible", en: "This guide does not have a public link yet", eu: "Gida honek ez du oraindik esteka publikorik" }));
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setSuccessMessage(t({ es: "Enlace de guia copiado al portapapeles", en: "Guide link copied to clipboard", eu: "Gidaren esteka arbelean kopiatu da" }));
    } catch (_error) {
      setErrorMessage(t({ es: "No se ha podido copiar el enlace automaticamente", en: "The link could not be copied automatically", eu: "Ezin izan da esteka automatikoki kopiatu" }));
    }
  }

  async function handleDeleteList(listId) {
    setActiveListId(listId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await deleteSavedList(listId);
      setLists((currentLists) => currentLists.filter((list) => list.id !== listId));
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setActiveListId(null);
    }
  }

  async function handleRemoveBusiness(listId, businessId) {
    setActiveListId(listId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await removeBusinessFromSavedList(listId, businessId);
      setLists((currentLists) =>
        currentLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                business_count: Math.max(Number(list.business_count || 0) - 1, 0),
                businesses: list.businesses.filter((business) => business.id !== businessId)
              }
            : list
        )
      );
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setActiveListId(null);
    }
  }

  if (isHydratingAuth) {
    return <p>{t({ es: "Verificando sesion...", en: "Checking session...", eu: "Saioa egiaztatzen..." })}</p>;
  }

  if (!auth) {
    return (
      <section className="card auth-card">
        <h2>{t({ es: "Guardados", en: "Saved lists", eu: "Gordetakoak" })}</h2>
        <p className="auth-copy">
          {t({
            es: "Inicia sesion para crear listas personalizadas, guardar negocios para mas tarde y convertir tus selecciones en guias compartibles.",
            en: "Sign in to create custom lists, save businesses for later and turn your selections into shareable guides.",
            eu: "Hasi saioa zerrenda pertsonalizatuak sortzeko, negozioak gerorako gordetzeko eta zure hautaketak partekatzeko gidetan bihurtzeko."
          })}
        </p>
        <div className="hero-actions">
          <Link className="button" to="/login">
            {t({ es: "Ir a login", en: "Go to login", eu: "Joan saioa hastera" })}
          </Link>
          <Link className="button secondary" to="/guides">
            {t({ es: "Ver guias publicas", en: "View public guides", eu: "Ikusi gida publikoak" })}
          </Link>
        </div>
      </section>
    );
  }

  if (auth.user.role !== "user") {
    return (
      <section className="card auth-card">
        <h2>{t({ es: "Guardados y listas", en: "Saved lists", eu: "Gordetako zerrendak" })}</h2>
        <p className="auth-copy">
          {t({
            es: "Esta funcionalidad esta pensada para cuentas cliente. Desde una cuenta de negocio puedes seguir gestionando tu ficha y las reservas recibidas.",
            en: "This area is designed for client accounts. Business accounts can keep managing their profile and incoming bookings.",
            eu: "Funtzio hau bezero-kontuentzat pentsatuta dago. Negozio-kontu batekin zure fitxa eta jasotako erreserbak kudeatzen jarrai dezakezu."
          })}
        </p>
        <div className="hero-actions">
          <Link className="button secondary" to="/profile">
            {t({ es: "Volver al perfil", en: "Back to profile", eu: "Itzuli profilera" })}
          </Link>
          <Link className="button" to="/guides">
            {t({ es: "Ver guias publicas", en: "View public guides", eu: "Ikusi gida publikoak" })}
          </Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return <p>{t({ es: "Cargando guardados...", en: "Loading saved lists...", eu: "Gordetakoak kargatzen..." })}</p>;
  }

  return (
    <section className="saved-page">
      <header className="card saved-hero">
        <div>
          <p className="eyebrow">{t({ es: "Guardados", en: "Saved", eu: "Gordetakoak" })}</p>
          <h2>{t({ es: "Tus listas personales y guias compartibles", en: "Your personal lists and shareable guides", eu: "Zure zerrenda pertsonalak eta partekatzeko gidak" })}</h2>
          <p className="section-copy">
            {t({
              es: "Guarda negocios, organiza planes y publica tus mejores combinaciones como guias para que otras personas descubran DonostiGo desde una perspectiva mas humana.",
              en: "Save businesses, organise plans and publish your best combinations as guides so other people can discover DonostiGo through a more human point of view.",
              eu: "Gorde negozioak, antolatu planak eta argitaratu zure konbinaziorik onenak gida gisa, besteek DonostiGo ikuspegi gizatiarrago batetik ezagutzeko."
            })}
          </p>
        </div>
        <div className="saved-overview">
          <div>
            <strong>{savedSummary.listCount}</strong>
            <span>{t({ es: "listas creadas", en: "lists created", eu: "sortutako zerrendak" })}</span>
          </div>
          <div>
            <strong>{savedSummary.uniqueBusinessCount}</strong>
            <span>{t({ es: "negocios unicos", en: "unique businesses", eu: "negozio bakarrak" })}</span>
          </div>
          <div>
            <strong>{savedSummary.publicListCount}</strong>
            <span>{t({ es: "guias publicadas", en: "published guides", eu: "argitaratutako gidak" })}</span>
          </div>
        </div>
      </header>

      <section className="saved-layout">
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t({ es: "Nueva lista", en: "New list", eu: "Zerrenda berria" })}</p>
              <h3>{t({ es: "Crear una lista personalizada", en: "Create a custom list", eu: "Sortu zerrenda pertsonalizatua" })}</h3>
            </div>
            <p className="section-copy">
              {t({
                es: "Puedes usarla como archivo privado o convertirla en una guia publica cuando tenga sentido compartirla.",
                en: "You can keep it private or turn it into a public guide whenever it makes sense to share it.",
                eu: "Fitxategi pribatu gisa erabil dezakezu edo zentzua duenean gida publiko bihurtu."
              })}
            </p>
          </div>

          <form className="form" onSubmit={handleCreateList}>
            <input
              type="text"
              placeholder={t({ es: "Ej. Brunch del domingo", en: "e.g. Sunday brunch", eu: "adib. Igandeko brunch-a" })}
              value={formData.name}
              maxLength={100}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
            <textarea
              rows="4"
              placeholder={t({ es: "Descripcion corta de la lista", en: "Short list description", eu: "Zerrendaren azalpen laburra" })}
              value={formData.description}
              maxLength={300}
              onChange={(event) => updateField("description", event.target.value)}
            />
            <label className="saved-checkbox">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(event) => updateField("isPublic", event.target.checked)}
              />
              <span>{t({ es: "Crear directamente como guia publica", en: "Create it directly as a public guide", eu: "Sortu zuzenean gida publiko gisa" })}</span>
            </label>
            <button type="submit" disabled={isCreatingList}>
              {isCreatingList
                ? t({ es: "Creando...", en: "Creating...", eu: "Sortzen..." })
                : t({ es: "Crear lista", en: "Create list", eu: "Sortu zerrenda" })}
            </button>
          </form>

          {successMessage ? <p className="status-message success">{successMessage}</p> : null}
          {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
        </article>

        <aside className="card saved-sidecard">
          <p className="eyebrow">{t({ es: "Ideas", en: "Ideas", eu: "Ideiak" })}</p>
          <h3>{t({ es: "Como sacar partido a esta seccion", en: "How to get value from this area", eu: "Nola aprobetxatu atal hau" })}</h3>
          <div className="saved-tip-list">
            <div>
              <strong>{t({ es: "Favoritos de Donosti", en: "Donosti favourites", eu: "Donosti gustukoak" })}</strong>
              <span>{t({ es: "Una guia personal para repetir sitios o recomendar a gente cercana.", en: "A personal guide to revisit places or recommend them to people close to you.", eu: "Lekuak errepikatzeko edo gertukoei gomendatzeko gida pertsonala." })}</span>
            </div>
            <div>
              <strong>{t({ es: "Planes por mood", en: "Plans by mood", eu: "Planak aldartearen arabera" })}</strong>
              <span>{t({ es: "Brunch, tarde tranquila, visitas o actividades segun el tipo de dia.", en: "Brunch, quiet afternoons, visits or activities depending on the kind of day.", eu: "Brunch-a, arratsalde lasaia, bisitak edo jarduerak egun motaren arabera." })}</span>
            </div>
            <div>
              <strong>{t({ es: "Guias publicas", en: "Public guides", eu: "Gida publikoak" })}</strong>
              <span>{t({ es: "Comparte una seleccion curada sin necesidad de salir de la plataforma.", en: "Share a curated selection without leaving the platform.", eu: "Partekatu hautaketa kuratu bat plataformatik atera gabe." })}</span>
            </div>
          </div>
          <Link className="button secondary" to="/guides">
            {t({ es: "Explorar guias publicas", en: "Explore public guides", eu: "Esploratu gida publikoak" })}
          </Link>
        </aside>
      </section>

      {lists.length === 0 ? (
        <section className="card saved-empty">
          <h3>{t({ es: "Todavia no has creado ninguna lista", en: "You have not created any list yet", eu: "Oraindik ez duzu zerrendarik sortu" })}</h3>
          <p>
            {t({
              es: "Empieza creando tu primera lista y luego guarda negocios desde su ficha individual para construir una experiencia mas personal dentro de la app.",
              en: "Start by creating your first list and then save businesses from their profile to build a more personal experience inside the app.",
              eu: "Hasi zure lehen zerrenda sortzen eta gero gorde negozioak haien fitxatik aplikazio barruan esperientzia pertsonalagoa eraikitzeko."
            })}
          </p>
        </section>
      ) : (
        <div className="saved-list-grid">
          {lists.map((list) => (
            <article className="card saved-list-card" key={list.id}>
              <div className="saved-list-head">
                <div>
                  <p className="eyebrow">{t({ es: "Lista", en: "List", eu: "Zerrenda" })}</p>
                  <h3>{list.name}</h3>
                </div>
                <button
                  type="button"
                  className="button secondary button-danger"
                  onClick={() => handleDeleteList(list.id)}
                  disabled={activeListId === list.id}
                >
                  {activeListId === list.id
                    ? t({ es: "Eliminando...", en: "Deleting...", eu: "Ezabatzen..." })
                    : t({ es: "Eliminar", en: "Delete", eu: "Ezabatu" })}
                </button>
              </div>

              <p className="section-copy">
                {list.description || t({ es: "Lista sin descripcion. Puedes usarla para guardar ideas.", en: "List without description. You can use it to keep ideas.", eu: "Azalpenik gabeko zerrenda. Ideiak gordetzeko erabil dezakezu." })}
              </p>

              <div className="saved-visibility-row">
                <span
                  className={
                    list.isPublic
                      ? "saved-visibility-badge saved-visibility-badge-public"
                      : "saved-visibility-badge"
                  }
                >
                  {list.isPublic
                    ? t({ es: "Guia publica", en: "Public guide", eu: "Gida publikoa" })
                    : t({ es: "Privada", en: "Private", eu: "Pribatua" })}
                </span>
                {list.isPublic && list.shareSlug ? (
                  <span className="saved-share-link">{buildGuideUrl(list.shareSlug)}</span>
                ) : (
                  <span className="saved-share-link">{t({ es: "Solo visible para ti por ahora", en: "Only visible to you for now", eu: "Oraingoz zuretzat bakarrik ikusgai" })}</span>
                )}
              </div>

              <div className="saved-list-meta">
                <span>
                  {t(
                    {
                      es: "{{count}} guardados",
                      en: "{{count}} saved",
                      eu: "{{count}} gordeta"
                    },
                    { count: Number(list.business_count || 0) }
                  )}
                </span>
                <span>
                  {t(
                    {
                      es: "Creada el {{date}}",
                      en: "Created on {{date}}",
                      eu: "{{date}} egunean sortua"
                    },
                    { date: formatLocaleDate(list.created_at, language) }
                  )}
                </span>
              </div>

              <div className="saved-share-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => handleToggleListVisibility(list)}
                  disabled={activeListId === list.id}
                >
                  {activeListId === list.id
                    ? t({ es: "Guardando...", en: "Saving...", eu: "Gordetzen..." })
                    : list.isPublic
                      ? t({ es: "Ocultar guia", en: "Hide guide", eu: "Ezkutatu gida" })
                      : t({ es: "Publicar guia", en: "Publish guide", eu: "Argitaratu gida" })}
                </button>
                {list.isPublic && list.shareSlug ? (
                  <>
                    <Link className="button secondary" to={`/guides/${list.shareSlug}`}>
                      {t({ es: "Ver guia", en: "View guide", eu: "Ikusi gida" })}
                    </Link>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleCopyGuideLink(list.shareSlug)}
                    >
                      {t({ es: "Copiar enlace", en: "Copy link", eu: "Kopiatu esteka" })}
                    </button>
                  </>
                ) : null}
              </div>

              {list.businesses.length === 0 ? (
                <div className="saved-empty-mini">
                  <p>{t({ es: "Esta lista esta vacia por ahora. Guarda negocios desde su ficha.", en: "This list is empty for now. Save businesses from their profile.", eu: "Zerrenda hau hutsik dago oraingoz. Gorde negozioak haien fitxatik." })}</p>
                </div>
              ) : (
                <div className="saved-business-stack">
                  {list.businesses.map((business) => {
                    const serviceMode = getServiceModeConfig(business.serviceMode, language);

                    return (
                      <article className="saved-business-item" key={`${list.id}-${business.id}`}>
                        <div>
                          <strong>{business.name}</strong>
                          <span>
                            {business.category || t({ es: "Sin categoria", en: "No category", eu: "Kategoriarik gabe" })} · {serviceMode.badge} ·{" "}
                            {Number(business.average_rating || 0).toFixed(1)} / 5
                          </span>
                        </div>
                        <div className="saved-business-actions">
                          <Link className="button secondary" to={`/businesses/${business.id}`}>
                            {t({ es: "Ver ficha", en: "View profile", eu: "Ikusi fitxa" })}
                          </Link>
                          <button
                            type="button"
                            className="button secondary button-danger"
                            onClick={() => handleRemoveBusiness(list.id, business.id)}
                            disabled={activeListId === list.id}
                          >
                            {activeListId === list.id
                              ? t({ es: "Quitando...", en: "Removing...", eu: "Kentzen..." })
                              : t({ es: "Quitar", en: "Remove", eu: "Kendu" })}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
