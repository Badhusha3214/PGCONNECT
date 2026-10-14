// Canonical city names, so "Trivandrum", "TRIVANDRUM " and "Thiruvananthapuram"
// are one city for filters, stats and (later) city landing pages.
const CITY_ALIASES: Record<string, string> = {
  trivandrum: 'Thiruvananthapuram',
  cochin: 'Kochi',
  ernakulam: 'Kochi',
  calicut: 'Kozhikode',
  trichur: 'Thrissur',
  alleppey: 'Alappuzha',
  quilon: 'Kollam',
  palghat: 'Palakkad',
  cannanore: 'Kannur',
}

export function normalizeCity(raw: unknown): string {
  const cleaned = String(raw ?? '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return ''
  const alias = CITY_ALIASES[cleaned.toLowerCase()]
  if (alias) return alias
  return cleaned
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase())
}

// Every spelling that should match a canonical city in a filter.
export function cityVariants(city: string): string[] {
  const canonical = normalizeCity(city)
  const aliases = Object.entries(CITY_ALIASES)
    .filter(([, name]) => name === canonical)
    .map(([alias]) => alias)
  return [canonical, ...aliases]
}
