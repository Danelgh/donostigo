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
  const response = await fetch(`${API_URL}${path}`, options);
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

function buildJsonRequest(method, body, token) {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  };
}

export async function fetchBusinesses() {
  return request("/businesses");
}

export async function fetchBusinessById(id) {
  return request(`/businesses/${id}`);
}

export async function registerUser(payload) {
  return request("/auth/register", buildJsonRequest("POST", payload));
}

export async function loginUser(payload) {
  return request("/auth/login", buildJsonRequest("POST", payload));
}

export async function fetchCurrentUser(token) {
  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function updateCurrentUser(payload, token) {
  return request("/auth/me", buildJsonRequest("PATCH", payload, token));
}

export async function createReservation(payload, token) {
  return request("/reservations", buildJsonRequest("POST", payload, token));
}

export async function fetchMyReservations(token) {
  return request("/reservations/my", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function createBusinessReview(businessId, payload, token) {
  return request(`/businesses/${businessId}/reviews`, buildJsonRequest("POST", payload, token));
}
