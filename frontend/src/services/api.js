const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_STORAGE_KEY = "donostigo_token";

if (!API_URL) {
  throw new Error("Missing VITE_API_URL environment variable");
}

function getStoredToken() {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (_error) {
    return null;
  }
}

function storeToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch (_error) {
    // Ignoramos errores de almacenamiento para no bloquear la interfaz.
  }
}

function clearStoredToken() {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (_error) {
    // Ignoramos errores de almacenamiento para no bloquear la interfaz.
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request(path, options = {}) {
  const { headers: optionHeaders, ...restOptions } = options;
  const token = getStoredToken();
  const requestHeaders = new Headers(optionHeaders || {});

  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...restOptions,
    headers: requestHeaders
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
    }

    const message =
      typeof data === "object" && data?.message
        ? data.message
        : "Se ha producido un error al comunicarse con la API";

    throw new Error(message);
  }

  return data;
}

function buildJsonRequest(method, body) {
  return {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

export async function fetchBusinesses(filters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.q?.trim()) {
    searchParams.set("q", filters.q.trim());
  }

  if (filters.category && filters.category !== "all") {
    searchParams.set("category", filters.category);
  }

  if (filters.sort) {
    searchParams.set("sort", filters.sort);
  }

  const queryString = searchParams.toString();

  return request(`/businesses${queryString ? `?${queryString}` : ""}`);
}

export async function fetchCategories() {
  return request("/businesses/categories");
}

export async function fetchBusinessById(id) {
  return request(`/businesses/${id}`);
}

export async function fetchMyBusinessProfile() {
  return request("/businesses/me");
}

export async function saveMyBusinessProfile(payload) {
  return request("/businesses/me", buildJsonRequest("PATCH", payload));
}

export async function registerUser(payload) {
  const session = await request("/auth/register", buildJsonRequest("POST", payload));

  if (session?.token) {
    storeToken(session.token);
  }

  return session;
}

export async function loginUser(payload) {
  const session = await request("/auth/login", buildJsonRequest("POST", payload));

  if (session?.token) {
    storeToken(session.token);
  }

  return session;
}

export async function fetchCurrentUser() {
  const session = await request("/auth/me");

  if (session?.token) {
    storeToken(session.token);
  }

  return session;
}

export async function updateCurrentUser(payload) {
  return request("/auth/me", buildJsonRequest("PATCH", payload));
}

export async function logoutUser() {
  const response = await request("/auth/logout", {
    method: "POST"
  });

  clearStoredToken();

  return response;
}

export async function createReservation(payload) {
  return request("/reservations", buildJsonRequest("POST", payload));
}

export async function fetchMyReservations() {
  return request("/reservations/my");
}

export async function fetchBusinessReservations() {
  return request("/reservations/business");
}

export async function updateReservationStatus(reservationId, payload) {
  return request(`/reservations/${reservationId}/status`, buildJsonRequest("PATCH", payload));
}

export async function createBusinessReview(businessId, payload) {
  return request(`/businesses/${businessId}/reviews`, buildJsonRequest("POST", payload));
}
