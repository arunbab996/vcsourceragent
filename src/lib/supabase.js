import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export function isSupabaseEnabled() {
  return !!supabase
}

export async function saveDeal(deal, source = 'producthunt') {
  if (!supabase) return { error: 'Supabase not configured' }

  const { enrichment, scoring, launch } = deal

  const row = {
    id: `${source}_${deal.id}`,
    source,
    company_name: enrichment.companyName,
    tagline: enrichment.tagline,
    vertical: enrichment.vertical,
    stage: enrichment.stage,
    location: enrichment.location,
    founder_names: enrichment.founderNames || [],
    notable_signals: enrichment.notableSignals || [],
    traction_signals: enrichment.tractionSignals,
    enrichment_notes: enrichment.enrichmentNotes,
    score: scoring.score,
    score_reason: scoring.scoreReason,
    pass_to_partners: scoring.passToPartners,
    red_flags: scoring.redFlags || [],
    votes: launch.votes || 0,
    ph_url: launch.url || null,
    website: launch.website || null,
    thumbnail: launch.thumbnail || null,
    raw: deal,
  }

  const { error } = await supabase
    .from('deals')
    .upsert(row, { onConflict: 'id' })

  if (error) console.error('Supabase save error:', error)
  return { error }
}

export async function getExistingDealIds(source) {
  if (!supabase) return new Set()

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('deals')
    .select('id')
    .eq('source', source)
    .gte('created_at', since)

  if (error || !data) return new Set()
  return new Set(data.map(r => r.id))
}
