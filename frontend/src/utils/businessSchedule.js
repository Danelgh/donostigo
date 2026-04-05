import { pick } from "../i18n/I18nProvider.jsx";

const DAY_LABELS = {
  0: { es: "Domingo", en: "Sunday", eu: "Igandea" },
  1: { es: "Lunes", en: "Monday", eu: "Astelehena" },
  2: { es: "Martes", en: "Tuesday", eu: "Asteartea" },
  3: { es: "Miercoles", en: "Wednesday", eu: "Asteazkena" },
  4: { es: "Jueves", en: "Thursday", eu: "Osteguna" },
  5: { es: "Viernes", en: "Friday", eu: "Ostirala" },
  6: { es: "Sabado", en: "Saturday", eu: "Larunbata" }
};

const SLOT_INTERVAL_DEFINITIONS = [30, 45, 60, 90, 120];

const DEFAULT_BUSINESS_SCHEDULE_RULES = [
  { dayOfWeek: 1, isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
  { dayOfWeek: 2, isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
  { dayOfWeek: 3, isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
  { dayOfWeek: 4, isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
  { dayOfWeek: 5, isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
  { dayOfWeek: 6, isOpen: true, openTime: "10:00", closeTime: "14:00", slotIntervalMinutes: 60 },
  { dayOfWeek: 0, isOpen: false, openTime: null, closeTime: null, slotIntervalMinutes: 60 }
];

export function getDayLabel(dayOfWeek, language = "es") {
  return pick(DAY_LABELS[dayOfWeek] || DAY_LABELS[1], language);
}

export function getSlotIntervalOptions(language = "es") {
  return SLOT_INTERVAL_DEFINITIONS.map((value) => ({
    value,
    label: pick(
      {
        es: `Cada ${value} min`,
        en: `Every ${value} min`,
        eu: `${value} minuturo`
      },
      language
    )
  }));
}

export function createDefaultBusinessScheduleRules(language = "es") {
  return DEFAULT_BUSINESS_SCHEDULE_RULES.map((rule) => ({
    ...rule,
    label: getDayLabel(rule.dayOfWeek, language)
  }));
}

export function createEmptyBusinessScheduleException() {
  return {
    exceptionDate: "",
    isClosed: true,
    openTime: "10:00",
    closeTime: "14:00",
    slotIntervalMinutes: "60",
    note: ""
  };
}
