import cors from "cors";
import express from "express";
import env from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "DonostiGo API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/reservations", reservationRoutes);

export default app;
