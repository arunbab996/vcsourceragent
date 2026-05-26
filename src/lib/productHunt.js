const PH_ENDPOINT = 'https://api.producthunt.com/v2/api/graphql'

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

// Shape a PH user/maker object into our standard maker format
const shapeMaker = u => ({
  id:       u.id,
  name:     u.name,
  username: u.username         || '',
  headline: u.headline         || '',
  twitter:  u.twitterUsername  || '',
  website:  u.websiteUrl       || '',
  avatar:   u.profileImage     || null,
})

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
    id: node.id,
    name: node.name,
    tagline: node.tagline,
    description: node.description || '',
    url: node.url,
    website: node.website || '',
    votes: node.votesCount,
    comments: node.commentsCount,
    createdAt: node.createdAt,
    thumbnail: node.thumbnail?.url || null,
    topics: (node.topics?.edges || []).map(e => e.node.name),
    makers: (node.makers || []).map(shapeMaker).filter(m => m.name),
  }))
}
