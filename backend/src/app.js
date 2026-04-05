import cors from "cors";
import express from "express";
import pool from "./config/db.js";
import env from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import businessRequestRoutes from "./routes/businessRequestRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import savedListRoutes from "./routes/savedListRoutes.js";

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

app.get("/api/health", async (_req, res) => {
  try {
    const [databaseResult, schemaResult] = await Promise.all([
      pool.query("SELECT NOW() AS now"),
      pool.query(
        `SELECT
           EXISTS (
             SELECT 1
             FROM information_schema.tables
             WHERE table_schema = 'public'
               AND table_name = 'business_requests'
           ) AS has_business_requests,
           EXISTS (
             SELECT 1
             FROM information_schema.tables
             WHERE table_schema = 'public'
               AND table_name = 'reservation_waitlist'
           ) AS has_reservation_waitlist,
           EXISTS (
             SELECT 1
             FROM information_schema.tables
             WHERE table_schema = 'public'
               AND table_name = 'saved_lists'
           ) AS has_saved_lists,
           EXISTS (
             SELECT 1
             FROM information_schema.tables
             WHERE table_schema = 'public'
               AND table_name = 'business_schedule_rules'
           ) AS has_business_schedule_rules,
           EXISTS (
             SELECT 1
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = 'businesses'
               AND column_name = 'service_mode'
           ) AS has_service_mode,
           EXISTS (
             SELECT 1
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = 'reviews'
               AND column_name = 'business_response'
           ) AS has_business_response`
      )
    ]);

    const schema = schemaResult.rows[0] ?? {};
    const schemaReady = Object.values(schema).every(Boolean);

    res.status(schemaReady ? 200 : 503).json({
      ok: schemaReady,
      message: schemaReady
        ? "DonostiGo API running"
        : "La API esta activa, pero la base de datos no tiene todavia el esquema esperado",
      checks: {
        database: {
          ok: true,
          timestamp: databaseResult.rows[0]?.now ?? null
        },
        schema: {
          ok: schemaReady,
          details: schema
        }
      }
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      message: "La API esta activa, pero no puede comprobar la base de datos",
      checks: {
        database: {
          ok: false,
          error: error.message
        }
      }
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/requests", businessRequestRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/saved-lists", savedListRoutes);

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
