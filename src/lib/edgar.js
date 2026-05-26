// SEC EDGAR Form D — companies legally disclosing a fundraise.
// Form D must be filed within 15 days of the first securities sale.
// This is often the earliest public signal that a round is happening,
// before any press coverage. We filter for tech-ish industries only.

const EFTS     = 'https://efts.sec.gov/LATEST/search-index'
const ARCHIVES = 'https://www.sec.gov/Archives/edgar/data'

// Industry groups from SEC Form D we want to surface
const KEEP_INDUSTRIES = [
  'Technology', 'Computers', 'Internet', 'Telecommunications',
  'Health Care', 'Biotechnology', 'Business Services',
]

// Strip leading zeros from CIK for URL path
function cikPath(raw) { return String(parseInt(raw, 10)) }

// Accession "0001234567-26-000001" → "000123456726000001" (for URL)
function accNoPath(acc) { return acc.replace(/-/g, '') }

// Parse the Form D XML doc using DOMParser (browser-safe)
function parseFormDXml(xmlText, accession, cikRaw) {
  const doc  = new DOMParser().parseFromString(xmlText, 'text/xml')
  const get  = sel => doc.querySelector(sel)?.textContent?.trim() || ''

  const name         = get('nameOfIssuer') || get('issuerName')
  const state        = get('stateOrCountryDescription')
  const industry     = get('industryGroupType')
  const isAmendment  = get('isAmendment') === 'true'
  const isEquity     = xmlText.includes('<isEquityType>true</isEquityType>')
  const amountSold   = parseFloat(get('totalAmountSold'))   || 0
  const totalAmt     = parseFloat(get('totalOfferingAmount')) || 0
  const dateSale     = get('dateOfFirstSale value') || get('dateOfFirstSale')

  if (!name || isAmendment) return null

  // Only keep relevant industries
  if (industry && !KEEP_INDUSTRIES.some(k => industry.includes(k))) return null

  // Skip non-equity (debt-only rounds are not early-stage VC signals)
  if (!isEquity) return null

  // Skip rounds > $75M (likely PE / growth stage)
  const amount = amountSold || totalAmt
  if (amount > 75_000_000) return null

  // Extract related persons (founders / execs)
  const persons = Array.from(doc.querySelectorAll('relatedPersonInfo'))
    .map(p => {
      const first = p.querySelector('firstName')?.textContent?.trim() || ''
      const last  = p.querySelector('lastName')?.textContent?.trim() || ''
      const title = p.querySelector('relatedPersonClarification')?.textContent?.trim()
        || (p.querySelector('isOfficer')?.textContent === 'true' ? 'Executive Officer' : 'Director')
      return { name: `${first} ${last}`.trim(), title }
    })
    .filter(p => p.name)

  const amountLabel = amount > 0
    ? amount >= 1_000_000
      ? `$${(amount / 1_000_000).toFixed(1)}M`
      : `$${Math.round(amount / 1_000)}K`
    : 'undisclosed'

  const cik = cikPath(cikRaw)

  return {
    id:          accession,
    name,
    tagline:     `${amountLabel} raise · ${industry || 'Technology'} · ${state || 'US'}`,
    description: `SEC Form D equity offering filed ${dateSale || 'recently'}. ${industry ? `Industry: ${industry}.` : ''} ${amount > 0 ? `Amount disclosed: ${amountLabel}.` : 'Amount not yet disclosed.'} State: ${state || 'N/A'}.`,
    url:         `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=D&dateb=&owner=include&count=10`,
    website:     '',
    votes:       0,
    comments:    0,
    createdAt:   dateSale ? new Date(dateSale).toISOString() : new Date().toISOString(),
    thumbnail:   null,
    topics:      [industry || 'Technology'].filter(Boolean),
    makers:      persons.map(p => ({
      id:       p.name,
      name:     p.name,
      username: '',
      headline: p.title || 'Executive',
      twitter:  '',
      website:  '',
      avatar:   null,
    })),
    raiseAmount: amount,
    edgarCik:   cik,
  }
}

// Fetch one Form D XML, return parsed launch or null
async function fetchOneFiling(hit) {
  const accession = hit._id
  const src       = hit._source || {}
  // CIK comes from entity_id if available, else from accession prefix
  const cikRaw    = src.entity_id || src.file_num?.split('-')[0] || accession.split('-')[0]
  const cik       = cikPath(cikRaw)
  const noCache   = accNoPath(accession)

  const xmlUrl = `${ARCHIVES}/${cik}/${noCache}/primary_doc.xml`
  const res = await fetch(xmlUrl, { headers: { Accept: 'application/xml, text/xml' } })
  if (!res.ok) return null

  const text = await res.text()
  return parseFormDXml(text, accession, cik)
}

// Main export — fetch recent Form D equity filings for tech companies.
// Returns [] on any network or CORS failure so the pipeline never crashes.
export async function fetchRecentFormD(daysBack = 7, limit = 20) {
  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  // Simple date+form filter only — no complex query that could break CORS
  const searchUrl = `${EFTS}?q=%22%22&forms=D&dateRange=custom&startdt=${startDate}`

  let hits = []
  try {
    const res = await fetch(searchUrl)
    if (!res.ok) {
      console.warn(`EDGAR search returned ${res.status} — skipping`)
      return []
    }
    const data = await res.json()
    hits = data.hits?.hits || []
  } catch (err) {
    // CORS or network failure — log and return empty so pipeline continues
    console.warn('EDGAR fetch failed (likely CORS):', err.message)
    return []
  }

  // Process in parallel batches of 5 to respect SEC's 10 req/sec guideline
  const results = []
  for (let i = 0; i < hits.length && results.length < limit; i += 5) {
    const batch = hits.slice(i, i + 5)
    const settled = await Promise.allSettled(batch.map(fetchOneFiling))
    for (const s of settled) {
      if (s.status === 'fulfilled' && s.value) {
        results.push(s.value)
        if (results.length >= limit) break
      }
    }
  }

  return results
}
