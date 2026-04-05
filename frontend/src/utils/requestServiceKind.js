import { pick } from "../i18n/I18nProvider.jsx";

const REQUEST_SERVICE_KIND_DEFINITIONS = [
  {
    value: "service",
    label: {
      es: "Servicio a medida",
      en: "Tailored service",
      eu: "Neurrira egindako zerbitzua"
    },
    badge: {
      es: "Servicio",
      en: "Service",
      eu: "Zerbitzua"
    },
    summary: {
      es: "Pensado para citas o experiencias que el negocio confirma manualmente.",
      en: "For appointments or experiences approved manually by the business.",
      eu: "Negozioak eskuz baieztatzen dituen hitzordu edo esperientzietarako."
    }
  },
  {
    value: "voucher",
    label: {
      es: "Bono o regalo",
      en: "Voucher or gift",
      eu: "Bonua edo oparia"
    },
    badge: {
      es: "Bono",
      en: "Voucher",
      eu: "Bonua"
    },
    summary: {
      es: "Ideal para tarjetas regalo, bonos y experiencias para otra persona.",
      en: "Ideal for gift cards, vouchers and experiences for someone else.",
      eu: "Opari-txartel, bonu eta beste norbaitentzako esperientzietarako aproposa."
    }
  },
  {
    value: "pack",
    label: {
      es: "Pack o pedido",
      en: "Pack or order",
      eu: "Packa edo eskaera"
    },
    badge: {
      es: "Pack",
      en: "Pack",
      eu: "Packa"
    },
    summary: {
      es: "Pensado para encargos, lotes o compras agrupadas con recogida o entrega.",
      en: "Built for custom orders, batches or grouped purchases with pickup or delivery.",
      eu: "Jasotzeko edo entregatzeko enkargu, lote edo erosketa multzokatuetarako."
    }
  },
  {
    value: "request",
    label: {
      es: "Encargo abierto",
      en: "Open request",
      eu: "Eskari irekia"
    },
    badge: {
      es: "Encargo",
      en: "Request",
      eu: "Eskaria"
    },
    summary: {
      es: "Para peticiones flexibles que no encajan en una reserva clasica.",
      en: "For flexible requests that do not fit a classic booking flow.",
      eu: "Erreserba klasiko batean sartzen ez diren eskaera malguetarako."
    }
  }
];

const VOUCHER_STATUS_DEFINITIONS = [
  { value: "draft", label: { es: "Borrador", en: "Draft", eu: "Zirriborroa" } },
  { value: "issued", label: { es: "Emitido", en: "Issued", eu: "Jaulkita" } },
  { value: "redeemed", label: { es: "Canjeado", en: "Redeemed", eu: "Trukatuta" } }
];

const REQUEST_SERVICE_KIND_CONFIG = {
  service: {
    badge: { es: "Servicio", en: "Service", eu: "Zerbitzua" },
    quantityLabel: { es: "Participantes", en: "Participants", eu: "Parte-hartzaileak" },
    quantityUnit: {
      es: "{{value}} participante{{suffix}}",
      en: "{{value}} participant{{suffix}}",
      eu: "{{value}} parte-hartzaile"
    },
    dateLabel: { es: "Fecha preferida", en: "Preferred date", eu: "Nahiago duzun data" },
    datePlaceholderCopy: {
      es: "Cuadra una fecha aproximada para que el negocio pueda proponerte hueco.",
      en: "Pick an approximate date so the business can suggest a suitable slot.",
      eu: "Jarri gutxi gorabeherako data bat negozioak egokitutako tartea proposatzeko."
    },
    messageLabel: { es: "Detalles de la solicitud", en: "Request details", eu: "Eskariaren xehetasunak" },
    messagePlaceholder: {
      es: "Cuenta qué necesitas, para cuándo te encajaría y cualquier detalle importante del servicio.",
      en: "Explain what you need, when it could work for you and any relevant detail.",
      eu: "Azaldu zer behar duzun, noiz egokituko litzaizukeen eta garrantzizko xehetasunak."
    },
    recipientLabel: { es: "Persona de referencia", en: "Reference person", eu: "Harremanetarako pertsona" },
    recipientPlaceholder: {
      es: "Nombre de la persona interesada (opcional)",
      en: "Name of the interested person (optional)",
      eu: "Interesatutako pertsonaren izena (aukerakoa)"
    },
    showRecipientField: false,
    helperCopy: {
      es: "Funciona mejor para experiencias o citas que el negocio revisa manualmente antes de confirmarlas.",
      en: "Best for experiences or appointments the business reviews before confirming.",
      eu: "Negozioak baieztatu aurretik eskuz berrikusten dituen esperientzia edo hitzorduetarako egokiena."
    }
  },
  voucher: {
    badge: { es: "Bono", en: "Voucher", eu: "Bonua" },
    quantityLabel: { es: "Cantidad de bonos", en: "Number of vouchers", eu: "Bonu kopurua" },
    quantityUnit: {
      es: "{{value}} bono{{suffix}}",
      en: "{{value}} voucher{{suffix}}",
      eu: "{{value}} bonu"
    },
    dateLabel: { es: "Entrega preferida", en: "Preferred delivery date", eu: "Nahiago duzun entrega-data" },
    datePlaceholderCopy: {
      es: "Puedes indicar una fecha orientativa si quieres tener el bono listo para un momento concreto.",
      en: "Add a target date if you want the voucher ready for a specific moment.",
      eu: "Jarri data orientagarri bat bonua une jakin baterako prest nahi baduzu."
    },
    messageLabel: { es: "Dedicatoria o detalles", en: "Message or details", eu: "Dedikazioa edo xehetasunak" },
    messagePlaceholder: {
      es: "Indica si es un regalo, si quieres alguna nota especial o cualquier detalle util para prepararlo.",
      en: "Say whether it is a gift, if you want a note, or any useful detail to prepare it.",
      eu: "Adierazi oparia den, ohar berezirik nahi duzun edo prestatzeko xehetasun erabilgarririk."
    },
    recipientLabel: { es: "Persona regalo", en: "Gift recipient", eu: "Opariaren hartzailea" },
    recipientPlaceholder: {
      es: "Nombre de la persona que recibira el bono",
      en: "Name of the person receiving the voucher",
      eu: "Bonua jasoko duen pertsonaren izena"
    },
    showRecipientField: true,
    helperCopy: {
      es: "Perfecto para regalos o experiencias abiertas. El negocio responderá con los detalles para prepararlo.",
      en: "Great for gifts or open experiences. The business will reply with the details to prepare it.",
      eu: "Opari edo esperientzia irekietarako aproposa. Negozioak prestatzeko xehetasunekin erantzungo du."
    }
  },
  pack: {
    badge: { es: "Pack", en: "Pack", eu: "Packa" },
    quantityLabel: { es: "Cantidad de packs", en: "Number of packs", eu: "Pack kopurua" },
    quantityUnit: {
      es: "{{value}} pack{{suffix}}",
      en: "{{value}} pack{{suffix}}",
      eu: "{{value}} pack"
    },
    dateLabel: { es: "Recogida o entrega preferida", en: "Preferred pickup or delivery", eu: "Nahiago duzun jasotze edo entrega" },
    datePlaceholderCopy: {
      es: "Marca una fecha aproximada si necesitas recogerlo o recibirlo en un dia concreto.",
      en: "Choose an approximate date if you need pickup or delivery on a specific day.",
      eu: "Aukeratu gutxi gorabeherako data egun jakin batean jaso edo entregatu behar baduzu."
    },
    messageLabel: { es: "Notas del pedido", en: "Order notes", eu: "Eskaeraren oharrak" },
    messagePlaceholder: {
      es: "Describe el pack que necesitas, unidades, sabores o cualquier condicion importante del encargo.",
      en: "Describe the pack, quantities, flavours or any relevant condition.",
      eu: "Deskribatu packa, unitateak, zaporeak edo enkarguaren baldintza garrantzitsuak."
    },
    recipientLabel: { es: "Persona de contacto", en: "Contact person", eu: "Harremanetarako pertsona" },
    recipientPlaceholder: {
      es: "Nombre de quien recogera o recibira el pedido (opcional)",
      en: "Name of the person picking up or receiving the order (optional)",
      eu: "Eskaera jasoko duen pertsonaren izena (aukerakoa)"
    },
    showRecipientField: false,
    helperCopy: {
      es: "Ideal para encargos o compras agrupadas que el negocio confirma manualmente antes de cerrarlas.",
      en: "Ideal for custom orders or grouped purchases that the business confirms manually.",
      eu: "Negozioak eskuz baieztatzen dituen enkargu edo erosketa multzokatuetarako aproposa."
    }
  },
  request: {
    badge: { es: "Encargo", en: "Request", eu: "Eskaria" },
    quantityLabel: { es: "Unidades", en: "Units", eu: "Unitateak" },
    quantityUnit: {
      es: "{{value}} unidade{{suffix}}",
      en: "{{value}} unit{{suffix}}",
      eu: "{{value}} unitate"
    },
    dateLabel: { es: "Fecha orientativa", en: "Preferred date", eu: "Data orientagarria" },
    datePlaceholderCopy: {
      es: "Indica una fecha aproximada si quieres ayudar al negocio a priorizar tu peticion.",
      en: "Add an approximate date if it helps the business prioritise your request.",
      eu: "Jarri gutxi gorabeherako data negozioari zure eskaria lehenesteko laguntzeko."
    },
    messageLabel: { es: "Detalles del encargo", en: "Request details", eu: "Eskariaren xehetasunak" },
    messagePlaceholder: {
      es: "Explica tu idea con claridad para que el negocio pueda valorar si encaja y responderte mejor.",
      en: "Explain your idea clearly so the business can assess it and reply properly.",
      eu: "Azaldu zure ideia argi, negozioak egokitzen den baloratu eta hobeto erantzun dezan."
    },
    recipientLabel: { es: "Persona de referencia", en: "Reference person", eu: "Harremanetarako pertsona" },
    recipientPlaceholder: {
      es: "Nombre de la persona interesada (opcional)",
      en: "Name of the interested person (optional)",
      eu: "Interesatutako pertsonaren izena (aukerakoa)"
    },
    showRecipientField: false,
    helperCopy: {
      es: "Este modo deja espacio para peticiones abiertas y encargos menos estructurados.",
      en: "This mode leaves room for open requests and less structured orders.",
      eu: "Modu honek eskaera ireki eta egitura txikiagoko enkarguetarako tokia uzten du."
    }
  }
};

export function getRequestServiceKindOptions(language = "es") {
  return REQUEST_SERVICE_KIND_DEFINITIONS.map((option) => ({
    value: option.value,
    label: pick(option.label, language),
    badge: pick(option.badge, language),
    summary: pick(option.summary, language)
  }));
}

export function getVoucherStatusOptions(language = "es") {
  return VOUCHER_STATUS_DEFINITIONS.map((option) => ({
    value: option.value,
    label: pick(option.label, language)
  }));
}

export function getRequestServiceKindConfig(kind, language = "es") {
  const source = REQUEST_SERVICE_KIND_CONFIG[kind] || REQUEST_SERVICE_KIND_CONFIG.service;

  return {
    badge: pick(source.badge, language),
    quantityLabel: pick(source.quantityLabel, language),
    quantityUnit: (value) => {
      const suffix =
        language === "en"
          ? value === 1
            ? ""
            : "s"
          : language === "es"
            ? value === 1
              ? ""
              : "s"
            : "";

      return pick(source.quantityUnit, language, { value, suffix });
    },
    dateLabel: pick(source.dateLabel, language),
    datePlaceholderCopy: pick(source.datePlaceholderCopy, language),
    messageLabel: pick(source.messageLabel, language),
    messagePlaceholder: pick(source.messagePlaceholder, language),
    recipientLabel: pick(source.recipientLabel, language),
    recipientPlaceholder: pick(source.recipientPlaceholder, language),
    showRecipientField: source.showRecipientField,
    helperCopy: pick(source.helperCopy, language),
    summary: pick(
      REQUEST_SERVICE_KIND_DEFINITIONS.find((option) => option.value === (kind || "service"))?.summary,
      language
    )
  };
}

export function formatVoucherStatus(status, language = "es") {
  return getVoucherStatusOptions(language).find((option) => option.value === status)?.label
    || pick({ es: "Pendiente", en: "Pending", eu: "Zain" }, language);
}
