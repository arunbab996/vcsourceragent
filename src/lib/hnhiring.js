// HN "Who is Hiring?" — monthly megathread where funded/growing startups post jobs.
// Appearing here means the company is active, probably recently funded, and building.
// Firebase API is fully CORS-enabled; Algolia used to find the latest thread.

const ALGOLIA   = 'https://hn.algolia.com/api/v1/search'
const FIREBASE  = 'https://hacker-news.firebaseio.com/v0/item'

// Strip HTML, decode entities, collapse whitespace
function cleanHtml(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Parse one hiring comment into a launch-shaped object.
// Hiring posts are usually: "Company | Location | Role | Remote?"
function parseComment(item) {
  if (!item?.text || item.dead || item.deleted) return null
  const text = cleanHtml(item.text)
  if (text.length < 60) return null

  const firstLine = text.split('\n')[0].trim()
  const parts = firstLine.split('|').map(s => s.trim()).filter(Boolean)

  const name = parts[0]
  if (!name || name.length < 2 || name.length > 80) return null
  // Skip obvious non-company first lines (e.g. "REMOTE | ...")
  if (/^(remote|onsite|hybrid|full.?time|part.?time)/i.test(name)) return null

  const location = parts.find(p =>
    /remote|onsite|hybrid|NYC|SF|London|Berlin|Austin|Boston|Toronto/i.test(p) &&
    p !== name
  ) || ''

  const roleLine = parts.slice(1).filter(p => p !== location).join(' | ')
  const tagline  = roleLine || text.slice(0, 120)

  // Grab the website URL if present in the comment
  const urlMatch = text.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9.-]+\.[a-z]{2,})[^\s)>]*/i)
  const website  = urlMatch?.[0] || ''

  return {
    id:          String(item.id),
    name,
    tagline:     tagline.slice(0, 200),
    description: text.slice(0, 600),
    url:         `https://news.ycombinator.com/item?id=${item.id}`,
    website,
    votes:       0,
    comments:    0,
    createdAt:   item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString(),
    thumbnail:   null,
    topics:      ['Hiring'],
    makers:      [], // no maker data in job posts
  }
}

export async function fetchHNHiringPosts(limit = 30) {
  // 1. Find the most recent "Ask HN: Who is hiring?" thread
  const searchRes = await fetch(
    `${ALGOLIA}?query=Ask+HN%3A+Who+is+hiring%3F&tags=story,ask_hn&hitsPerPage=10`
  )
  if (!searchRes.ok) throw new Error(`HN Algolia error ${searchRes.status}`)

  const { hits } = await searchRes.json()
  const thread = hits
    .filter(h => /who is hiring/i.test(h.title))
    .sort((a, b) => b.created_at_i - a.created_at_i)[0]

  if (!thread) throw new Error('Could not find HN hiring thread')
  console.log(`[HN Hiring] using thread: ${thread.title} (${thread.objectID})`)

  // 2. Get top-level comment IDs from the thread
  const postRes = await fetch(`${FIREBASE}/${thread.objectID}.json`)
  if (!postRes.ok) throw new Error(`HN Firebase error ${postRes.status}`)

  const post = await postRes.json()
  const kids  = (post.kids || []).slice(0, limit * 4) // over-fetch; many will be filtered

  // 3. Fetch comments in batches of 10 (respects HN rate limits)
  const companies = []
  for (let i = 0; i < kids.length && companies.length < limit; i += 10) {
    const batch   = kids.slice(i, i + 10)
    const settled = await Promise.allSettled(
      batch.map(id => fetch(`${FIREBASE}/${id}.json`).then(r => r.json()))
    )
    for (const s of settled) {
      if (s.status !== 'fulfilled') continue
      const company = parseComment(s.value)
      if (company) companies.push(company)
      if (companies.length >= limit) break
    }
  }

  return companies
}
