// SEC EDGAR Form D — companies legally disclosing a fundraise.
// Form D must be filed within 15 days of the first securities sale.
// This is often the earliest public signal that a round is happening.
//
// CORS situation: efts.sec.gov blocks browser CORS directly.
// We route through corsproxy.io which is free and reliable for low-volume use.

const EFTS    = 'https://efts.sec.gov/LATEST/search-index'
const ARCHIVE = 'https://www.sec.gov/Archives/edgar/data'
const PROXY   = 'https://corsproxy.io/?'

const proxied = url => PROXY + encodeURIComponent(url)

// Industry groups from Form D that indicate tech / VC-relevant companies
const KEEP = ['technology', 'computers', 'internet', 'health care', 'biotechnology',
               'business services', 'telecommunications', 'other health care']

const isRelevant = ind => !ind || KEEP.some(k => ind.toLowerCase().includes(k))

// Parse company name from display_names field: "Acme Inc.  (CIK 0001234567)" → "Acme Inc."
const parseName = dn => (dn || '').replace(/\s*\(CIK[^)]*\)/, '').trim()

// Strip leading zeros from CIK for URL path
const cikPath = raw => String(parseInt(raw || '0', 10))

// ── Parse Form D XML ───────────────────────────────────────────────────────
function parseFormDXml(xmlText, meta) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  const get = sel => doc.querySelector(sel)?.textContent?.trim() || ''

  const isAmendment = get('isAmendment') === 'true'
  if (isAmendment) return null   // Only show new filings, not amendments

  const industry   = get('industryGroupType')
  if (!isRelevant(industry)) return null

  const isEquity   = get('isEquityType') === 'true'
  if (!isEquity) return null    // Skip debt-only rounds

  const amountSold = parseFloat(get('totalAmountSold'))   || 0
  const totalAmt   = parseFloat(get('totalOfferingAmount')) || 0
  const amount     = amountSold || totalAmt
  if (amount > 75_000_000) return null  // Skip late-stage / PE

  const state      = get('stateOrCountryDescription') || meta.biz_locations?.[0] || ''
  const dateOfSale = get('dateOfFirstSale value') || get('dateOfFirstSale') || meta.file_date

  // Extract related persons (founders / executives)
  const persons = Array.from(doc.querySelectorAll('relatedPersonInfo'))
    .map(p => {
      const first  = p.querySelector('firstName')?.textContent?.trim()  || ''
      const last   = p.querySelector('lastName')?.textContent?.trim()   || ''
      const title  = p.querySelector('relatedPersonClarification')?.textContent?.trim()
        || (p.querySelector('isOfficer')?.textContent === 'true'  ? 'Executive Officer'
          : p.querySelector('isDirector')?.textContent === 'true' ? 'Director' : '')
      return { name: `${first} ${last}`.trim(), title }
    })
    .filter(p => p.name)

  const name = get('nameOfIssuer') || parseName(meta.display_names?.[0]) || ''
  if (!name) return null

  const amtLabel = amount > 0
    ? amount >= 1_000_000 ? `$${(amount / 1_000_000).toFixed(1)}M` : `$${Math.round(amount / 1_000)}K`
    : 'undisclosed'

  return {
    id:          meta.adsh,
    name,
    tagline:     `${amtLabel} · Form D · ${industry || 'Technology'} · ${state}`,
    description: `SEC Form D equity offering. ${industry ? `Industry: ${industry}.` : ''} ${amount > 0 ? `Amount disclosed: ${amtLabel}.` : ''} State: ${state}. Filed ${meta.file_date}.`,
    url:         `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikPath(meta.ciks?.[0])}&type=D&dateb=&owner=include&count=10`,
    website:     '',
    votes:       0,
    comments:    0,
    createdAt:   dateOfSale ? new Date(dateOfSale).toISOString() : new Date().toISOString(),
    thumbnail:   null,
    topics:      [industry || 'Technology'].filter(Boolean),
    makers:      persons.map(p => ({
      id: p.name, name: p.name, username: '', headline: p.title || 'Executive',
      twitter: '', website: '', avatar: null,
    })),
    raiseAmount: amount,
  }
}

// ── Fetch one filing XML ───────────────────────────────────────────────────
async function fetchOneFiling(hit) {
  const src  = hit._source || {}
  const cik  = cikPath(src.ciks?.[0])
  const noD  = src.adsh?.replace(/-/g, '')
  if (!cik || cik === '0' || !noD) return null

  const xmlUrl = `${ARCHIVE}/${cik}/${noD}/primary_doc.xml`
  try {
    const res = await fetch(proxied(xmlUrl))
    if (!res.ok) return null
    const text = await res.text()
    return parseFormDXml(text, src)
  } catch {
    return null
  }
}

// ── Main export ────────────────────────────────────────────────────────────
export async function fetchRecentFormD(daysBack = 7, limit = 20) {
  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate   = new Date().toISOString().split('T')[0]

  // No q= param — adding q="" breaks the date filter in EDGAR EFTS
  const searchUrl = `${EFTS}?forms=D&dateRange=custom&startdt=${startDate}&enddt=${endDate}`

  let hits = []
  try {
    const res = await fetch(proxied(searchUrl))
    if (!res.ok) {
      console.warn(`EDGAR search returned ${res.status}`)
      return []
    }
    const data = await res.json()
    hits = data.hits?.hits || []
    console.log(`[EDGAR] ${data.hits?.total?.value} Form D filings in range, processing first ${hits.length}`)
  } catch (err) {
    console.warn('EDGAR search failed:', err.message)
    return []
  }

  // Process in batches of 5 (respects SEC rate limits + proxy limits)
  const results = []
  for (let i = 0; i < hits.length && results.length < limit; i += 5) {
    const batch   = hits.slice(i, i + 5)
    const settled = await Promise.allSettled(batch.map(fetchOneFiling))
    for (const s of settled) {
      if (s.status === 'fulfilled' && s.value) {
        results.push(s.value)
        if (results.length >= limit) break
      }
    }
  }

  console.log(`[EDGAR] ${results.length} tech equity Form D deals found`)
  return results
}
