import dotenv from "dotenv";

dotenv.config();

const requiredVariables = ["DATABASE_URL", "JWT_SECRET"];

for (const variableName of requiredVariables) {
  const value = process.env[variableName]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
}

if (process.env.JWT_SECRET === "change_this_secret") {
  throw new Error("JWT_SECRET must be changed before starting the API");
}

const env = {
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development"
};

export default env;
