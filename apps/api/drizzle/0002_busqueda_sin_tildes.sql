-- Búsqueda del panel sin importar mayúsculas ni tildes ("rodo" encuentra "Rodó").
-- Se usa translate() para no depender de extensiones.
CREATE OR REPLACE FUNCTION unaccent_simple(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT translate(lower(coalesce(t, '')), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc')
$$;
