const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const authAttempts = new Map();

function getClientKey(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function authRateLimit(req, res, next) {
  const now = Date.now();
  const clientKey = getClientKey(req);
  const currentEntry = authAttempts.get(clientKey);

  if (!currentEntry || currentEntry.expiresAt <= now) {
    authAttempts.set(clientKey, {
      count: 1,
      expiresAt: now + WINDOW_MS
    });

    return next();
  }

  if (currentEntry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((currentEntry.expiresAt - now) / 1000);
    res.setHeader("Retry-After", retryAfterSeconds);
    return res.status(429).json({
      message: "Demasiados intentos. Espera unos minutos antes de volver a probar."
    });
  }

  currentEntry.count += 1;
  authAttempts.set(clientKey, currentEntry);
  next();
}
