import { supabase } from './supabase'

function functionsBase() {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url) throw new Error('Missing VITE_SUPABASE_URL')
  return `${url.replace(/\/$/, '')}/functions/v1`
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sign in required')
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
  return {
    Authorization: `Bearer ${token}`,
    apikey: anon,
    'Content-Type': 'application/json',
  }
}

/** Start Stripe Checkout for Premium ($3/mo). Returns { url }. */
export async function startPremiumCheckout({ successUrl, cancelUrl } = {}) {
  const headers = await authHeaders()
  const origin = window.location.origin
  const res = await fetch(`${functionsBase()}/create-checkout-session`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      success_url: successUrl || `${origin}/pricing?checkout=success`,
      cancel_url: cancelUrl || `${origin}/pricing?checkout=cancel`,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Could not start checkout')
  return json
}

/** Open Stripe Customer Portal to manage / cancel subscription. */
export async function openBillingPortal({ returnUrl } = {}) {
  const headers = await authHeaders()
  const origin = window.location.origin
  const res = await fetch(`${functionsBase()}/create-portal-session`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      return_url: returnUrl || `${origin}/settings`,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Could not open billing portal')
  return json
}
