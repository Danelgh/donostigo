import { Link } from "react-router-dom";
import { pick, useI18n } from "../i18n/I18nProvider.jsx";

export default function NotFoundPage() {
  const { language } = useI18n();

  return (
    <section className="card not-found-page">
      <p className="eyebrow">404</p>
      <h2>{pick({ es: "Esta pagina no existe", en: "This page does not exist", eu: "Orri hau ez dago" }, language)}</h2>
      <p className="section-copy">
        {pick({
          es: "La ruta a la que has intentado acceder no forma parte de DonostiGo o todavia no esta disponible en esta version del proyecto.",
          en: "The route you tried to open is not part of DonostiGo or is not available in this project version yet.",
          eu: "Irekitzen saiatu zaren bidea ez da DonostiGo-ren parte edo oraindik ez dago erabilgarri proiektuaren bertsio honetan."
        }, language)}
      </p>
      <div className="hero-actions">
        <Link className="button" to="/">
          {pick({ es: "Volver al inicio", en: "Back to home", eu: "Itzuli hasierara" }, language)}
        </Link>
        <Link className="button secondary" to="/businesses">
          {pick({ es: "Ir al catalogo", en: "Go to catalogue", eu: "Joan katalogora" }, language)}
        </Link>
      </div>
    </section>
  );
}
