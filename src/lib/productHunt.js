const PH_ENDPOINT = 'https://api.producthunt.com/v2/api/graphql'
const PROXY       = 'https://corsproxy.io/?'

const LAUNCHES_QUERY = `
  query GetPosts($postedAfter: DateTime!, $first: Int!) {
    posts(order: VOTES, postedAfter: $postedAfter, first: $first) {
      edges {
        node {
          id
          name
          tagline
          description
          url
          votesCount
          commentsCount
          createdAt
          website
          thumbnail {
            url
          }
          topics {
            edges {
              node {
                name
              }
            }
          }
          makers {
            id
            name
            username
            headline
            twitterUsername
            websiteUrl
            profileImage
          }
        }
      }
    }
  }
`

const isRedacted = v => !v || /^\[?redacted\]?$/i.test(String(v).trim())

// Shape a PH user object into our standard maker format.
// PH API often returns '[REDACTED]' for name due to token PII scope —
// we'll resolve real names via page scraping after the filter step.
const shapeMaker = u => ({
  id:       u.id        || '',
  name:     isRedacted(u.name) ? null : u.name,
  username: isRedacted(u.username) ? '' : (u.username || ''),
  headline: isRedacted(u.headline) ? '' : (u.headline || ''),
  twitter:  u.twitterUsername || '',
  website:  u.websiteUrl     || '',
  avatar:   u.profileImage   || null,
})

// ── Page scraper ──────────────────────────────────────────────────────────────
// Fetches the PH product page and extracts the maker name(s) from
// __NEXT_DATA__ (Next.js SSR bundle). The SSR payload has real names
// even when the API token returns [REDACTED].
// Returns an array of { name, username, headline } objects.
export async function scrapeMakerNames(postUrl) {
  try {
    const cleanUrl = postUrl.split('?')[0]  // strip utm params
    const res = await fetch(PROXY + encodeURIComponent(cleanUrl), {
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) return []

    const html = await res.text()

    // Extract the Next.js data bundle embedded in the HTML
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) {
      console.warn('[PH scrape] no __NEXT_DATA__ found for', cleanUrl)
      return []
    }

    const data = JSON.parse(match[1])

    // PH's pageProps can vary — try several paths
    const post =
      data?.props?.pageProps?.post ??
      data?.props?.pageProps?.data?.post ??
      data?.props?.pageProps?.initialData?.post ??
      null

    if (!post) {
      console.warn('[PH scrape] could not find post in __NEXT_DATA__ for', cleanUrl)
      return []
    }

    // 1. Try makers list on the post object itself
    const registeredMakers = (post.makers || [])
      .filter(m => m.name && !isRedacted(m.name))
      .map(m => ({ name: m.name, username: m.username || '', headline: m.headline || '' }))

    if (registeredMakers.length) {
      console.log('[PH scrape] found makers:', registeredMakers.map(m => m.name))
      return registeredMakers
    }

    // 2. Find the Maker-badged comment (pinned at the top)
    const comments = post.comments?.edges ?? []
    for (const { node: c } of comments.slice(0, 15)) {
      const hasMakerBadge = (c?.badges ?? []).some(b =>
        /maker/i.test(b.name ?? b.text ?? '')
      )
      const userName = c?.user?.name
      if (hasMakerBadge && userName && !isRedacted(userName)) {
        console.log('[PH scrape] found maker from badge comment:', userName)
        return [{
          name:     userName,
          username: c.user.username || '',
          headline: c.user.headline || '',
        }]
      }
    }

    // 3. Fall back to the very first commenter — on PH launches, the founder
    //    almost always posts the first "Hey Product Hunt 👋" comment.
    const first = comments[0]?.node
    const firstName = first?.user?.name
    if (firstName && !isRedacted(firstName)) {
      console.log('[PH scrape] using first commenter as maker:', firstName)
      return [{
        name:     firstName,
        username: first.user.username || '',
        headline: first.user.headline || '',
      }]
    }

    console.warn('[PH scrape] no usable maker found for', cleanUrl)
    return []
  } catch (err) {
    console.warn('[PH scrape] error for', postUrl, err.message)
    return []
  }
}

// ── Main fetch ────────────────────────────────────────────────────────────────
export async function fetchRecentLaunches(apiKey, hoursBack = 48, limit = 30) {
  const postedAfter = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

  const response = await fetch(PH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: LAUNCHES_QUERY,
      variables: { postedAfter, first: limit },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    if (response.status === 401) {
      throw new Error(
        'Product Hunt API: invalid token (401). Check that VITE_PH_API_KEY in Vercel matches the Developer Token from producthunt.com/v2/oauth/applications — not the Client ID or Secret.'
      )
    }
    throw new Error(`Product Hunt API error ${response.status}: ${text}`)
  }

  const json = await response.json()
  if (json.errors) {
    throw new Error(`GraphQL errors: ${json.errors.map(e => e.message).join(', ')}`)
  }

  return (json.data?.posts?.edges || []).map(({ node }) => ({
    id:          node.id,
    name:        node.name,
    tagline:     node.tagline,
    description: node.description || '',
    url:         node.url,
    website:     node.website || '',
    votes:       node.votesCount,
    comments:    node.commentsCount,
    createdAt:   node.createdAt,
    thumbnail:   node.thumbnail?.url || null,
    topics:      (node.topics?.edges || []).map(e => e.node.name),
    // Keep whatever non-redacted makers came from the API (often empty).
    // The agent pipeline will call scrapeMakerNames() for posts that still
    // have no makers after this initial fetch.
    makers: (node.makers || []).map(shapeMaker).filter(m => m.name),
  }))
}
