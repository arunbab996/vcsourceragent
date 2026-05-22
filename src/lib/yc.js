const YC_API = 'https://yc-oss.github.io/api/companies/all.json'

// W26 = Winter 2026, S25 = Summer 2025, etc.
const RECENT_BATCHES = new Set(['W26', 'S25', 'W25', 'S24'])

export async function fetchRecentYCCompanies(batches = RECENT_BATCHES) {
  const res = await fetch(YC_API)
  if (!res.ok) throw new Error(`YC API error ${res.status}`)

  const companies = await res.json()

  return companies
    .filter(c => batches.has(c.batch) && c.status !== 'Inactive')
    .map(c => ({
      id: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      name: c.name,
      tagline: c.one_liner || '',
      description: c.long_description || c.one_liner || '',
      url: `https://www.ycombinator.com/companies/${c.slug}`,
      website: c.website || '',
      votes: 0,
      comments: 0,
      createdAt: c.year_founded ? `${c.year_founded}-01-01` : null,
      thumbnail: c.small_logo_thumb_url || c.logo_url || null,
      topics: c.tags || [],
      batch: c.batch,
      location: c.location || null,
      makers: [],
    }))
}
