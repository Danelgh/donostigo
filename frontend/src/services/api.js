const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL environment variable");
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options
  });
  const data = await parseResponse(response);

  if (!response.ok) {
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

export async function fetchBusinesses() {
  return request("/businesses");
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
  return request("/auth/register", buildJsonRequest("POST", payload));
}

export async function loginUser(payload) {
  return request("/auth/login", buildJsonRequest("POST", payload));
}

export async function fetchCurrentUser() {
  return request("/auth/me");
}

export async function updateCurrentUser(payload) {
  return request("/auth/me", buildJsonRequest("PATCH", payload));
}

export async function logoutUser() {
  return request("/auth/logout", {
    method: "POST"
  });
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

export async function createBusinessReview(businessId, payload) {
  return request(`/businesses/${businessId}/reviews`, buildJsonRequest("POST", payload));
}
