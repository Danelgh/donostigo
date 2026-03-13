import cors from "cors";
import express from "express";
import env from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

const app = express();
const allowedOrigins = new Set([env.clientUrl]);
const localDevelopmentOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

if (env.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        (env.nodeEnv !== "production" && localDevelopmentOriginPattern.test(origin))
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "DonostiGo API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/reservations", reservationRoutes);

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "El cuerpo JSON de la peticion no tiene un formato valido" });
  }

  if (error.message === "Origen no permitido por CORS") {
    return res.status(403).json({ message: error.message });
  }

  if (env.nodeEnv !== "production") {
    console.error(error);
  }

  return res.status(500).json({ message: "Error interno del servidor" });
});

export default app;
