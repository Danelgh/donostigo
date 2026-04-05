function formatDateForIcs(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function downloadReservationCalendarEvent(reservation) {
  const startDate = new Date(reservation.reservation_date);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("La fecha de la reserva no es valida para generar el calendario");
  }

  const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
  const uid = `donostigo-reservation-${reservation.id}@donostigo.local`;
  const summary = reservation.service_title
    ? `${reservation.service_title} · ${reservation.business_name}`
    : `Reserva en ${reservation.business_name}`;
  const description = [
    `Reserva realizada desde DonostiGo.`,
    `Negocio: ${reservation.business_name}`,
    reservation.service_title ? `Servicio: ${reservation.service_title}` : null,
    `Personas: ${reservation.people}`,
    `Estado: ${reservation.status}`
  ]
    .filter(Boolean)
    .join("\n");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DonostiGo//Reserva//ES",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDateForIcs(new Date())}`,
    `DTSTART:${formatDateForIcs(startDate)}`,
    `DTEND:${formatDateForIcs(endDate)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(reservation.business_address || reservation.business_name)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `reserva-${reservation.business_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}
