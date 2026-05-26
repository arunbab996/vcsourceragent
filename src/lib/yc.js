// YC company data — two strategies, best-effort in order:
//  1. yc-oss unofficial API (GitHub Pages, CORS-friendly)
//     Gives us proper company data: description, website, tags, founders, city
//  2. HN Algolia "Launch HN:" posts (always works, less structured)

const HN_SEARCH  = 'https://hn.algolia.com/api/v1/search'
const YCOSS_BASE = 'https://yc-oss.github.io/api'

// Derive the last two batch codes relative to today so we always
// try the freshest data first. YC runs W<year> (Jan-Mar) and S<year> (Jun-Aug).
function recentBatchCodes() {
  const now    = new Date()
  const year   = now.getFullYear()
  const month  = now.getMonth() + 1 // 1-12
  // If we're past June, current batch is S<year>; otherwise W<year>
  const codes  = month >= 6
    ? [`S${year}`, `W${year}`, `S${year - 1}`]
    : [`W${year}`, `S${year - 1}`, `W${year - 1}`]
  return codes
}

function ycossToLaunch(c) {
  const founders = (c.founders || [])
    .map(f => ({
      id:       String(f.id || f.name),
      name:     [f.first_name, f.last_name].filter(Boolean).join(' ') || f.name || 'Unknown',
      username: f.hn_username || '',
      headline: f.title || 'Founder',
      twitter:  f.twitter_url?.replace(/.*twitter\.com\//, '') || '',
      website:  f.linkedin_url || '',
      avatar:   null,
    }))
    .filter(f => f.name && f.name !== 'Unknown')

  return {
    id:          String(c.id),
    name:        c.name,
    tagline:     c.one_liner || c.description || '',
    description: c.long_description || c.description || c.one_liner || '',
    url:         `https://www.ycombinator.com/companies/${c.slug}`,
    website:     c.website || '',
    votes:       0,
    comments:    0,
    createdAt:   c.launched_at ? new Date(c.launched_at * 1000).toISOString() : new Date().toISOString(),
    thumbnail:   c.small_logo_thumb_url || null,
    topics:      c.tags || [],
    makers:      founders,
    batch:       c.batch,
    teamSize:    c.team_size,
  }
}

async function tryYcOss() {
  const batches = recentBatchCodes()

  // First try /batches/current.json
  try {
    const res = await fetch(`${YCOSS_BASE}/batches/current.json`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[YC] yc-oss current.json — ${data.length} companies`)
        return data.map(ycossToLaunch)
      }
    }
  } catch { /* fall through */ }

  // Try specific batch codes
  for (const batch of batches) {
    try {
      const res = await fetch(`${YCOSS_BASE}/batches/${batch}.json`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          console.log(`[YC] yc-oss ${batch} — ${data.length} companies`)
          return data.map(ycossToLaunch)
        }
      }
    } catch { /* try next */ }
  }

  return null // signal to fall back to HN
}

async function tryHnAlgolia(monthsBack) {
  const since = Math.floor((Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000) / 1000)
  const res   = await fetch(
    `${HN_SEARCH}?query=Launch+HN&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=80`
  )
  if (!res.ok) throw new Error(`HN API error ${res.status}`)
  const data = await res.json()

  return data.hits
    .filter(h => h.title?.startsWith('Launch HN:'))
    .map(h => {
      const withoutPrefix = h.title.replace(/^Launch HN:\s*/, '')
      const sep     = withoutPrefix.search(/\s[–—|-]\s/)
      const name    = sep > 0 ? withoutPrefix.slice(0, sep).trim() : withoutPrefix.trim()
      const tagline = sep > 0 ? withoutPrefix.slice(sep).replace(/^[\s–—|-]+/, '').trim() : ''

      return {
        id:          String(h.objectID),
        name,
        tagline,
        description: tagline,
        url:         `https://news.ycombinator.com/item?id=${h.objectID}`,
        website:     h.url || '',
        votes:       h.points || 0,
        comments:    h.num_comments || 0,
        createdAt:   h.created_at,
        thumbnail:   null,
        topics:      [],
        makers:      h.author
          ? [{ id: h.author, name: h.author, username: h.author, headline: 'YC Founder', twitter: '', website: h.url || '', avatar: null }]
          : [],
      }
    })
}

export async function fetchRecentYCCompanies(monthsBack = 6) {
  // Try the rich yc-oss API first
  const ycoss = await tryYcOss()
  if (ycoss && ycoss.length > 0) return ycoss

  // Fall back to parsing HN "Launch HN:" posts
  console.log('[YC] falling back to HN Algolia')
  return tryHnAlgolia(monthsBack)
}
