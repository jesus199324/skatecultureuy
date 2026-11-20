import { type RouteConfig, index, route } from "@react-router/dev/routes";

/** Mapa del sitio. Las rutas son las aprobadas en la Fase 1. */
export default [
  index("routes/home.tsx"),
  route("news", "routes/section.tsx", { id: "news" }),
  route("street", "routes/section.tsx", { id: "street" }),
  route("culture", "routes/section.tsx", { id: "culture" }),
  route("stories", "routes/section.tsx", { id: "stories" }),
  route("stories/:slug", "routes/story.tsx"),
  route("skaters", "routes/skaters.tsx"),
  route("skaters/:slug", "routes/skater.tsx"),
  route("spots", "routes/spots.tsx"),
  route("spots/:slug", "routes/spot.tsx"),
  route("events", "routes/events.tsx"),
  route("events/:slug", "routes/event.tsx"),
  route("about", "routes/about.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
