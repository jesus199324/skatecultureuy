/**
 * Carga en la base el mismo contenido de demostración que muestran hoy las
 * páginas (packages/shared/src/demo). Todo queda con is_demo = true y
 * publicado. Antes de cargar, borra el contenido demo anterior: el contenido
 * real (is_demo = false) no se toca.
 */
import { eq } from "drizzle-orm";
import type { ArticleBlock, MediaAsset } from "../../../../packages/shared/src";
import { buildDemoDb } from "../../../../packages/shared/src/demo/content";
import { buildDemoHome } from "../../../../packages/shared/src/demo/home";
import type { Db } from "./client";
import * as t from "./schema";

/** Borra todo el contenido marcado como demo. */
export async function deleteDemo(db: Db) {
  await db.transaction(async (tx) => {
    await tx.delete(t.events).where(eq(t.events.isDemo, true));
    await tx.delete(t.articles).where(eq(t.articles.isDemo, true));
    await tx.delete(t.skaters).where(eq(t.skaters.isDemo, true));
    await tx.delete(t.spots).where(eq(t.spots.isDemo, true));
    await tx.delete(t.pullQuotes).where(eq(t.pullQuotes.isDemo, true));
    await tx.delete(t.mediaAssets).where(eq(t.mediaAssets.isDemo, true));
  });
}

export async function seedDemo(db: Db, now = Date.now()) {
  const demo = buildDemoDb(now);
  const home = buildDemoHome(now);
  await deleteDemo(db);

  await db.transaction(async (tx) => {
    // Fotos: una fila por foto demo; los ids demo se traducen a uuid.
    const mediaIds = new Map<string, string>();
    const media = async (m: MediaAsset | null): Promise<string | null> => {
      if (!m) return null;
      const known = mediaIds.get(m.id);
      if (known) return known;
      const [row] = await tx
        .insert(t.mediaAssets)
        .values({ publicId: m.publicId, width: m.width, height: m.height, altText: m.altText, credit: m.credit, isDemo: true, placeholderTone: m.placeholderTone ?? null })
        .returning({ id: t.mediaAssets.id });
      mediaIds.set(m.id, row.id);
      return row.id;
    };

    // Categorías (se reutilizan si ya existen).
    const catIds = new Map<string, string>();
    for (const c of new Map(demo.articles.map((a) => [a.category.slug, a.category])).values()) {
      const [row] = await tx
        .insert(t.categories)
        .values({ name: c.name, slug: c.slug })
        .onConflictDoUpdate({ target: t.categories.slug, set: { name: c.name } })
        .returning({ id: t.categories.id });
      catIds.set(c.slug, row.id);
    }

    const spotIds = new Map<string, string>();
    for (const [i, s] of demo.spots.entries()) {
      const [row] = await tx
        .insert(t.spots)
        .values({
          name: s.name, slug: s.slug, type: s.type, department: s.department, features: s.features,
          coverImageId: await media(s.coverImage), description: s.description, locality: s.locality,
          address: s.address, lat: s.coordinates?.lat ?? null, lng: s.coordinates?.lng ?? null,
          featured: home.spots.some((h) => h.slug === s.slug), position: i, status: "PUBLISHED", isDemo: true,
        })
        .returning({ id: t.spots.id });
      spotIds.set(s.slug, row.id);
      for (const [pos, g] of s.gallery.entries()) {
        await tx.insert(t.spotGallery).values({ spotId: row.id, mediaId: (await media(g))!, position: pos });
      }
    }

    const skaterIds = new Map<string, string>();
    for (const [i, k] of demo.skaters.entries()) {
      const [row] = await tx
        .insert(t.skaters)
        .values({
          name: k.name, slug: k.slug, city: k.city, profileImageId: await media(k.profileImage), highlights: k.highlights,
          bio: k.bio, stance: k.stance, instagram: k.instagram, featured: home.skaters.some((h) => h.slug === k.slug),
          position: i, status: "PUBLISHED", isDemo: true,
        })
        .returning({ id: t.skaters.id });
      skaterIds.set(k.slug, row.id);
    }

    for (const a of demo.articles) {
      const [row] = await tx
        .insert(t.articles)
        .values({
          title: a.title, slug: a.slug, excerpt: a.excerpt, format: a.format, categoryId: catIds.get(a.category.slug)!,
          author: a.author, coverImageId: await media(a.coverImage), featured: a.featured, status: "PUBLISHED",
          publishedAt: new Date(a.publishedAt), newsTopic: a.newsTopic, readMinutes: a.readMinutes,
          videoDuration: a.videoDuration ?? null, body: a.body as ArticleBlock[], video: a.video, isDemo: a.isDemo,
        })
        // Las notas reales del demo (p. ej. "Cómo enviar material") no se borran
        // con deleteDemo: si ya existen, se dejan como están.
        .onConflictDoNothing({ target: t.articles.slug })
        .returning({ id: t.articles.id });
      if (!row) continue;
      for (const [pos, g] of a.gallery.entries()) {
        await tx.insert(t.articleGallery).values({ articleId: row.id, mediaId: (await media(g))!, position: pos });
      }
      for (const k of a.skaters) await tx.insert(t.articleSkaters).values({ articleId: row.id, skaterId: skaterIds.get(k.slug)! });
      for (const p of a.spots) await tx.insert(t.articleSpots).values({ articleId: row.id, spotId: spotIds.get(p.slug)! });
    }

    for (const e of demo.events) {
      await tx.insert(t.events).values({
        name: e.name, slug: e.slug, eventDate: new Date(e.eventDate), endDate: e.endDate ? new Date(e.endDate) : null,
        location: e.location, cancelled: e.cancelled, externalUrl: e.externalUrl, description: e.description,
        coverImageId: await media(e.coverImage), spotId: e.spot ? spotIds.get(e.spot.slug)! : null,
        status: "PUBLISHED", isDemo: true,
      });
    }

    await tx.insert(t.pullQuotes).values({ text: home.quote.text, attribution: home.quote.attribution, isDemo: true });
  });

  return {
    articles: demo.articles.length,
    skaters: demo.skaters.length,
    spots: demo.spots.length,
    events: demo.events.length,
  };
}

/** Vacía todas las tablas de contenido (demo y real). */
export async function truncateAll(db: Db) {
  const tables = [
    t.articleSkaters, t.articleSpots, t.articleGallery, t.spotGallery, t.events, t.articles, t.skaters, t.spots,
    t.pullQuotes, t.categories, t.mediaAssets,
  ];
  await db.transaction(async (tx) => {
    for (const table of tables) await tx.delete(table);
  });
}

