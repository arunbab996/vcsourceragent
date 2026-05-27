import OpenAI from 'openai'

function createClient(apiKey) {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

// ─── Step 1: Filter ────────────────────────────────────────────────────────────
export async function filterLaunch(client, launch) {
  const makerHeadlines = launch.makers
    .map(m => `${m.name} (${m.headline || 'no headline'})`)
    .join(', ')

  const isHiring = launch.topics?.includes('Hiring')

  const sourceContext = isHiring
    ? `This entry is a job posting from the HN "Who is Hiring?" thread — a company looking for engineers.`
    : `This entry is a product launch from Product Hunt, GitHub, or YC.`

  const hiringExtraRejects = isHiring ? `
- Any company that explicitly mentions raising Series A, Series B, or later rounds
- Any company that describes having more than 30 employees or a large team
- Any company that sounds like it has been operating for 3+ years
- Companies that appear to be profitable/bootstrapped for many years (not VC-relevant)` : ''

  const hiringAcceptNote = isHiring
    ? `For hiring posts: accept ONLY if the company is clearly pre-seed or seed stage, founded recently (last 1-2 years), and shows signals of being early-stage (small team, just getting started, building v1, recent launch, YC/accelerator mention).`
    : `ACCEPT only if:
- It looks like a brand-new company or product you have NOT seen before
- At least one maker is clearly an independent founder (not employed at a big company)
- There is a plausible B2B SaaS, AI, consumer app, marketplace, or dev tools business here
- The founding team is small (1-4 people)`

  const prompt = `You are a VC analyst screening startups for early-stage investment opportunities.

Your job is to find GENUINE EARLY-STAGE STARTUPS — companies that are 0-18 months old, pre-seed to seed stage, with a small founding team.

Source context: ${sourceContext}

HARD REJECT — exclude immediately:
- Products from Big Tech or any publicly traded company (Google/Gemini, Microsoft/Copilot, Apple, Meta, Amazon, Salesforce, Adobe, etc.)
- Products from well-known funded startups — if you recognise the company name as already established (Mintlify, Notion, Linear, Vercel, Figma, Loom, etc.), reject it
- Version updates or feature launches of existing products
- Products where a maker's headline says they work at a large company ("Software Engineer at Google", "PM at Meta")
- Side projects, hobby tools, open-source libraries with no commercial model
- Newsletters, personal portfolios, content aggregators, browser extensions with no startup behind them${hiringExtraRejects}

${hiringAcceptNote}

Launch data:
Name: ${launch.name}
Tagline: ${launch.tagline}
Description: ${launch.description}
Topics: ${launch.topics.join(', ')}
Votes: ${launch.votes}
${makerHeadlines ? `Makers: ${makerHeadlines}` : ''}

Think carefully: do you recognise "${launch.name}" as an already established product or company? If yes, reject it.

Respond with JSON only:
{
  "qualifies": true | false,
  "reason": "one sentence explanation"
}`

  // gpt-4o-mini is ~20x cheaper and fast enough for binary qualify/reject
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  return JSON.parse(res.choices[0].message.content)
}

// ─── Step 2: Research ──────────────────────────────────────────────────────────
export async function researchFounder(client, launch) {
  const hasMakers = launch.makers && launch.makers.length > 0
  const makerList = hasMakers
    ? launch.makers
        .map(m => [
          `Name: ${m.name}`,
          m.username ? `PH profile: https://www.producthunt.com/@${m.username}` : null,
          m.twitter  ? `Twitter: @${m.twitter}` : null,
          m.headline ? `Headline: ${m.headline}` : null,
          m.website  ? `Website: ${m.website}` : null,
        ].filter(Boolean).join(' | '))
        .join('\n')
    : null

  const teamSection = hasMakers
    ? `Known team members:\n${makerList}`
    : `No team data is available. Use your training knowledge to identify the founders of "${launch.name}" (${launch.website || 'website unknown'}). This is a YC-backed company.`

  const prompt = `You are a VC analyst researching startup founders.

Product: ${launch.name} — ${launch.tagline}
Website: ${launch.website || 'N/A'}
${launch.batch ? `YC Batch: ${launch.batch}` : ''}

${teamSection}

For each founder you identify, provide:
1. Background summary (prior roles, companies, education if known)
2. Any repeat founder, FAANG, YC/accelerator signals
3. Location if inferrable
4. Confidence level in the information

${hasMakers ? 'IMPORTANT: Always use the exact name provided above. Never replace a name with "Unknown".' : 'Identify 1-3 founders if known. If unknown, return an empty founders array.'}
If you have no background info on someone, still include them with their name and confidence: "low".

Respond with JSON only:
{
  "founders": [
    {
      "name": "founder name",
      "background": "what you know, or 'No background information found' if nothing",
      "priorStartups": ["list or empty array"],
      "education": "string or null",
      "location": "string or null",
      "signals": ["YC" | "Ex-FAANG" | "Repeat Founder" | "Solo Founder" | "Academic" | "Operator"],
      "confidence": "high" | "medium" | "low"
    }
  ],
  "researchNotes": "Any additional context about the company or team"
}`

  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  return JSON.parse(res.choices[0].message.content)
}

// ─── Step 3: Enrich ────────────────────────────────────────────────────────────
export async function enrichDeal(client, launch, research) {
  // Pass maker headline data so GPT can correctly detect Solo Founder vs Co-Founder
  const makerContext = launch.makers.length
    ? `Known team (from source):\n${launch.makers.map(m => `- ${m.name} | ${m.headline || 'no title'}`).join('\n')}`
    : ''

  const prompt = `You are a VC analyst creating a structured deal profile for an early-stage startup.

Launch data:
Name: ${launch.name}
Tagline: ${launch.tagline}
Description: ${launch.description}
Topics: ${launch.topics.join(', ')}
Votes: ${launch.votes}
URL: ${launch.url}
${makerContext}

Founder research:
${JSON.stringify(research, null, 2)}

Instructions:
- "stage": one of exactly "Pre-seed", "Seed", "Series A", "Unknown"
- "vertical": most specific category (e.g. "AI DevTools", "B2B SaaS", "FinTech", "HealthTech", "Consumer App", "Infrastructure", "Marketplace", "Productivity")
- "notableSignals": flat unique list using only these exact values: "Solo Founder", "Repeat Founder", "Ex-FAANG", "YC", "Academic", "Operator", "Early Traction"
  - Add "Solo Founder" ONLY if there is exactly 1 person on the founding team AND their title does NOT say "Co-Founder". If any person's headline or title includes "Co-Founder", there is more than one founder and you must NOT add "Solo Founder".
  - Add "Early Traction" if votes > 200 or description mentions customers/revenue

Respond with JSON only:
{
  "companyName": "string",
  "tagline": "string",
  "vertical": "string",
  "stage": "Pre-seed" | "Seed" | "Series A" | "Unknown",
  "location": "string or null",
  "notableSignals": ["array using only the allowed values listed above"],
  "tractionSignals": "string describing traction evidence or null",
  "enrichmentNotes": "2-3 sentences of analyst color on why this is interesting"
}`

  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const result = JSON.parse(res.choices[0].message.content)

  // Strip any "[REDACTED]" / "REDACTED" placeholders that GPT sometimes emits
  // for real people it knows but declines to name, then Unknown stubs
  const isReal = n => {
    if (!n || typeof n !== 'string') return false
    const t = n.trim()
    return t && t !== 'Unknown' && !/^\[?redacted\]?$/i.test(t)
  }

  const sourceMakerNames = launch.makers.map(m => m.name).filter(isReal)
  console.log(`[Enrich] ${launch.name} | source makers (${sourceMakerNames.length}):`, sourceMakerNames)

  if (sourceMakerNames.length) {
    result.founderNames = sourceMakerNames
  } else {
    const researchNames = (research.founders || []).map(f => f.name).filter(isReal)
    console.log(`[Enrich] ${launch.name} | research founders (${researchNames.length}):`, researchNames)
    result.founderNames = researchNames   // empty array is fine — card shows nothing
  }

  return result
}

// ─── Full Agent Pipeline ────────────────────────────────────────────────────────
// postFilter: optional async fn(launch) → partial launch object to merge.
// Called after filter passes but before research — used by PH source to
// scrape real maker names from the product page.
export async function runAgentPipeline(apiKey, launches, onProgress, onDealReady, postFilter = null) {
  const client = createClient(apiKey)
  const deals = []

  for (let i = 0; i < launches.length; i++) {
    let launch = launches[i]

    onProgress({
      step: 'filter',
      message: `Filtering ${i + 1}/${launches.length}: ${launch.name}`,
      current: i + 1,
      total: launches.length,
    })

    let filterResult
    try {
      filterResult = await filterLaunch(client, launch)
    } catch (err) {
      console.error(`Filter failed for ${launch.name}:`, err)
      // Billing / auth errors are fatal — no point continuing the loop
      const msg = err?.message || ''
      if (err?.status === 429 || err?.status === 402 || /insufficient_quota|billing|credit|quota/i.test(msg)) {
        throw new Error('OpenAI credits exhausted. Top up at platform.openai.com/settings/billing and try again.')
      }
      if (err?.status === 401) {
        throw new Error('OpenAI API key is invalid. Check VITE_OPENAI_API_KEY in your Vercel environment variables.')
      }
      continue
    }

    if (!filterResult.qualifies) {
      onProgress({
        step: 'filter',
        message: `Skipped: ${launch.name} — ${filterResult.reason}`,
        current: i + 1,
        total: launches.length,
      })
      continue
    }

    // Post-filter enrichment — scrape PH page for real maker names
    if (postFilter) {
      try {
        onProgress({ step: 'filter', message: `Fetching founder info for ${launch.name}…`, current: i + 1, total: launches.length })
        const patch = await postFilter(launch)
        if (patch) launch = { ...launch, ...patch }
      } catch (err) {
        console.warn(`postFilter failed for ${launch.name}:`, err.message)
      }
    }

    onProgress({
      step: 'research',
      message: `Researching founders for ${launch.name}...`,
      current: i + 1,
      total: launches.length,
    })

    let research
    try {
      research = await researchFounder(client, launch)
    } catch (err) {
      console.error(`Research failed for ${launch.name}:`, err)
      research = {
        founders: launch.makers.map(m => ({
          name: m.name,
          background: 'Research unavailable.',
          priorStartups: [],
          education: null,
          location: null,
          signals: [],
          confidence: 'low',
        })),
        researchNotes: 'Research step failed.',
      }
    }

    onProgress({
      step: 'enrich',
      message: `Enriching deal card for ${launch.name}...`,
      current: i + 1,
      total: launches.length,
    })

    let enrichment
    try {
      enrichment = await enrichDeal(client, launch, research)
    } catch (err) {
      console.error(`Enrich failed for ${launch.name}:`, err)
      enrichment = {
        companyName: launch.name,
        tagline: launch.tagline,
        vertical: launch.topics[0] || 'Unknown',
        stage: 'Unknown',
        location: null,
        founderNames: launch.makers.length
          ? launch.makers.map(m => m.name)
          : research.founders?.map(f => f.name).filter(Boolean) || ['Unknown'],
        notableSignals: [],
        tractionSignals: null,
        enrichmentNotes: 'Enrichment unavailable.',
      }
    }

    const deal = {
      id: launch.id,
      launch,
      research,
      enrichment,
      lowInfo: research.founders?.every(f => f.confidence === 'low') || false,
    }

    deals.push(deal)
    await onDealReady(deal)
  }

  return deals
}
