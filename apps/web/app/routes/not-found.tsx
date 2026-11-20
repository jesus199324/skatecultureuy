import { data } from "react-router";

/** Cualquier ruta que no existe: responde 404 y la muestra el ErrorBoundary del layout. */
export function loader() {
  throw data("Página no encontrada", { status: 404 });
}

export default function NotFound() {
  return null;
}
