import { supabase } from './supabase'
import { buildJobMatches, buildScholarshipMatches } from './matcher'

export async function runMatchingForUser(userId) {
  const [{ data: profile }, { data: qualifications }, { data: skills }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).single(),
    supabase.from('qualifications').select('*').eq('user_id', userId),
    supabase.from('skills').select('*').eq('user_id', userId),
  ])

  if (!profile) throw new Error('Profile not found')

  const scholarshipPayload = buildScholarshipMatches(profile, qualifications || [], skills || [])
  const jobPayload = buildJobMatches(profile, qualifications || [], skills || [])

  await supabase.from('search_runs').insert([
    { user_id: userId, type: 'scholarship', status: 'running' },
    { user_id: userId, type: 'job', status: 'running' },
  ])

  await Promise.all([
    supabase.from('scholarship_matches').delete().eq('user_id', userId).eq('saved', false),
    supabase.from('job_matches').delete().eq('user_id', userId).eq('saved', false),
  ])

  const scholarshipRows = scholarshipPayload.map((m) => ({ ...m, user_id: userId }))
  const jobRows = jobPayload.map((m) => ({ ...m, user_id: userId }))

  const [{ error: sErr }, { error: jErr }] = await Promise.all([
    supabase.from('scholarship_matches').insert(scholarshipRows),
    supabase.from('job_matches').insert(jobRows),
  ])

  if (sErr) throw sErr
  if (jErr) throw jErr

  await supabase.from('search_runs').insert([
    { user_id: userId, type: 'scholarship', status: 'done' },
    { user_id: userId, type: 'job', status: 'done' },
  ])

  return { scholarships: scholarshipRows.length, jobs: jobRows.length }
}
