import OpenAI from 'openai'

function createClient(apiKey) {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

// ─── Step 1: Filter ────────────────────────────────────────────────────────────
export async function filterLaunch(client, launch) {
  const prompt = `You are a VC analyst screening Product Hunt launches.

Evaluate this launch and decide if it qualifies as an early-stage startup worth researching for investment.

EXCLUDE:
- Side projects or hobby tools with no business model
- Launches from established companies (50+ employees, Series B+)
- Pure open-source libraries with no commercial angle
- Chrome extensions or browser plugins with no clear startup behind them
- Products with no identifiable founder/maker listed
- Non-startup products (newsletters, personal portfolios, content sites)

INCLUDE:
- B2B SaaS, developer tools, AI products, consumer apps with clear startup intent
- Products with at least one identifiable human founder
- Anything with early traction signals (votes, paying customers mentioned)
- Novel problem-solving with a defined market

Launch data:
Name: ${launch.name}
Tagline: ${launch.tagline}
Description: ${launch.description}
Topics: ${launch.topics.join(', ')}
Votes: ${launch.votes}
Makers: ${launch.makers.map(m => `${m.name} (${m.headline})`).join(', ')}

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
    .map(m => `${m.name} | Twitter: @${m.twitter || 'unknown'} | ${m.headline}`)
    .join('\n')

  const prompt = `You are a VC analyst researching founders for deal sourcing.

Based on the information available below, synthesize what you know about these founders and their background. Use your training knowledge about startup ecosystems, YC batches, notable founders, and tech industry patterns.

Product: ${launch.name} — ${launch.tagline}
Website: ${launch.website || 'N/A'}
Makers:
${makerList}

Research and summarize:
1. Likely founder background (education, prior roles, prior startups)
2. Any signals of repeat founding, FAANG experience, YC/accelerator history
3. Company stage guess based on the product description
4. Geographic location if inferrable
5. Key credibility signals

If you have no information about a specific person, say so honestly. Do not fabricate specific facts.

Respond with JSON only:
{
  "founders": [
    {
      "name": "string",
      "background": "2-3 sentence summary",
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
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  return JSON.parse(res.choices[0].message.content)
}

// ─── Step 3: Enrich ────────────────────────────────────────────────────────────
export async function enrichDeal(client, launch, research) {
  const prompt = `You are a VC analyst creating a structured deal profile.

Synthesize the launch data and founder research into a clean deal card.

Launch:
Name: ${launch.name}
Tagline: ${launch.tagline}
Description: ${launch.description}
Topics: ${launch.topics.join(', ')}
Votes: ${launch.votes}
URL: ${launch.url}

Founder Research:
${JSON.stringify(research, null, 2)}

Extract and structure the deal. For "stage", use one of: "Pre-seed", "Seed", "Series A", "Unknown".
For "vertical", pick the most specific relevant category (e.g. "AI DevTools", "B2B SaaS", "FinTech", "HealthTech", "Consumer App", "Infrastructure", "Marketplace").

Consolidate all founder signals into a flat unique list for "notableSignals".

Respond with JSON only:
{
  "companyName": "string",
  "tagline": "string",
  "vertical": "string",
  "stage": "Pre-seed" | "Seed" | "Series A" | "Unknown",
  "location": "string or null",
  "founderNames": ["array of strings"],
  "notableSignals": ["Solo Founder" | "Repeat Founder" | "Ex-FAANG" | "YC" | "Academic" | "Operator" | "Early Traction"],
  "tractionSignals": "string describing any traction evidence or null",
  "enrichmentNotes": "2-3 sentences of analyst color"
}`

  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  return JSON.parse(res.choices[0].message.content)
}

// ─── Step 4: Score ─────────────────────────────────────────────────────────────
export async function scoreDeal(client, launch, enrichment) {
  const prompt = `You are a senior VC partner scoring deals for investment relevance.

Score this deal from 1-10 for VC relevance based on:
- Problem novelty and market size potential (3 points)
- Founder signal quality (3 points)
- Early traction or momentum (2 points)
- Timing and category attractiveness (2 points)

Deal:
${JSON.stringify({ ...enrichment, votes: launch.votes, topics: launch.topics }, null, 2)}

Be calibrated: 8-10 = genuinely exciting, pass to partners; 5-7 = worth monitoring; 1-4 = not VC-relevant.

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
      message: `Filtering launch ${i + 1}/${launches.length}: ${launch.name}`,
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
      research = { founders: [], researchNotes: 'Research unavailable', lowInfo: true }
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
      lowInfo: research.lowInfo || false,
    }

    deals.push(deal)
    onDealReady(deal)
  }

  return deals
}
