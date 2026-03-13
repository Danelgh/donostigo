export function buildGoogleMapsSearchUrl(address) {
  if (!address) {
    return "";
  }

  const query = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildGoogleMapsEmbedUrl(address) {
  if (!address) {
    return "";
  }

  const query = encodeURIComponent(address);
  return `https://www.google.com/maps?q=${query}&output=embed`;
}
