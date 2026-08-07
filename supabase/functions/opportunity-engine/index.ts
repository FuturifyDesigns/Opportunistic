// Supabase Edge Function: opportunity engine refresh for one user or all users (cron).
// Deploy: supabase functions deploy opportunity-engine
// Secrets: SUPABASE_SERVICE_ROLE_KEY (auto), optional ADZUNA keys later.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const cronSecret = Deno.env.get('CRON_SECRET')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const cronHeader = req.headers.get('x-cron-secret')
    const isCron = cronSecret && cronHeader === cronSecret

    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    let userIds = []

    if (isCron || body.all === true) {
      if (!isCron && body.all) {
        return json({ error: 'Forbidden' }, 403)
      }
      const { data: profiles, error } = await admin.from('profiles').select('user_id').eq('onboarding_complete', true)
      if (error) throw error
      userIds = (profiles || []).map((p) => p.user_id)
    } else {
      const { data: userData, error: uErr } = await userClient.auth.getUser()
      if (uErr || !userData?.user) return json({ error: 'Unauthorized' }, 401)
      userIds = [userData.user.id]
    }

    // Kick client-side style refresh by writing a queue flag; full matching runs in the SPA.
    // For cron, insert a search_runs "queued" so dashboards can pick up weekly refresh.
    const results = []
    for (const uid of userIds) {
      await admin.from('search_runs').insert([
        { user_id: uid, type: 'scholarship', status: 'queued', notes: 'weekly-engine' },
        { user_id: uid, type: 'job', status: 'queued', notes: 'weekly-engine' },
      ])
      results.push(uid)
    }

    return json({
      ok: true,
      queued: results.length,
      mode: isCron ? 'cron' : 'user',
      hint: 'Clients should call runMatchingForUser when search_runs status=queued or age>7d',
    })
  } catch (e) {
    return json({ error: e.message || String(e) }, 500)
  }
})

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
