import OpenAI from 'openai'

function createClient(apiKey) {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

// ─── Step 1: Filter ────────────────────────────────────────────────────────────
export async function filterLaunch(client, launch) {
  const makerHeadlines = launch.makers.map(m => `${m.name} (${m.headline || 'no headline'})`).join(', ')

  const prompt = `You are a VC analyst screening Product Hunt launches for early-stage startup investment opportunities.

Your job is to find GENUINE EARLY-STAGE STARTUPS — companies that are 0-18 months old, pre-seed to seed stage, with a small founding team.

HARD REJECT — exclude immediately:
- Products from Big Tech or any publicly traded company (Google/Gemini, Microsoft/Copilot, Apple, Meta, Amazon, Salesforce, Adobe, etc.)
- Products from well-known funded startups — if you recognise the company name as already established (Mintlify, Notion, Linear, Vercel, Figma, Loom, etc.), reject it
- Version updates or feature launches of existing products (e.g. "Gemini 2.0 now supports video" is a Google feature drop, not a startup)
- Products where a maker's headline says they work at a large company ("Software Engineer at Google", "PM at Meta")
- Side projects, hobby tools, open-source libraries with no commercial model
- Newsletters, personal portfolios, content aggregators, browser extensions with no startup behind them
- Products with no human maker listed

ACCEPT only if:
- It looks like a brand-new company or product you have NOT seen before
- At least one maker is clearly an independent founder (not employed at a big company)
- There is a plausible B2B SaaS, AI, consumer app, marketplace, or dev tools business here
- The founding team is small (1-4 people)

Launch data:
Name: ${launch.name}
Tagline: ${launch.tagline}
Description: ${launch.description}
Topics: ${launch.topics.join(', ')}
Votes: ${launch.votes}
Makers: ${makerHeadlines}

Think carefully: do you recognise "${launch.name}" as an already established product or company? If yes, reject it.

Respond with JSON only:
{
  "qualifies": true | false,
  "reason": "one sentence explanation"
}`

  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  return JSON.parse(res.choices[0].message.content)
}

// ─── Step 2: Research ──────────────────────────────────────────────────────────
export async function researchFounder(client, launch) {
  const makerList = launch.makers
    .map(m => [
      `Name: ${m.name}`,
      m.username ? `PH username: @${m.username}` : null,
      m.twitter ? `Twitter: @${m.twitter}` : null,
      m.headline ? `Headline: ${m.headline}` : null,
      m.website ? `Website: ${m.website}` : null,
    ].filter(Boolean).join(' | '))
    .join('\n')

  const prompt = `You are a VC analyst researching startup founders.

The following makers listed on Product Hunt built this product. Use everything available — their names, Twitter handles, headlines, and your training knowledge of the startup ecosystem — to build a profile on each.

Product: ${launch.name} — ${launch.tagline}
Product website: ${launch.website || 'N/A'}

Makers from Product Hunt:
${makerList}

For each maker, provide:
1. Background summary (prior roles, companies, education if known)
2. Any repeat founder, FAANG, YC/accelerator signals
3. Location if inferrable
4. Confidence level in the information

IMPORTANT: Always use the exact name provided above. Never replace a name with "Unknown".
If you have no background info on someone, still include them with their name and confidence: "low".

Respond with JSON only:
{
  "founders": [
    {
      "name": "exact name from the maker list above",
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
  const prompt = `You are a VC analyst creating a structured deal profile for an early-stage startup.

Launch data:
Name: ${launch.name}
Tagline: ${launch.tagline}
Description: ${launch.description}
Topics: ${launch.topics.join(', ')}
Votes: ${launch.votes}
URL: ${launch.url}

Founder research:
${JSON.stringify(research, null, 2)}

Instructions:
- "stage": one of exactly "Pre-seed", "Seed", "Series A", "Unknown"
- "vertical": most specific category (e.g. "AI DevTools", "B2B SaaS", "FinTech", "HealthTech", "Consumer App", "Infrastructure", "Marketplace", "Productivity")
- "notableSignals": flat unique list using only these exact values: "Solo Founder", "Repeat Founder", "Ex-FAANG", "YC", "Academic", "Operator", "Early Traction"
  - Add "Solo Founder" if there is exactly 1 founder in the research
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

  // Always use PH API maker names directly — never trust GPT for this
  result.founderNames = launch.makers.map(m => m.name).filter(Boolean)
  if (!result.founderNames.length) result.founderNames = ['Unknown']

  return result
}

// ─── Step 4: Score ─────────────────────────────────────────────────────────────
export async function scoreDeal(client, launch, enrichment) {
  const prompt = `You are a senior VC partner scoring early-stage deals for investment relevance.

Score from 1-10 based on:
- Problem novelty and market size potential (3 points)
- Founder signal quality (3 points)
- Early traction or momentum (2 points)
- Timing and category attractiveness (2 points)

Calibration: 8-10 = genuinely exciting, pass to partners immediately; 5-7 = monitor, follow up in 3 months; 1-4 = not VC-relevant.

Deal:
${JSON.stringify({ ...enrichment, votes: launch.votes, topics: launch.topics }, null, 2)}

Respond with JSON only:
{
  "score": number (1-10),
  "scoreReason": "one sentence explaining the score",
  "passToPartners": true | false,
  "redFlags": ["any concerns, or empty array"]
}`

  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  return JSON.parse(res.choices[0].message.content)
}

// ─── Full Agent Pipeline ────────────────────────────────────────────────────────
export async function runAgentPipeline(apiKey, launches, onProgress, onDealReady) {
  const client = createClient(apiKey)
  const deals = []

  for (let i = 0; i < launches.length; i++) {
    const launch = launches[i]

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
        founderNames: launch.makers.map(m => m.name),
        notableSignals: [],
        tractionSignals: null,
        enrichmentNotes: 'Enrichment unavailable.',
      }
    }

    onProgress({
      step: 'score',
      message: `Scoring deal: ${launch.name}...`,
      current: i + 1,
      total: launches.length,
    })

    let scoring
    try {
      scoring = await scoreDeal(client, launch, enrichment)
    } catch (err) {
      console.error(`Score failed for ${launch.name}:`, err)
      scoring = { score: 5, scoreReason: 'Scoring unavailable', passToPartners: false, redFlags: [] }
    }

    const deal = {
      id: launch.id,
      launch,
      research,
      enrichment,
      scoring,
      lowInfo: research.founders?.every(f => f.confidence === 'low') || false,
    }

    deals.push(deal)
    onDealReady(deal)
  }

  return deals
}
