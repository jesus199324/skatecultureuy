/**
 * Entrada del prototipo de la Fase 2 (portada con datos demo).
 * En la Fase 3 esto lo reemplaza el root de React Router (modo framework).
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { buildDemoHome } from "../app/lib/demo-data";
import Home from "../app/routes/home";

document.documentElement.classList.add("js");

// Prototipo: las páginas internas todavía no existen (Fase 3), así que los links internos no navegan.
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest("a");
  if (a && a.getAttribute("href")?.startsWith("/")) e.preventDefault();
});
const now = new Date();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Home data={buildDemoHome(now.getTime())} now={now} />
  </StrictMode>,
);
