// Supabase Edge Function: opportunity engine refresh for one user or all users (cron).
// Deploy: supabase functions deploy opportunity-engine
// Secrets: SUPABASE_SERVICE_ROLE_KEY (auto), CRON_SECRET (required for cron / all)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set([
  'https://opportunistic.online',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
])

function corsHeaders(req) {
  const origin = req.headers.get('Origin') || ''
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://opportunistic.online'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const cronSecret = Deno.env.get('CRON_SECRET')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: 'Server misconfigured' }, 500, cors)
    }

    const body = await req.json().catch(() => ({}))
    const cronHeader = req.headers.get('x-cron-secret') || ''
    const isCron = Boolean(cronSecret && cronHeader && timingSafeEqual(cronHeader, cronSecret))

    // Fail closed: bulk refresh is cron-only and requires a configured secret.
    if (body.all === true) {
      if (!cronSecret) return json({ error: 'Cron not configured' }, 503, cors)
      if (!isCron) return json({ error: 'Forbidden' }, 403, cors)
    }

    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    let userIds = []

    if (isCron && body.all === true) {
      const { data: profiles, error } = await admin
        .from('profiles')
        .select('user_id')
        .eq('onboarding_complete', true)
      if (error) throw error
      userIds = (profiles || []).map((p) => p.user_id)
    } else {
      const { data: userData, error: uErr } = await userClient.auth.getUser()
      if (uErr || !userData?.user) return json({ error: 'Unauthorized' }, 401, cors)
      userIds = [userData.user.id]
    }

    const results = []
    for (const uid of userIds) {
      await admin.from('search_runs').insert([
        { user_id: uid, type: 'scholarship', status: 'queued', notes: 'weekly-engine' },
        { user_id: uid, type: 'job', status: 'queued', notes: 'weekly-engine' },
      ])
      results.push(uid)
    }

    return json(
      {
        ok: true,
        queued: results.length,
        mode: isCron ? 'cron' : 'user',
        hint: 'Clients should call runMatchingForUser when search_runs status=queued or age>7d',
      },
      200,
      cors,
    )
  } catch (e) {
    return json({ error: e.message || String(e) }, 500, cors)
  }
})

function json(payload, status = 200, cors = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

/** Constant-time string compare for cron secrets. */
function timingSafeEqual(a, b) {
  const enc = new TextEncoder()
  const aa = enc.encode(a)
  const bb = enc.encode(b)
  if (aa.length !== bb.length) return false
  let out = 0
  for (let i = 0; i < aa.length; i += 1) out |= aa[i] ^ bb[i]
  return out === 0
}
