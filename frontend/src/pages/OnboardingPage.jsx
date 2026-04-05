import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  fetchCategories,
  fetchMyBusinessProfile,
  saveMyBusinessProfile,
  updateCurrentUser
} from "../services/api.js";
import {
  getOnboardingState,
  isOnboardingComplete,
  saveOnboardingState
} from "../utils/onboarding.js";
import { pick, useI18n } from "../i18n/I18nProvider.jsx";
import { getServiceModeOptions } from "../utils/serviceMode.js";

const USER_INTEREST_OPTIONS = [
  {
    id: "brunch",
    label: {
      es: "Brunch y cafe",
      en: "Brunch and coffee",
      eu: "Brunch-a eta kafea"
    }
  },
  {
    id: "relax",
    label: {
      es: "Planes relax",
      en: "Relaxed plans",
      eu: "Plan lasaiak"
    }
  },
  {
    id: "sport",
    label: {
      es: "Deporte",
      en: "Sport",
      eu: "Kirola"
    }
  },
  {
    id: "culture",
    label: {
      es: "Cultura",
      en: "Culture",
      eu: "Kultura"
    }
  },
  {
    id: "tourism",
    label: {
      es: "Turismo",
      en: "Tourism",
      eu: "Turismoa"
    }
  },
  {
    id: "gifts",
    label: {
      es: "Regalos y bonos",
      en: "Gifts and vouchers",
      eu: "Opariak eta bonuak"
    }
  }
];

const LEGACY_INTEREST_MAP = {
  "Brunch y cafe": "brunch",
  "Planes relax": "relax",
  Deporte: "sport",
  Cultura: "culture",
  Turismo: "tourism",
  "Regalos y bonos": "gifts"
};

function getUserInterestDestinations(language) {
  return {
    brunch: {
      title: pick(
        {
          es: "Explora brunch y cafe",
          en: "Explore brunch and coffee",
          eu: "Esploratu brunch-a eta kafea"
        },
        language
      ),
      description: pick(
        {
          es: "Empieza por negocios donde mas se nota la capa editorial y de guias.",
          en: "Start with businesses where the editorial and guide layer stands out the most.",
          eu: "Hasi geruza editoriala eta gidena gehien nabaritzen den negozioetatik."
        },
        language
      ),
      href: "/businesses"
    },
    relax: {
      title: pick(
        {
          es: "Encuentra planes para bajar el ritmo",
          en: "Find plans to slow down",
          eu: "Aurkitu erritmoa jaisteko planak"
        },
        language
      ),
      description: pick(
        {
          es: "Bienestar y experiencias pausadas son una de las rutas mas agradables para empezar.",
          en: "Wellbeing and slow experiences are one of the nicest ways to begin.",
          eu: "Ongizatea eta esperientzia pausatuak hasteko biderik atseginenetako bat dira."
        },
        language
      ),
      href: "/businesses"
    },
    sport: {
      title: pick(
        {
          es: "Ve directo a experiencias activas",
          en: "Jump into active experiences",
          eu: "Jo zuzenean esperientzia aktiboetara"
        },
        language
      ),
      description: pick(
        {
          es: "Las sesiones, plazas y reservas deportivas ya tienen una logica mas completa.",
          en: "Sessions, slots and sport bookings already have a much richer flow.",
          eu: "Saioek, plazek eta kirol-erreserbek askoz fluxu osatuagoa dute."
        },
        language
      ),
      href: "/businesses"
    },
    culture: {
      title: pick(
        {
          es: "Mira guias con contexto",
          en: "Browse guides with context",
          eu: "Ikusi testuingurudun gidak"
        },
        language
      ),
      description: pick(
        {
          es: "Las listas publicas son una buena forma de descubrir planes con criterio.",
          en: "Public lists are a great way to discover plans with curation behind them.",
          eu: "Zerrenda publikoak planak irizpidez deskubritzeko modu ona dira."
        },
        language
      ),
      href: "/guides"
    },
    tourism: {
      title: pick(
        {
          es: "Empieza por ideas para enseñar la ciudad",
          en: "Start with ideas to show the city",
          eu: "Hasi hiria erakusteko ideiekin"
        },
        language
      ),
      description: pick(
        {
          es: "Comparar negocios y guardar sitios ahora tiene mucho mas sentido dentro de la app.",
          en: "Comparing businesses and saving places now makes far more sense inside the app.",
          eu: "Negozioak alderatzeak eta tokiak gordetzeak askoz zentzu handiagoa du orain aplikazioan."
        },
        language
      ),
      href: "/guides"
    },
    gifts: {
      title: pick(
        {
          es: "Prueba bonos y solicitudes especiales",
          en: "Try vouchers and special requests",
          eu: "Probatu bonuak eta eskaera bereziak"
        },
        language
      ),
      description: pick(
        {
          es: "DonostiGo ya no funciona solo con reservas: tambien hay packs y propuestas cerradas.",
          en: "DonostiGo is no longer only about bookings: there are also packs and closed proposals.",
          eu: "DonostiGo ez da erreserbetara mugatzen: pack-ak eta proposamen itxiak ere badaude."
        },
        language
      ),
      href: "/businesses"
    }
  };
}

function createInitialUserDraft(user) {
  return {
    name: user?.name ?? "",
    city: user?.city ?? "",
    bio: user?.bio ?? "",
    avatarUrl: user?.avatarUrl ?? ""
  };
}

function createEmptyBusinessService() {
  return {
    kind: "service",
    title: "",
    description: "",
    priceLabel: "",
    durationMinutes: "",
    capacity: ""
  };
}

function createInitialBusinessDraft(name = "") {
  return {
    name,
    categoryId: "",
    serviceMode: "booking",
    description: "",
    address: "",
    phone: "",
    visitNote: "",
    cancellationPolicy: "",
    heroBadge: "",
    heroClaim: "",
    heroHighlight: "",
    services: [createEmptyBusinessService()],
    faqs: [],
    scheduleRules: [],
    scheduleExceptions: []
  };
}

function getUserSteps(language) {
  return [
    {
      id: "welcome",
      label: pick({ es: "Tu estilo", en: "Your style", eu: "Zure estiloa" }, language),
      title: pick({ es: "Vamos a adaptar DonostiGo a como exploras planes", en: "Let us adapt DonostiGo to how you explore plans", eu: "Egokitu dezagun DonostiGo planak nola esploratzen dituzunera" }, language)
    },
    {
      id: "profile",
      label: pick({ es: "Perfil", en: "Profile", eu: "Profila" }, language),
      title: pick({ es: "Deja tu cuenta lista para recomendarte mejor", en: "Get your account ready for better recommendations", eu: "Prest utzi zure kontua gomendio hobeak jasotzeko" }, language)
    },
    {
      id: "launch",
      label: pick({ es: "Empezar", en: "Start", eu: "Hasi" }, language),
      title: pick({ es: "Ya puedes moverte por la app con una base mucho mas util", en: "You can now move through the app with a much more useful base", eu: "Orain askoz oinarri erabilgarriago batekin mugitu zaitezke aplikazioan" }, language)
    }
  ];
}

function getBusinessSteps(language) {
  return [
    {
      id: "identity",
      label: pick({ es: "Base", en: "Basics", eu: "Oinarria" }, language),
      title: pick({ es: "Primero, cuentanos que tipo de negocio eres", en: "First, tell us what kind of business you are", eu: "Lehenik, kontaiguzu zein motatako negozioa zaren" }, language)
    },
    {
      id: "portal",
      label: pick({ es: "Portal", en: "Portal", eu: "Ataria" }, language),
      title: pick({ es: "Ahora dale contexto y personalidad a la ficha publica", en: "Now give the public profile context and personality", eu: "Orain eman testuingurua eta nortasuna fitxa publikoari" }, language)
    },
    {
      id: "offer",
      label: pick({ es: "Oferta", en: "Offer", eu: "Eskaintza" }, language),
      title: pick({ es: "Termina con una oferta clara para que el portal cobre vida", en: "Finish with a clear offer so the portal comes alive", eu: "Amaitu eskaintza argi batekin atariak bizia har dezan" }, language)
    },
    {
      id: "launch",
      label: pick({ es: "Publicar", en: "Publish", eu: "Argitaratu" }, language),
      title: pick({ es: "Tu panel ya esta listo para trabajar como un mini backoffice", en: "Your panel is now ready to work like a mini backoffice", eu: "Zure panela mini backoffice baten moduan lan egiteko prest dago" }, language)
    }
  ];
}

function getLastStepIndex(steps, lastStep) {
  if (!lastStep) {
    return 0;
  }

  const matchIndex = steps.findIndex((step) => step.id === lastStep);

  if (matchIndex >= 0) {
    return matchIndex;
  }

  if (lastStep === "done") {
    return steps.length - 1;
  }

  return 0;
}

export default function OnboardingPage({
  auth,
  isHydratingAuth,
  onUserUpdate,
  onOnboardingChange
}) {
  const navigate = useNavigate();
  const { language } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [userDraft, setUserDraft] = useState(createInitialUserDraft(auth?.user));
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [businessDraft, setBusinessDraft] = useState(createInitialBusinessDraft(auth?.user?.name));
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isBusiness = auth?.user.role === "business";
  const serviceModeOptions = useMemo(() => getServiceModeOptions(language), [language]);
  const userInterestDestinations = useMemo(() => getUserInterestDestinations(language), [language]);
  const steps = useMemo(() => (isBusiness ? getBusinessSteps(language) : getUserSteps(language)), [isBusiness, language]);
  const currentStep = steps[stepIndex];
  const userLaunchIdeas = selectedInterests.length
    ? selectedInterests
        .map((interest) => userInterestDestinations[interest])
        .filter(Boolean)
        .slice(0, 2)
    : [
        {
          title: pick({ es: "Empieza por el catalogo", en: "Start with the catalogue", eu: "Hasi katalogotik" }, language),
          description: pick({ es: "La forma mas rapida de notar el salto de la app es comparar negocios y guardar los que te interesan.", en: "The fastest way to feel the app upgrade is to compare businesses and save the ones that interest you.", eu: "Aplikazioaren jauzia nabaritzeko modurik azkarrena negozioak alderatzea eta interesatzen zaizkizunak gordetzea da." }, language),
          href: "/businesses"
        }
      ];
  const businessLaunchIdeas = useMemo(() => {
    const ideasByMode = {
      booking: {
        title: pick({ es: "Afina tus turnos y huecos", en: "Refine your slots and openings", eu: "Findu zure txandak eta hutsuneak" }, language),
        description: pick({ es: "Tu siguiente mejora natural esta en horarios, excepciones y capacidad real por servicio.", en: "Your next natural improvement is in schedules, exceptions and real capacity per service.", eu: "Zure hurrengo hobekuntza naturala ordutegietan, salbuespenetan eta zerbitzu bakoitzeko edukieran dago." }, language)
      },
      session: {
        title: pick({ es: "Da forma a tus plazas y sesiones", en: "Shape your slots and sessions", eu: "Eman forma zure plazei eta saioei" }, language),
        description: pick({ es: "Ahora ya puedes jugar con agenda, cupos y lista de espera como una experiencia mas viva.", en: "You can now work with schedules, capacity and waitlists as a much livelier experience.", eu: "Orain ordutegiekin, edukierarekin eta itxaron-zerrendarekin lan egin dezakezu esperientzia biziago batean." }, language)
      },
      request: {
        title: pick({ es: "Trabaja propuestas mas redondas", en: "Craft more polished proposals", eu: "Landu proposamen biribilagoak" }, language),
        description: pick({ es: "Los packs, bonos y encargos lucen mas cuando el negocio afina respuesta, precio y siguiente paso.", en: "Packs, vouchers and requests look better when the business refines the response, pricing and next step.", eu: "Packek, bonuek eta enkarguek itxura hobea dute negozioak erantzuna, prezioa eta hurrengo urratsa fintzen dituenean." }, language)
      }
    };

    return ideasByMode[businessDraft.serviceMode] ?? ideasByMode.booking;
  }, [businessDraft.serviceMode]);

  useEffect(() => {
    setUserDraft(createInitialUserDraft(auth?.user));
  }, [auth]);

  useEffect(() => {
    if (!auth) {
      return;
    }

    const onboardingState = getOnboardingState(auth.user);
    setSelectedInterests(
      Array.isArray(onboardingState.selectedInterests)
        ? onboardingState.selectedInterests.map((interest) => LEGACY_INTEREST_MAP[interest] || interest)
        : []
    );
  }, [auth]);

  useEffect(() => {
    if (!auth) {
      return;
    }

    if (isBusiness && isLoadingBusiness) {
      return;
    }

    const onboardingState = getOnboardingState(auth.user);
    const nextIndex = getLastStepIndex(steps, onboardingState.lastStep);

    setStepIndex(nextIndex);
  }, [auth, isBusiness, isLoadingBusiness, steps]);

  useEffect(() => {
    if (!auth || auth.user.role !== "business") {
      setCategories([]);
      setBusinessDraft(createInitialBusinessDraft(auth?.user?.name));
      return;
    }

    setIsLoadingBusiness(true);

    Promise.all([fetchCategories(), fetchMyBusinessProfile()])
      .then(([categoryData, businessData]) => {
        setCategories(categoryData);

        if (businessData.business) {
          setBusinessDraft({
            name: businessData.business.name ?? auth.user.name,
            categoryId: businessData.business.categoryId
              ? String(businessData.business.categoryId)
              : "",
            serviceMode: businessData.business.serviceMode ?? "booking",
            description: businessData.business.description ?? "",
            address: businessData.business.address ?? "",
            phone: businessData.business.phone ?? "",
            visitNote: businessData.business.visitNote ?? "",
            cancellationPolicy: businessData.business.cancellationPolicy ?? "",
            heroBadge: businessData.business.heroBadge ?? "",
            heroClaim: businessData.business.heroClaim ?? "",
            heroHighlight: businessData.business.heroHighlight ?? "",
            services:
              businessData.business.services?.length > 0
                ? businessData.business.services.map((service) => ({
                    kind: service.kind ?? "service",
                    title: service.title ?? "",
                    description: service.description ?? "",
                    priceLabel: service.priceLabel ?? "",
                    durationMinutes: service.durationMinutes ?? "",
                    capacity: service.capacity ?? ""
                  }))
                : [createEmptyBusinessService()],
            faqs: businessData.business.faqs ?? [],
            scheduleRules: businessData.business.scheduleRules ?? [],
            scheduleExceptions: businessData.business.scheduleExceptions ?? []
          });
          return;
        }

        setBusinessDraft(createInitialBusinessDraft(auth.user.name));
      })
      .catch(() => {
        setCategories([]);
        setBusinessDraft(createInitialBusinessDraft(auth.user.name));
      })
      .finally(() => {
        setIsLoadingBusiness(false);
      });
  }, [auth]);

  if (isHydratingAuth) {
    return <p>{pick({ es: "Preparando onboarding...", en: "Preparing onboarding...", eu: "Onboarding-a prestatzen..." }, language)}</p>;
  }

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  function updateUserDraft(field, value) {
    setUserDraft((currentValue) => ({
      ...currentValue,
      [field]: value
    }));
  }

  function updateBusinessDraft(field, value) {
    setBusinessDraft((currentValue) => ({
      ...currentValue,
      [field]: value
    }));
  }

  function updatePrimaryService(field, value) {
    setBusinessDraft((currentValue) => {
      const services = [...currentValue.services];
      const firstService = services[0] ?? createEmptyBusinessService();

      services[0] = {
        ...firstService,
        [field]: value
      };

      return {
        ...currentValue,
        services
      };
    });
  }

  function toggleInterest(interest) {
    setSelectedInterests((currentValue) =>
      currentValue.includes(interest)
        ? currentValue.filter((item) => item !== interest)
        : [...currentValue, interest]
    );
  }

  async function handleNext() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!isBusiness) {
      if (currentStep.id === "welcome") {
        saveOnboardingState(auth.user, {
          selectedInterests,
          lastStep: "profile"
        });
        onOnboardingChange?.(auth.user);
        setStepIndex(1);
        return;
      }

      if (currentStep.id === "profile") {
        if (!userDraft.name.trim() || !userDraft.city.trim() || !userDraft.bio.trim()) {
          setErrorMessage(pick({ es: "Completa nombre, ciudad y una breve bio para seguir.", en: "Complete your name, city and a short bio to continue.", eu: "Jarraitzeko bete izena, hiria eta bio labur bat." }, language));
          return;
        }

        setIsSaving(true);

        try {
          const response = await updateCurrentUser(userDraft);
          onUserUpdate(response.user);
          saveOnboardingState(auth.user, {
            selectedInterests,
            lastStep: "launch"
          });
          onOnboardingChange?.(response.user);
          setSuccessMessage(pick({ es: "Perfil actualizado. Ya casi esta todo listo.", en: "Profile updated. You are almost ready.", eu: "Profila eguneratu da. Ia dena prest dago." }, language));
          setStepIndex(2);
        } catch (error) {
          setErrorMessage(error.message);
        } finally {
          setIsSaving(false);
        }

        return;
      }

      saveOnboardingState(auth.user, {
        selectedInterests,
        completedAt: new Date().toISOString(),
        lastStep: "done"
      });
      onOnboardingChange?.(auth.user);
      navigate("/businesses");
      return;
    }

    if (currentStep.id === "identity") {
      if (!businessDraft.name.trim() || !businessDraft.categoryId || !businessDraft.serviceMode) {
        setErrorMessage(pick({ es: "Completa nombre, categoria y modo de servicio para continuar.", en: "Complete the name, category and service mode to continue.", eu: "Jarraitzeko bete izena, kategoria eta zerbitzu modua." }, language));
        return;
      }

      saveOnboardingState(auth.user, {
        lastStep: "portal"
      });
      onOnboardingChange?.(auth.user);
      setStepIndex(1);
      return;
    }

    if (currentStep.id === "portal") {
      if (!businessDraft.description.trim() || !businessDraft.address.trim()) {
        setErrorMessage(pick({ es: "Anade al menos descripcion y direccion para construir la ficha.", en: "Add at least a description and address to build the profile.", eu: "Gehitu gutxienez deskribapena eta helbidea fitxa eraikitzeko." }, language));
        return;
      }

      setIsSaving(true);

      try {
        await saveMyBusinessProfile(businessDraft);
        saveOnboardingState(auth.user, {
          lastStep: "offer"
        });
        onOnboardingChange?.(auth.user);
        setSuccessMessage(pick({ es: "Base del portal guardada. Solo falta darle una oferta clara.", en: "Portal base saved. You only need a clear offer now.", eu: "Atariaren oinarria gorde da. Orain eskaintza argi bat besterik ez da falta." }, language));
        setStepIndex(2);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsSaving(false);
      }

      return;
    }

    if (currentStep.id === "offer") {
      const firstService = businessDraft.services[0];

      if (!firstService?.title?.trim() || !firstService?.description?.trim()) {
        setErrorMessage(pick({ es: "Define al menos un servicio principal para terminar el onboarding.", en: "Define at least one main service to finish onboarding.", eu: "Definitu gutxienez zerbitzu nagusi bat onboarding-a amaitzeko." }, language));
        return;
      }

      setIsSaving(true);

      try {
        await saveMyBusinessProfile(businessDraft);
        saveOnboardingState(auth.user, {
          completedAt: new Date().toISOString(),
          lastStep: "done"
        });
        onOnboardingChange?.(auth.user);
        setSuccessMessage(pick({ es: "Negocio preparado. Ya puedes trabajar desde tu panel.", en: "Business ready. You can now work from your panel.", eu: "Negozioa prest dago. Orain zure paneletik lan egin dezakezu." }, language));
        setStepIndex(3);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsSaving(false);
      }

      return;
    }

    navigate("/profile");
  }

  function handleBack() {
    setErrorMessage("");
    setSuccessMessage("");
    setStepIndex((currentValue) => Math.max(0, currentValue - 1));
  }

  const onboardingState = getOnboardingState(auth.user);
  const alreadyCompleted = isOnboardingComplete({
    user: auth.user,
    business: isBusiness ? businessDraft : null
  });

  return (
    <section className="onboarding-layout">
      <aside className="card onboarding-sidebar">
        <p className="eyebrow">{pick({ es: "Onboarding", en: "Onboarding", eu: "Hasierako gida" }, language)}</p>
        <h2>
          {isBusiness
            ? pick({ es: "Lanzamos tu portal en pocos pasos", en: "Let us launch your portal in a few steps", eu: "Jar dezagun zure ataria martxan pauso gutxitan" }, language)
            : pick({ es: "Dejamos tu cuenta lista para explorar", en: "Let us get your account ready to explore", eu: "Prest utz dezagun zure kontua esploratzeko" }, language)}
        </h2>
        <p className="section-copy">
          {isBusiness
            ? pick({ es: "No te soltamos en un formulario enorme. Vamos por partes para que el negocio ya parezca un portal real desde el principio.", en: "We are not dropping you into a huge form. We go step by step so the business already feels like a real portal from the start.", eu: "Ez zaitugu formulario erraldoi batean uzten. Pausoz pauso goaz negozioak hasieratik benetako atari baten itxura izan dezan." }, language)
            : pick({ es: "La idea es que en pocos minutos la app entienda mejor que te interesa y tu tengas claro por donde empezar.", en: "The goal is that in a few minutes the app understands you better and you know where to begin.", eu: "Helburua da minutu gutxitan aplikazioak hobeto ulertzea zer interesatzen zaizun eta zuk nondik hasi argi izatea." }, language)}
        </p>

        <div className="onboarding-step-list">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={index === stepIndex ? "onboarding-step is-active" : "onboarding-step"}
              onClick={() => setStepIndex(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.title}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="onboarding-sidebar-footer">
          <strong>{alreadyCompleted
            ? pick({ es: "Onboarding completado", en: "Onboarding completed", eu: "Onboarding-a osatuta" }, language)
            : pick({ es: "Configuracion en progreso", en: "Setup in progress", eu: "Konfigurazioa martxan" }, language)}</strong>
          <p>
            {alreadyCompleted
              ? pick({ es: "Puedes volver cuando quieras para revisar o ajustar la experiencia.", en: "You can come back whenever you want to review or adjust the experience.", eu: "Nahi duzunean itzul zaitezke esperientzia berrikusi edo doitzeko." }, language)
              : pick(
                  {
                    es: "Ultimo punto guardado: {{step}}.",
                    en: "Last saved point: {{step}}.",
                    eu: "Azken gordetako puntua: {{step}}."
                  },
                  language,
                  { step: onboardingState.lastStep || pick({ es: "inicio", en: "start", eu: "hasiera" }, language) }
                )}
          </p>
          <Link className="button secondary" to="/profile">
            {pick({ es: "Ir al perfil", en: "Go to profile", eu: "Joan profilera" }, language)}
          </Link>
        </div>
      </aside>

      <article className="card onboarding-panel">
        <div className="onboarding-panel-header">
          <div>
            <p className="eyebrow">{pick({ es: "Paso", en: "Step", eu: "Pausoa" }, language)} {stepIndex + 1}</p>
            <h3>{currentStep.title}</h3>
          </div>
          <div className="onboarding-progress">
            <span>{Math.round(((stepIndex + 1) / steps.length) * 100)}%</span>
            <div className="profile-progress-bar">
              <span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
            </div>
          </div>
        </div>

        {!isBusiness ? (
          <>
            {currentStep.id === "welcome" ? (
              <div className="onboarding-section">
                <strong>{pick({ es: "Que tipo de plan quieres descubrir mas rapido?", en: "What kind of plan do you want to discover faster?", eu: "Zein plan mota deskubritu nahi duzu azkarrago?" }, language)}</strong>
                <p className="section-copy">
                  {pick({ es: "Esto nos ayuda a orientar mejor el arranque y a que la app no se sienta generica desde el minuto uno.", en: "This helps us guide the start better so the app does not feel generic from minute one.", eu: "Honek hasiera hobeto gidatzen laguntzen digu aplikazioa lehen minututik generikoa ez sentitzeko." }, language)}
                </p>
                <div className="onboarding-chip-grid">
                  {USER_INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest.id}
                      type="button"
                      className={
                        selectedInterests.includes(interest.id)
                          ? "reservation-filter-button is-active"
                          : "reservation-filter-button"
                      }
                      onClick={() => toggleInterest(interest.id)}
                    >
                      {pick(interest.label, language)}
                    </button>
                  ))}
                </div>
                <div className="onboarding-highlight">
                  <strong>{pick({ es: "Lo innovador aqui", en: "What is different here", eu: "Hemen berritzailea dena" }, language)}</strong>
                  <p>
                    {pick({ es: "El onboarding no intenta ensenarte veinte pantallas: intenta orientarte a guardar, comparar y construir tu propio plan cuanto antes.", en: "This onboarding is not trying to show you twenty screens: it tries to orient you towards saving, comparing and building your own plan as soon as possible.", eu: "Onboarding honek ez dizu hogei pantaila erakutsi nahi: ahalik eta azkarren gordetzera, alderatzera eta zure plana eraikitzera bideratu nahi zaitu." }, language)}
                  </p>
                </div>
              </div>
            ) : null}

            {currentStep.id === "profile" ? (
              <div className="onboarding-section onboarding-form-grid">
                <label>
                    <span>{pick({ es: "Nombre visible", en: "Visible name", eu: "Ikusgai den izena" }, language)}</span>
                  <input
                    type="text"
                    value={userDraft.name}
                    onChange={(event) => updateUserDraft("name", event.target.value)}
                    maxLength={100}
                  />
                </label>
                <label>
                  <span>{pick({ es: "Ciudad", en: "City", eu: "Hiria" }, language)}</span>
                  <input
                    type="text"
                    value={userDraft.city}
                    onChange={(event) => updateUserDraft("city", event.target.value)}
                    maxLength={120}
                  />
                </label>
                <label className="onboarding-form-grid-wide">
                  <span>{pick({ es: "Bio breve", en: "Short bio", eu: "Bio laburra" }, language)}</span>
                  <textarea
                    rows="4"
                    value={userDraft.bio}
                    onChange={(event) => updateUserDraft("bio", event.target.value)}
                    maxLength={500}
                    placeholder={pick({ es: "Que tipo de planes te gustan o como sueles usar la app", en: "What kind of plans you like or how you usually use the app", eu: "Zein plan mota gustatzen zaizkizun edo aplikazioa nola erabiltzen duzun" }, language)}
                  />
                </label>
                <label className="onboarding-form-grid-wide">
                  <span>{pick({ es: "Foto o imagen de perfil (URL)", en: "Profile photo or image (URL)", eu: "Profil-argazkia edo irudia (URL)" }, language)}</span>
                  <input
                    type="url"
                    value={userDraft.avatarUrl}
                    onChange={(event) => updateUserDraft("avatarUrl", event.target.value)}
                    placeholder="https://..."
                  />
                </label>
              </div>
            ) : null}

            {currentStep.id === "launch" ? (
              <div className="onboarding-section">
                <div className="onboarding-launch-grid">
                  <article className="profile-checklist-item is-complete">
                    <span>{pick({ es: "Explorar", en: "Explore", eu: "Esploratu" }, language)}</span>
                    <strong>{pick({ es: "Abre el catalogo con comparador", en: "Open the catalogue with comparison", eu: "Ireki katalogoa konparadorearekin" }, language)}</strong>
                    <p>{pick({ es: "Ya puedes moverte con una cuenta mas completa y empezar a guardar sitios.", en: "You can now move around with a more complete account and start saving places.", eu: "Orain kontu osatuago batekin mugitu zaitezke eta tokiak gordetzen hasi." }, language)}</p>
                    <Link className="button secondary" to="/businesses">
                      {pick({ es: "Ir a negocios", en: "Go to businesses", eu: "Joan negozioetara" }, language)}
                    </Link>
                  </article>
                  <article className="profile-checklist-item is-complete">
                    <span>{pick({ es: "Curar", en: "Curate", eu: "Kuratu" }, language)}</span>
                    <strong>{pick({ es: "Construye tu primera guia", en: "Build your first guide", eu: "Eraiki zure lehen gida" }, language)}</strong>
                    <p>{pick({ es: "Las listas y guias publicas son una de las capas que mas vida le dan a DonostiGo.", en: "Lists and public guides are one of the layers that give DonostiGo the most life.", eu: "Zerrendek eta gida publikoek ematen diote DonostiGo-ri bizitasun handienetako bat." }, language)}</p>
                    <Link className="button secondary" to="/saved-lists">
                      {pick({ es: "Ir a guardados", en: "Go to saved lists", eu: "Joan gordetakoetara" }, language)}
                    </Link>
                  </article>
                  <article className="profile-checklist-item is-complete">
                    <span>{pick({ es: "Descubrir", en: "Discover", eu: "Deskubritu" }, language)}</span>
                    <strong>{pick({ es: "Revisa recomendaciones y planes vivos", en: "Review recommendations and live plans", eu: "Berrikusi gomendioak eta plan biziak" }, language)}</strong>
                    <p>{pick({ es: "La app ya tiene suficientes senales para empezar a proponerte cosas.", en: "The app already has enough signals to start suggesting things to you.", eu: "Aplikazioak baditu nahikoa seinale gauzak proposatzen hasteko." }, language)}</p>
                    <Link className="button secondary" to="/">
                      {pick({ es: "Volver a inicio", en: "Back to home", eu: "Itzuli hasierara" }, language)}
                    </Link>
                  </article>
                  {userLaunchIdeas.map((idea) => (
                    <article key={idea.title} className="profile-checklist-item">
                      <span>{pick({ es: "Siguiente paso", en: "Next step", eu: "Hurrengo pausoa" }, language)}</span>
                      <strong>{idea.title}</strong>
                      <p>{idea.description}</p>
                      <Link className="button tertiary" to={idea.href}>
                        {pick({ es: "Abrir", en: "Open", eu: "Ireki" }, language)}
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {isLoadingBusiness ? <p>{pick({ es: "Cargando configuracion del negocio...", en: "Loading business setup...", eu: "Negozioaren konfigurazioa kargatzen..." }, language)}</p> : null}

            {!isLoadingBusiness && currentStep.id === "identity" ? (
              <div className="onboarding-section onboarding-form-grid">
                <label>
                  <span>{pick({ es: "Nombre comercial", en: "Business name", eu: "Izen komertziala" }, language)}</span>
                  <input
                    type="text"
                    value={businessDraft.name}
                    onChange={(event) => updateBusinessDraft("name", event.target.value)}
                    maxLength={150}
                  />
                </label>
                <label>
                  <span>{pick({ es: "Categoria", en: "Category", eu: "Kategoria" }, language)}</span>
                  <select
                    value={businessDraft.categoryId}
                    onChange={(event) => updateBusinessDraft("categoryId", event.target.value)}
                  >
                    <option value="">{pick({ es: "Selecciona categoria", en: "Select category", eu: "Hautatu kategoria" }, language)}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="onboarding-form-grid-wide">
                  <span>{pick({ es: "Modo principal del negocio", en: "Main business mode", eu: "Negozioaren modu nagusia" }, language)}</span>
                  <div className="onboarding-chip-grid">
                    {serviceModeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={
                          businessDraft.serviceMode === option.value
                            ? "reservation-filter-button is-active"
                            : "reservation-filter-button"
                        }
                        onClick={() => updateBusinessDraft("serviceMode", option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
            ) : null}

            {!isLoadingBusiness && currentStep.id === "portal" ? (
              <div className="onboarding-section onboarding-form-grid">
                <label className="onboarding-form-grid-wide">
                  <span>{pick({ es: "Descripcion", en: "Description", eu: "Deskribapena" }, language)}</span>
                  <textarea
                    rows="4"
                    value={businessDraft.description}
                    onChange={(event) => updateBusinessDraft("description", event.target.value)}
                    maxLength={1200}
                    placeholder={pick({ es: "Que haces, para quien y que hace especial tu propuesta", en: "What you do, for whom and what makes your offer special", eu: "Zer egiten duzun, norentzat eta zure proposamena zerk egiten duen berezi" }, language)}
                  />
                </label>
                <label>
                  <span>{pick({ es: "Direccion", en: "Address", eu: "Helbidea" }, language)}</span>
                  <input
                    type="text"
                    value={businessDraft.address}
                    onChange={(event) => updateBusinessDraft("address", event.target.value)}
                    maxLength={200}
                  />
                </label>
                <label>
                  <span>{pick({ es: "Telefono", en: "Phone", eu: "Telefonoa" }, language)}</span>
                  <input
                    type="text"
                    value={businessDraft.phone}
                    onChange={(event) => updateBusinessDraft("phone", event.target.value)}
                    maxLength={30}
                  />
                </label>
                <label>
                  <span>{pick({ es: "Badge corto", en: "Short badge", eu: "Badge laburra" }, language)}</span>
                  <input
                    type="text"
                    value={businessDraft.heroBadge}
                    onChange={(event) => updateBusinessDraft("heroBadge", event.target.value)}
                    maxLength={80}
                    placeholder={pick({ es: "Ej. Plan de barrio", en: "e.g. Neighbourhood pick", eu: "adib. Auzoko plana" }, language)}
                  />
                </label>
                <label className="onboarding-form-grid-wide">
                  <span>{pick({ es: "Claim del portal", en: "Portal claim", eu: "Atariaren claim-a" }, language)}</span>
                  <input
                    type="text"
                    value={businessDraft.heroClaim}
                    onChange={(event) => updateBusinessDraft("heroClaim", event.target.value)}
                    maxLength={160}
                    placeholder={pick({ es: "La frase que mejor resume la experiencia", en: "The line that best sums up the experience", eu: "Esperientzia ondoen laburbiltzen duen esaldia" }, language)}
                  />
                </label>
              </div>
            ) : null}

            {!isLoadingBusiness && currentStep.id === "offer" ? (
              <div className="onboarding-section onboarding-form-grid">
                <label>
                  <span>{pick({ es: "Servicio principal", en: "Main service", eu: "Zerbitzu nagusia" }, language)}</span>
                  <input
                    type="text"
                    value={businessDraft.services[0]?.title ?? ""}
                    onChange={(event) => updatePrimaryService("title", event.target.value)}
                    maxLength={120}
                    placeholder={pick({ es: "Ej. Clase grupal, bono regalo, pack brunch...", en: "e.g. Group class, gift voucher, brunch pack...", eu: "adib. Taldeko saioa, opari-bonua, brunch pack-a..." }, language)}
                  />
                </label>
                <label>
                  <span>{pick({ es: "Precio visible", en: "Visible price", eu: "Ikusgai den prezioa" }, language)}</span>
                  <input
                    type="text"
                    value={businessDraft.services[0]?.priceLabel ?? ""}
                    onChange={(event) => updatePrimaryService("priceLabel", event.target.value)}
                    maxLength={80}
                    placeholder={pick({ es: "Ej. 35 €", en: "e.g. €35", eu: "adib. 35 €" }, language)}
                  />
                </label>
                <label className="onboarding-form-grid-wide">
                  <span>{pick({ es: "Descripcion del servicio", en: "Service description", eu: "Zerbitzuaren deskribapena" }, language)}</span>
                  <textarea
                    rows="4"
                    value={businessDraft.services[0]?.description ?? ""}
                    onChange={(event) => updatePrimaryService("description", event.target.value)}
                    maxLength={500}
                    placeholder={pick({ es: "Que incluye y por que deberia interesar", en: "What it includes and why it should matter", eu: "Zer barne hartzen duen eta zergatik interesgarria den" }, language)}
                  />
                </label>
                <label>
                  <span>{pick({ es: "Duracion (min)", en: "Duration (min)", eu: "Iraupena (min)" }, language)}</span>
                  <input
                    type="number"
                    min="1"
                    value={businessDraft.services[0]?.durationMinutes ?? ""}
                    onChange={(event) => updatePrimaryService("durationMinutes", event.target.value)}
                  />
                </label>
                <label>
                  <span>{pick({ es: "Capacidad", en: "Capacity", eu: "Edukiera" }, language)}</span>
                  <input
                    type="number"
                    min="1"
                    value={businessDraft.services[0]?.capacity ?? ""}
                    onChange={(event) => updatePrimaryService("capacity", event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            {!isLoadingBusiness && currentStep.id === "launch" ? (
              <div className="onboarding-section">
                <div className="onboarding-launch-grid">
                  <article className="profile-checklist-item is-complete">
                    <span>{pick({ es: "Panel", en: "Panel", eu: "Panela" }, language)}</span>
                    <strong>{pick({ es: "Ya puedes operar desde tu backoffice", en: "You can now operate from your backoffice", eu: "Orain zure backoffice-tik lan egin dezakezu" }, language)}</strong>
                    <p>{pick({ es: "Tu perfil de negocio ya esta preparado para horarios, inbox, FAQ y rendimiento.", en: "Your business profile is already ready for schedules, inbox, FAQ and performance.", eu: "Zure negozio-profila prest dago ordutegiak, inbox-a, FAQ eta errendimendua kudeatzeko." }, language)}</p>
                    <Link className="button secondary" to="/profile">
                      {pick({ es: "Abrir panel", en: "Open panel", eu: "Ireki panela" }, language)}
                    </Link>
                  </article>
                  <article className="profile-checklist-item is-complete">
                    <span>{pick({ es: "Portal", en: "Portal", eu: "Ataria" }, language)}</span>
                    <strong>{pick({ es: "Tu ficha publica ya tiene base editorial", en: "Your public profile now has an editorial base", eu: "Zure fitxa publikoak badu jada oinarri editoriala" }, language)}</strong>
                    <p>{pick({ es: "Ahora ya se entiende mejor que ofreces, como interactuan contigo y por que existes.", en: "It is now much clearer what you offer, how people interact with you and why you exist.", eu: "Orain askoz argiago dago zer eskaintzen duzun, nola elkarreragiten duten zurekin eta zergatik existitzen zaren." }, language)}</p>
                    <Link className="button secondary" to="/businesses">
                      {pick({ es: "Ver catalogo", en: "View catalogue", eu: "Ikusi katalogoa" }, language)}
                    </Link>
                  </article>
                  <article className="profile-checklist-item is-complete">
                    <span>{pick({ es: "Siguiente nivel", en: "Next level", eu: "Hurrengo maila" }, language)}</span>
                    <strong>{pick({ es: "Lo siguiente es afinar horarios, servicios y respuesta operativa", en: "Next comes refining schedules, services and operational response", eu: "Hurrengoa ordutegiak, zerbitzuak eta erantzun operatiboa fintzea da" }, language)}</strong>
                    <p>{pick({ es: "Ese trabajo ya vive en tu panel, no en otro formulario infinito.", en: "That work now lives in your panel, not in another endless form.", eu: "Lan hori zure panelean dago orain, ez amaigabeko beste formulario batean." }, language)}</p>
                  </article>
                  <article className="profile-checklist-item">
                    <span>{pick({ es: "Proximo foco", en: "Next focus", eu: "Hurrengo fokua" }, language)}</span>
                    <strong>{businessLaunchIdeas.title}</strong>
                    <p>{businessLaunchIdeas.description}</p>
                  </article>
                </div>
              </div>
            ) : null}
          </>
        )}

        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
        {successMessage ? <p className="status-message success">{successMessage}</p> : null}

        <div className="business-workspace-footer">
          <button
            type="button"
            className="button tertiary"
            onClick={handleBack}
            disabled={stepIndex === 0 || isSaving}
          >
            {pick({ es: "Atras", en: "Back", eu: "Atzera" }, language)}
          </button>
          <button type="button" onClick={handleNext} disabled={isSaving || isLoadingBusiness}>
            {isSaving
              ? pick({ es: "Guardando...", en: "Saving...", eu: "Gordetzen..." }, language)
              : stepIndex === steps.length - 1
                ? pick({ es: "Terminar onboarding", en: "Finish onboarding", eu: "Amaitu onboarding-a" }, language)
                : pick({ es: "Continuar", en: "Continue", eu: "Jarraitu" }, language)}
          </button>
        </div>
      </article>
    </section>
  );
}
