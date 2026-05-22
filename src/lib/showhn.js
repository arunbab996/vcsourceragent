// Show HN posts are early builders sharing products before they've launched publicly.
// More raw/early than Launch HN — good signal for pre-seed founders.
const HN_SEARCH = 'https://hn.algolia.com/api/v1/search'

export async function fetchShowHNPosts(monthsBack = 3) {
  const since = Math.floor((Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000) / 1000)

  const res = await fetch(
    `${HN_SEARCH}?query=Show+HN&tags=story&numericFilters=created_at_i>${since},points>5&hitsPerPage=60`
  )
  if (!res.ok) throw new Error(`HN API error ${res.status}`)

  const data = await res.json()

  return data.hits
    .filter(h => h.title?.startsWith('Show HN:') && h.url)
    .map(h => {
      const withoutPrefix = h.title.replace(/^Show HN:\s*/, '')
      const sep = withoutPrefix.search(/\s[–—|-]\s/)
      const name    = sep > 0 ? withoutPrefix.slice(0, sep).trim() : withoutPrefix.trim()
      const tagline = sep > 0 ? withoutPrefix.slice(sep).replace(/^[\s–—|-]+/, '').trim() : ''

      return {
        id: `showhn_${h.objectID}`,
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
          ? [{ id: h.author, name: h.author, username: h.author, headline: 'Builder', twitter: '', website: h.url || '', avatar: null }]
          : [],
      }
    })
}
