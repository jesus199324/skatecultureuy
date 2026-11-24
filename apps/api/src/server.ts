import { createApp } from "./app";
import { loadConfig } from "./config";
import { createDb } from "./db/client";

const config = loadConfig();
const { db, pool } = createDb(config.DATABASE_URL);
const server = createApp(db, config).listen(config.PORT, () => {
  console.log(`API de SKATE CULTURE UY en http://localhost:${config.PORT}/api`);
});

// Cierre ordenado (deploys y Ctrl+C).
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => void pool.end().then(() => process.exit(0)));
  });
}
