import process from "node:process";

const baseUrl = (
  process.env.SMOKE_BASE_URL ||
  `http://127.0.0.1:${process.env.PORT || 4000}/api`
).replace(/\/$/, "");

async function parseJson(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    throw new Error(`Respuesta no JSON desde ${response.url}: ${text.slice(0, 240)}`);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText} en ${path}: ${data?.message || "sin detalle"}`
    );
  }

  return data;
}

async function login(email, password) {
  const session = await request("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!session?.token) {
    throw new Error(`Login sin token para ${email}`);
  }

  return session;
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

async function main() {
  console.log(`Smoke contra ${baseUrl}`);

  const health = await request("/health");
  if (!health?.checks?.database?.ok || !health?.checks?.schema?.ok) {
    throw new Error("Health OK parcial: la base o el esquema no estan listos");
  }
  console.log("✓ health");

  const publicBusinesses = await request("/businesses");
  if (!Array.isArray(publicBusinesses) || publicBusinesses.length === 0) {
    throw new Error("El catalogo publico no devolvio negocios");
  }
  console.log("✓ catalogo publico");

  const firstBusiness = publicBusinesses[0];
  const detail = await request(`/businesses/${firstBusiness.id}`);
  if (!detail?.id || !detail?.name) {
    throw new Error("La ficha de negocio no devolvio datos minimos");
  }
  console.log("✓ ficha publica");

  const publicGuides = await request("/saved-lists/public");
  if (!Array.isArray(publicGuides)) {
    throw new Error("Las guias publicas no devolvieron una lista valida");
  }
  console.log("✓ guias publicas");

  const clientSession = await login("ane@donostigo.local", "Demo1234");
  const clientMe = await request("/auth/me", {
    headers: authHeaders(clientSession.token)
  });
  if (clientMe?.user?.role !== "user") {
    throw new Error("La cuenta cliente no devolvio el rol esperado");
  }
  console.log("✓ login cliente");

  const clientReservations = await request("/reservations/my", {
    headers: authHeaders(clientSession.token)
  });
  if (!Array.isArray(clientReservations)) {
    throw new Error("La actividad del cliente no devolvio una lista valida");
  }
  console.log("✓ actividad cliente");

  const recommendations = await request("/businesses/recommended", {
    headers: authHeaders(clientSession.token)
  });
  if (!Array.isArray(recommendations)) {
    throw new Error("Las recomendaciones no devolvieron una lista valida");
  }
  console.log("✓ recomendaciones");

  const businessSession = await login("surf@donostigo.local", "Demo1234");
  const myBusiness = await request("/businesses/me", {
    headers: authHeaders(businessSession.token)
  });
  if (!myBusiness?.business?.insights || !myBusiness?.business?.alerts) {
    throw new Error("El panel de negocio no devolvio insights y alertas");
  }
  console.log("✓ panel negocio");

  const businessReservations = await request("/reservations/business", {
    headers: authHeaders(businessSession.token)
  });
  if (!Array.isArray(businessReservations?.reservations)) {
    throw new Error("Las reservas del negocio no devolvieron una lista valida");
  }
  console.log("✓ reservas negocio");

  console.log("Smoke completado correctamente.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
