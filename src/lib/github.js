const GH_API = 'https://api.github.com'

async function ghFetch(path, token) {
  const res = await fetch(`${GH_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub API ${res.status}: ${text}`)
  }
  return res.json()
}

export async function fetchRecentGithubRepos(token, hoursBack = 48, limit = 30) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
  const dateStr = since.toISOString().split('T')[0]

  // Find recently created repos with descriptions and homepages — signs of a real product
  const query = `created:>=${dateStr} is:public has:description stars:>=3`
  const data = await ghFetch(
    `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`,
    token
  )

  return (data.items || []).map(repo => ({
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    tagline: repo.description || '',
    description: repo.description || '',
    url: repo.html_url,
    website: repo.homepage || '',
    votes: repo.stargazers_count,
    comments: repo.open_issues_count,
    createdAt: repo.created_at,
    thumbnail: repo.owner?.avatar_url || null,
    topics: repo.topics || [],
    language: repo.language || '',
    makers: repo.owner
      ? [{
          id: String(repo.owner.id),
          name: repo.owner.login,
          username: repo.owner.login,
          headline: repo.owner.type === 'Organization' ? 'Organization' : 'GitHub user',
          twitter: '',
          website: repo.homepage || '',
          avatar: repo.owner.avatar_url || null,
        }]
      : [],
  }))
}
