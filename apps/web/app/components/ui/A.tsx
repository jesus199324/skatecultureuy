import type { ComponentProps } from "react";
import { Link } from "react-router";

/**
 * Link de la revista: las rutas internas ("/spots") navegan sin recargar la
 * página (React Router); las externas son un <a> común.
 */
export function A({ href, ...rest }: ComponentProps<"a"> & { href: string }) {
  const internal = href.startsWith("/") && !href.startsWith("//");
  if (internal) return <Link to={href} {...rest} />;
  return <a href={href} {...rest} />;
}
