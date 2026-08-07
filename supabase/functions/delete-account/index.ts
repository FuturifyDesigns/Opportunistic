// Delete the signed-in user's app data + auth account.
// Deploy: supabase functions deploy delete-account
// Requires service role (auto) + caller JWT.

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: 'Server misconfigured' }, 500, cors)
    }

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401, cors)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: uErr } = await userClient.auth.getUser()
    if (uErr || !userData?.user) return json({ error: 'Unauthorized' }, 401, cors)

    const uid = userData.user.id
    const admin = createClient(supabaseUrl, serviceKey)

    await Promise.all([
      admin.from('scholarship_matches').delete().eq('user_id', uid),
      admin.from('job_matches').delete().eq('user_id', uid),
      admin.from('qualifications').delete().eq('user_id', uid),
      admin.from('skills').delete().eq('user_id', uid),
      admin.from('search_runs').delete().eq('user_id', uid),
      admin.from('profiles').delete().eq('user_id', uid),
    ])

    const { error: delErr } = await admin.auth.admin.deleteUser(uid)
    if (delErr) throw delErr

    return json({ ok: true }, 200, cors)
  } catch (e) {
    return json({ error: e.message || String(e) }, 500, cors)
  }
})

function json(payload, status, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
