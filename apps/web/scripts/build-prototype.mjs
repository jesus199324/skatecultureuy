/**
 * Build del prototipo sin Vite (no instalable en el entorno de la Fase 2):
 *  1. Tailwind v4 compila app.css con las clases encontradas en el código.
 *  2. Bun empaqueta prototype/main.tsx.
 *  3. Se arma dist/index.html (y una versión de un solo archivo).
 * Uso: node scripts/build-prototype.mjs
 */
import { compile } from "tailwindcss";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
fs.mkdirSync(dist, { recursive: true });

// 1) Candidatos de clases: todos los tokens de los .tsx/.ts del front.
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : /\.(tsx?|mjs)$/.test(d.name) ? [p] : [];
  });
}
const sources = [...walk(path.join(root, "app")), ...walk(path.join(root, "prototype"))];
const candidates = new Set();
for (const f of sources) {
  for (const tok of fs.readFileSync(f, "utf8").split(/[\s"'`{}<>;]+/)) if (tok) candidates.add(tok);
}

const twBase = path.dirname(fileURLToPath(import.meta.resolve("tailwindcss/package.json")));
const cssEntry = path.join(root, "app/styles/app.css");
const compiler = await compile(fs.readFileSync(cssEntry, "utf8"), {
  base: path.dirname(cssEntry),
  loadStylesheet: async (id, base) => {
    const p = id === "tailwindcss" ? path.join(twBase, "index.css") : path.resolve(base, id);
    return { path: p, base: path.dirname(p), content: fs.readFileSync(p, "utf8") };
  },
});
const css = compiler.build([...candidates]);
fs.writeFileSync(path.join(dist, "app.css"), css);

// 2) JS con Bun.
execFileSync("bun", ["build", path.join(root, "prototype/main.tsx"), "--outdir", dist, "--minify", "--target", "browser", "--define", 'process.env.NODE_ENV="production"'], { stdio: "inherit" });
const js = fs.readFileSync(path.join(dist, "main.js"), "utf8");

// 3) HTML.
const head = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SKATE CULTURE UY — Prototipo de portada (Fase 2)</title>
<meta name="description" content="Revista digital independiente de skateboarding uruguayo. Prototipo con contenido de demostración.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo+Narrow:wght@500;600;700&family=Inter:wght@400;500;600&family=Permanent+Marker&display=swap" rel="stylesheet">`;

fs.writeFileSync(path.join(dist, "index.html"), `${head}
<link rel="stylesheet" href="app.css">
</head>
<body><div id="root"></div><script type="module" src="main.js"></script></body>
</html>
`);
fs.writeFileSync(path.join(dist, "standalone.html"), `${head}
<style>${css}</style>
</head>
<body><div id="root"></div><script type="module">${js.replace(/<\/script/gi, "<\\/script")}</script></body>
</html>
`);
console.log(`CSS ${(css.length / 1024).toFixed(1)} KB · JS ${(js.length / 1024).toFixed(1)} KB · ${candidates.size} candidatos`);
