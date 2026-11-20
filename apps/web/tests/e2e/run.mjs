/**
 * Pruebas en navegador (Playwright + Chromium) contra el build de producción.
 * 1. Levanta el servidor SSR (build/server) en un puerto libre.
 * 2. Corre los flujos de la portada y de navegación en escritorio y celular.
 * Uso: npm run build && node tests/e2e/run.mjs
 * Si Chromium no está en la ruta por defecto: PW_CHROMIUM_PATH=/ruta/a/chrome
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { homeSuite } from "./home.e2e.mjs";
import { navSuite } from "./nav.e2e.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const shots = path.join(root, "tests/e2e/screenshots");
fs.mkdirSync(shots, { recursive: true });

const port = await new Promise((r) => {
  const s = net.createServer().listen(0, () => {
    const p = s.address().port;
    s.close(() => r(p));
  });
});
const require = createRequire(import.meta.url);
const serveBin = path.join(path.dirname(require.resolve("@react-router/serve/package.json")), "bin.js");
const server = spawn(process.execPath, [serveBin, "./build/server/index.js"], {
  cwd: root,
  env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "inherit"],
});
const baseUrl = `http://localhost:${port}`;
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(baseUrl)).ok) break;
  } catch { /* todavía arrancando */ }
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push(["✓", name]); } catch (e) { results.push(["✗", name, e.message.split("\n")[0]]); }
};

try {
  await homeSuite({ browser, baseUrl, shots, check });
  await navSuite({ browser, baseUrl, shots, check });
} finally {
  await browser.close();
  server.kill();
}

for (const r of results) console.log(r.join("  "));
const failed = results.filter((r) => r[0] === "✗").length;
console.log(`\n${results.length - failed}/${results.length} pruebas OK`);
process.exit(failed ? 1 : 0);
