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

export async function fetchRecommendedBusinesses() {
  return request("/businesses/recommended");
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

export async function fetchBusinessAvailability(businessId, filters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.date) {
    searchParams.set("date", filters.date);
  }

  if (filters.people) {
    searchParams.set("people", String(filters.people));
  }

  if (filters.serviceId) {
    searchParams.set("serviceId", String(filters.serviceId));
  }

  const queryString = searchParams.toString();

  return request(
    `/reservations/businesses/${businessId}/availability${queryString ? `?${queryString}` : ""}`
  );
}

export async function fetchMyReservations() {
  return request("/reservations/my");
}

export async function fetchMyWaitlistEntries() {
  return request("/reservations/waitlist/my");
}

export async function fetchBusinessWaitlistEntries() {
  return request("/reservations/waitlist/business");
}

export async function fetchBusinessReservations() {
  return request("/reservations/business");
}

export async function updateReservationStatus(reservationId, payload) {
  return request(`/reservations/${reservationId}/status`, buildJsonRequest("PATCH", payload));
}

export async function createBusinessServiceRequest(payload) {
  return request("/requests", buildJsonRequest("POST", payload));
}

export async function fetchMyBusinessServiceRequests() {
  return request("/requests/my");
}

export async function fetchBusinessServiceRequests() {
  return request("/requests/business");
}

export async function updateBusinessServiceRequestStatus(requestId, payload) {
  return request(`/requests/${requestId}/status`, buildJsonRequest("PATCH", payload));
}

export async function respondToBusinessServiceRequest(requestId, payload) {
  return request(`/requests/${requestId}/customer-response`, buildJsonRequest("PATCH", payload));
}

export async function updateBusinessServiceRequestVoucherStatus(requestId, payload) {
  return request(`/requests/${requestId}/voucher-status`, buildJsonRequest("PATCH", payload));
}

export async function joinReservationWaitlist(payload) {
  return request("/reservations/waitlist", buildJsonRequest("POST", payload));
}

export async function updateWaitlistStatus(waitlistId, payload) {
  return request(`/reservations/waitlist/${waitlistId}/status`, buildJsonRequest("PATCH", payload));
}

export async function createBusinessReview(businessId, payload) {
  return request(`/businesses/${businessId}/reviews`, buildJsonRequest("POST", payload));
}

export async function saveBusinessReviewResponse(businessId, reviewId, payload) {
  return request(
    `/businesses/${businessId}/reviews/${reviewId}/response`,
    buildJsonRequest("POST", payload)
  );
}

export async function fetchSavedLists() {
  return request("/saved-lists");
}

export async function createSavedList(payload) {
  return request("/saved-lists", buildJsonRequest("POST", payload));
}

export async function updateSavedList(listId, payload) {
  return request(`/saved-lists/${listId}`, buildJsonRequest("PATCH", payload));
}

export async function deleteSavedList(listId) {
  return request(`/saved-lists/${listId}`, {
    method: "DELETE"
  });
}

export async function fetchPublicSavedLists() {
  return request("/saved-lists/public");
}

export async function fetchPublicSavedListBySlug(slug) {
  return request(`/saved-lists/public/${slug}`);
}

export async function clonePublicSavedList(slug) {
  return request(`/saved-lists/public/${slug}/clone`, {
    method: "POST"
  });
}

export async function addBusinessToSavedList(listId, payload) {
  return request(`/saved-lists/${listId}/businesses`, buildJsonRequest("POST", payload));
}

export async function removeBusinessFromSavedList(listId, businessId) {
  return request(`/saved-lists/${listId}/businesses/${businessId}`, {
    method: "DELETE"
  });
}
