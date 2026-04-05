const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const WEEKDAY_LABELS = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado"
};

const categorySchedulePresets = {
  Restauracion: {
    seatCapacity: 18,
    days: {
      0: { isOpen: true, openTime: "13:00", closeTime: "21:30", slotIntervalMinutes: 30 },
      1: { isOpen: true, openTime: "13:00", closeTime: "22:00", slotIntervalMinutes: 30 },
      2: { isOpen: true, openTime: "13:00", closeTime: "22:00", slotIntervalMinutes: 30 },
      3: { isOpen: true, openTime: "13:00", closeTime: "22:00", slotIntervalMinutes: 30 },
      4: { isOpen: true, openTime: "13:00", closeTime: "22:00", slotIntervalMinutes: 30 },
      5: { isOpen: true, openTime: "13:00", closeTime: "22:30", slotIntervalMinutes: 30 },
      6: { isOpen: true, openTime: "13:00", closeTime: "22:30", slotIntervalMinutes: 30 }
    }
  },
  "Cafeterias y brunch": {
    seatCapacity: 12,
    days: {
      0: { isOpen: true, openTime: "09:00", closeTime: "14:30", slotIntervalMinutes: 30 },
      1: { isOpen: true, openTime: "09:00", closeTime: "14:00", slotIntervalMinutes: 30 },
      2: { isOpen: true, openTime: "09:00", closeTime: "14:00", slotIntervalMinutes: 30 },
      3: { isOpen: true, openTime: "09:00", closeTime: "14:00", slotIntervalMinutes: 30 },
      4: { isOpen: true, openTime: "09:00", closeTime: "14:00", slotIntervalMinutes: 30 },
      5: { isOpen: true, openTime: "09:00", closeTime: "14:30", slotIntervalMinutes: 30 },
      6: { isOpen: true, openTime: "09:00", closeTime: "14:30", slotIntervalMinutes: 30 }
    }
  },
  Deporte: {
    seatCapacity: 10,
    days: {
      0: { isOpen: false, openTime: null, closeTime: null, slotIntervalMinutes: 90 },
      1: { isOpen: true, openTime: "09:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      2: { isOpen: true, openTime: "09:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      3: { isOpen: true, openTime: "09:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      4: { isOpen: true, openTime: "09:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      5: { isOpen: true, openTime: "09:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      6: { isOpen: true, openTime: "09:00", closeTime: "15:00", slotIntervalMinutes: 90 }
    }
  },
  "Bienestar y estetica": {
    seatCapacity: 4,
    days: {
      0: { isOpen: false, openTime: null, closeTime: null, slotIntervalMinutes: 60 },
      1: { isOpen: false, openTime: null, closeTime: null, slotIntervalMinutes: 60 },
      2: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 60 },
      3: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 60 },
      4: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 60 },
      5: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 60 },
      6: { isOpen: true, openTime: "10:00", closeTime: "15:00", slotIntervalMinutes: 60 }
    }
  },
  Ocio: {
    seatCapacity: 16,
    days: {
      0: { isOpen: true, openTime: "11:00", closeTime: "20:00", slotIntervalMinutes: 90 },
      1: { isOpen: true, openTime: "16:00", closeTime: "21:00", slotIntervalMinutes: 90 },
      2: { isOpen: true, openTime: "16:00", closeTime: "21:00", slotIntervalMinutes: 90 },
      3: { isOpen: true, openTime: "16:00", closeTime: "21:00", slotIntervalMinutes: 90 },
      4: { isOpen: true, openTime: "16:00", closeTime: "21:00", slotIntervalMinutes: 90 },
      5: { isOpen: true, openTime: "16:00", closeTime: "22:00", slotIntervalMinutes: 90 },
      6: { isOpen: true, openTime: "11:00", closeTime: "22:00", slotIntervalMinutes: 90 }
    }
  },
  "Turismo y visitas guiadas": {
    seatCapacity: 12,
    days: {
      0: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      1: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      2: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      3: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      4: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      5: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 90 },
      6: { isOpen: true, openTime: "10:00", closeTime: "19:00", slotIntervalMinutes: 90 }
    }
  },
  "Cultura y talleres": {
    seatCapacity: 12,
    days: {
      0: { isOpen: false, openTime: null, closeTime: null, slotIntervalMinutes: 90 },
      1: { isOpen: false, openTime: null, closeTime: null, slotIntervalMinutes: 90 },
      2: { isOpen: true, openTime: "11:00", closeTime: "20:00", slotIntervalMinutes: 90 },
      3: { isOpen: true, openTime: "11:00", closeTime: "20:00", slotIntervalMinutes: 90 },
      4: { isOpen: true, openTime: "11:00", closeTime: "20:00", slotIntervalMinutes: 90 },
      5: { isOpen: true, openTime: "11:00", closeTime: "20:00", slotIntervalMinutes: 90 },
      6: { isOpen: true, openTime: "10:30", closeTime: "19:00", slotIntervalMinutes: 90 }
    }
  },
  "Formacion y clases": {
    seatCapacity: 10,
    days: {
      0: { isOpen: false, openTime: null, closeTime: null, slotIntervalMinutes: 120 },
      1: { isOpen: true, openTime: "10:00", closeTime: "19:30", slotIntervalMinutes: 120 },
      2: { isOpen: true, openTime: "10:00", closeTime: "19:30", slotIntervalMinutes: 120 },
      3: { isOpen: true, openTime: "10:00", closeTime: "19:30", slotIntervalMinutes: 120 },
      4: { isOpen: true, openTime: "10:00", closeTime: "19:30", slotIntervalMinutes: 120 },
      5: { isOpen: true, openTime: "10:00", closeTime: "19:30", slotIntervalMinutes: 120 },
      6: { isOpen: true, openTime: "10:00", closeTime: "14:00", slotIntervalMinutes: 120 }
    }
  },
  default: {
    seatCapacity: 12,
    days: {
      0: { isOpen: false, openTime: null, closeTime: null, slotIntervalMinutes: 60 },
      1: { isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
      2: { isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
      3: { isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
      4: { isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
      5: { isOpen: true, openTime: "10:00", closeTime: "20:00", slotIntervalMinutes: 60 },
      6: { isOpen: true, openTime: "10:00", closeTime: "14:00", slotIntervalMinutes: 60 }
    }
  }
};

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatTime(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${padNumber(hours)}:${padNumber(minutes)}`;
}

function parseTimeToMinutes(value) {
  const normalized = formatTime(value);

  if (!normalized) {
    return null;
  }

  const [hours, minutes] = normalized.split(":").map((part) => Number.parseInt(part, 10));
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${padNumber(hours)}:${padNumber(minutes)}`;
}

function clonePresetRule(dayOfWeek, rule) {
  return {
    dayOfWeek,
    label: WEEKDAY_LABELS[dayOfWeek],
    isOpen: Boolean(rule?.isOpen),
    openTime: rule?.isOpen ? formatTime(rule.openTime) : null,
    closeTime: rule?.isOpen ? formatTime(rule.closeTime) : null,
    slotIntervalMinutes: Number.parseInt(rule?.slotIntervalMinutes, 10) || 60
  };
}

function getPreset(category) {
  return categorySchedulePresets[category] || categorySchedulePresets.default;
}

function ensureRuleIntegrity(rule) {
  const slotIntervalMinutes = Number.parseInt(rule.slotIntervalMinutes, 10);

  if (!rule.isOpen) {
    return {
      ...rule,
      openTime: null,
      closeTime: null,
      slotIntervalMinutes: Number.isInteger(slotIntervalMinutes) && slotIntervalMinutes > 0
        ? slotIntervalMinutes
        : 60
    };
  }

  const openMinutes = parseTimeToMinutes(rule.openTime);
  const closeMinutes = parseTimeToMinutes(rule.closeTime);

  if (
    openMinutes === null ||
    closeMinutes === null ||
    closeMinutes <= openMinutes ||
    !Number.isInteger(slotIntervalMinutes) ||
    slotIntervalMinutes <= 0
  ) {
    throw new Error("schedule_rule_invalid");
  }

  return {
    ...rule,
    openTime: formatMinutesToTime(openMinutes),
    closeTime: formatMinutesToTime(closeMinutes),
    slotIntervalMinutes
  };
}

export function buildDefaultScheduleRules(category) {
  const preset = getPreset(category);

  return WEEKDAY_ORDER.map((dayOfWeek) =>
    clonePresetRule(dayOfWeek, preset.days[dayOfWeek] || preset.days[1] || preset.days[0] || {})
  );
}

export function buildDefaultSeatCapacity(category) {
  return getPreset(category).seatCapacity;
}

export function hydrateScheduleRules(rawRules, category) {
  const defaultRules = buildDefaultScheduleRules(category);
  const rulesByDay = new Map(
    Array.isArray(rawRules)
      ? rawRules
          .map((rule) => {
            const dayOfWeek = Number.parseInt(rule?.dayOfWeek, 10);

            if (!Number.isInteger(dayOfWeek) || !WEEKDAY_LABELS[dayOfWeek]) {
              return null;
            }

            return [
              dayOfWeek,
              ensureRuleIntegrity({
                dayOfWeek,
                label: WEEKDAY_LABELS[dayOfWeek],
                isOpen: Boolean(rule?.isOpen),
                openTime: rule?.openTime,
                closeTime: rule?.closeTime,
                slotIntervalMinutes: rule?.slotIntervalMinutes
              })
            ];
          })
          .filter(Boolean)
      : []
  );

  return defaultRules.map((rule) => rulesByDay.get(rule.dayOfWeek) || rule);
}

export function normalizeScheduleRules(rawRules, category) {
  const mergedRules = hydrateScheduleRules(rawRules, category);
  const seenDays = new Set();

  return mergedRules.map((rule) => {
    if (seenDays.has(rule.dayOfWeek)) {
      throw new Error("schedule_rule_duplicate");
    }

    seenDays.add(rule.dayOfWeek);
    return ensureRuleIntegrity(rule);
  });
}

export function normalizeScheduleExceptions(rawExceptions) {
  if (!Array.isArray(rawExceptions)) {
    return [];
  }

  const seenDates = new Set();

  return rawExceptions
    .map((exception) => {
      if (!exception || typeof exception !== "object") {
        return null;
      }

      const exceptionDate =
        typeof exception.exceptionDate === "string" ? exception.exceptionDate.trim() : "";
      const note =
        typeof exception.note === "string" && exception.note.trim()
          ? exception.note.trim().slice(0, 240)
          : null;
      const isClosed = Boolean(exception.isClosed);
      const slotIntervalMinutes = Number.parseInt(exception.slotIntervalMinutes, 10);

      if (!exceptionDate && !note) {
        return null;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(exceptionDate)) {
        throw new Error("schedule_exception_invalid");
      }

      if (seenDates.has(exceptionDate)) {
        throw new Error("schedule_exception_duplicate");
      }

      seenDates.add(exceptionDate);

      if (isClosed) {
        return {
          exceptionDate,
          isClosed: true,
          openTime: null,
          closeTime: null,
          slotIntervalMinutes: Number.isInteger(slotIntervalMinutes) && slotIntervalMinutes > 0
            ? slotIntervalMinutes
            : 60,
          note
        };
      }

      const openMinutes = parseTimeToMinutes(exception.openTime);
      const closeMinutes = parseTimeToMinutes(exception.closeTime);

      if (
        openMinutes === null ||
        closeMinutes === null ||
        closeMinutes <= openMinutes ||
        !Number.isInteger(slotIntervalMinutes) ||
        slotIntervalMinutes <= 0
      ) {
        throw new Error("schedule_exception_invalid");
      }

      return {
        exceptionDate,
        isClosed: false,
        openTime: formatMinutesToTime(openMinutes),
        closeTime: formatMinutesToTime(closeMinutes),
        slotIntervalMinutes,
        note
      };
    })
    .filter(Boolean)
    .slice(0, 16);
}

export function buildScheduleSummary(scheduleRules) {
  return hydrateScheduleRules(scheduleRules, "default");
}

export function resolveScheduleForDate({
  category,
  service,
  scheduleRules,
  scheduleExceptions,
  dateKey
}) {
  const baseRules = hydrateScheduleRules(scheduleRules, category);
  const exception =
    Array.isArray(scheduleExceptions)
      ? scheduleExceptions.find((item) => item.exceptionDate === dateKey) || null
      : null;
  const targetDate = new Date(`${dateKey}T00:00:00`);
  const dayOfWeek = targetDate.getDay();
  const baseRule = baseRules.find((rule) => rule.dayOfWeek === dayOfWeek) || null;
  const activeRule = exception
    ? {
        dayOfWeek,
        label: WEEKDAY_LABELS[dayOfWeek],
        isOpen: !exception.isClosed,
        openTime: exception.isClosed ? null : formatTime(exception.openTime),
        closeTime: exception.isClosed ? null : formatTime(exception.closeTime),
        slotIntervalMinutes: exception.slotIntervalMinutes,
        note: exception.note || null,
        source: "exception"
      }
    : {
        ...(baseRule || buildDefaultScheduleRules(category).find((rule) => rule.dayOfWeek === dayOfWeek)),
        note: null,
        source: "schedule"
      };

  const seatCapacity = service?.capacity || buildDefaultSeatCapacity(category);

  if (!activeRule || !activeRule.isOpen) {
    return {
      ...activeRule,
      seatCapacity,
      times: [],
      isClosed: true
    };
  }

  const openMinutes = parseTimeToMinutes(activeRule.openTime);
  const closeMinutes = parseTimeToMinutes(activeRule.closeTime);
  const slotIntervalMinutes = Number.parseInt(activeRule.slotIntervalMinutes, 10) || 60;
  const durationMinutes = Number.parseInt(service?.durationMinutes, 10) || slotIntervalMinutes;
  const latestStartMinutes = closeMinutes - Math.min(durationMinutes, Math.max(closeMinutes - openMinutes, slotIntervalMinutes));
  const times = [];

  for (let currentMinutes = openMinutes; currentMinutes <= latestStartMinutes; currentMinutes += slotIntervalMinutes) {
    times.push(formatMinutesToTime(currentMinutes));
  }

  return {
    ...activeRule,
    seatCapacity,
    durationMinutes,
    times,
    isClosed: times.length === 0
  };
}
