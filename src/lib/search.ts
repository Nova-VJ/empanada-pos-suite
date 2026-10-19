/**
 * Normaliza texto para búsquedas en español:
 * - Convierte a minúsculas
 * - Remueve acentos y tildes (á->a, é->e, í->i, ó->o, ú->u, ñ se preserva)
 * - Remueve espacios extra
 */
export function normalizeSearch(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve marcas diacríticas (tildes)
    .trim();
}

/**
 * Comprueba si el texto objetivo contiene el término de búsqueda,
 * sin importar mayúsculas, minúsculas, ni acentos/tildes.
 *
 * Ejemplo: matchesSearch("Empanada Pabellón Criollo", "pabellon") => true
 */
export function matchesSearch(target: string | undefined | null, query: string): boolean {
  if (!target) return false;
  if (!query) return true;
  const normTarget = normalizeSearch(target);
  const normQuery = normalizeSearch(query);
  return normTarget.includes(normQuery);
}
