// YC companies post "Launch HN: CompanyName – tagline" on Hacker News
// at Demo Day. This is the most reliable public source for latest-batch data.
const HN_SEARCH = 'https://hn.algolia.com/api/v1/search'

export async function fetchRecentYCCompanies(monthsBack = 6) {
  const since = Math.floor((Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000) / 1000)

  const res = await fetch(
    `${HN_SEARCH}?query=Launch+HN&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=80`
  )
  if (!res.ok) throw new Error(`HN API error ${res.status}`)

  const data = await res.json()

  return data.hits
    .filter(h => h.title?.startsWith('Launch HN:'))
    .map(h => {
      const withoutPrefix = h.title.replace(/^Launch HN:\s*/, '')
      const sep = withoutPrefix.search(/\s[–—|-]\s/)
      const name    = sep > 0 ? withoutPrefix.slice(0, sep).trim() : withoutPrefix.trim()
      const tagline = sep > 0 ? withoutPrefix.slice(sep).replace(/^[\s–—|-]+/, '').trim() : ''

      return {
        id: String(h.objectID),
        name,
        tagline,
        description: tagline,
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        website: h.url || '',
        votes: h.points || 0,
        comments: h.num_comments || 0,
        createdAt: h.created_at,
        thumbnail: null,
        topics: [],
        makers: h.author
          ? [{ id: h.author, name: h.author, username: h.author, headline: 'YC Founder', twitter: '', website: h.url || '', avatar: null }]
          : [],
      }
    })
}
