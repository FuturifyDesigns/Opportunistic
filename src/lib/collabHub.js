import { supabase } from './supabase'

export async function setOpenToCollab(userId, open, intent = 'collaborate') {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      open_to_collab: Boolean(open),
      collab_intent: open ? intent || 'collaborate' : null,
    })
    .eq('user_id', userId)
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listCollabPeers(limit = 40) {
  const { data, error } = await supabase.rpc('list_collab_peers', { limit_count: limit })
  if (error) throw error
  return data || []
}

export async function listOpportunisticMembers(limit = 80) {
  const { data, error } = await supabase.rpc('list_opportunistic_members', { limit_count: limit })
  if (error) throw error
  return data || []
}

export async function listCollabPosts(limit = 50) {
  const { data, error } = await supabase.rpc('list_collab_posts', { limit_count: limit })
  if (error) throw error
  return data || []
}

export async function createCollabPost({ title, body, skills, intent }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const skillList = Array.isArray(skills)
    ? skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
    : String(skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12)

  const { data, error } = await supabase
    .from('collab_posts')
    .insert({
      user_id: user.id,
      title: String(title || '').trim().slice(0, 120),
      body: String(body || '').trim().slice(0, 2000),
      skills: skillList,
      intent: intent || 'collaborate',
    })
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function deactivateCollabPost(postId) {
  const { error } = await supabase
    .from('collab_posts')
    .update({ active: false })
    .eq('id', postId)
  if (error) throw error
}

export async function listMyThreads() {
  const { data, error } = await supabase.rpc('list_collab_threads')
  if (error) throw error
  return data || []
}

export async function startDm(otherUserId) {
  const { data, error } = await supabase.rpc('start_collab_dm', { other_user_id: otherUserId })
  if (error) throw error
  return data
}

export async function joinSkillRoom(skillName) {
  const { data, error } = await supabase.rpc('join_skill_room', { skill_name: skillName })
  if (error) throw error
  return data
}

export async function loadMessages(threadId, limit = 80) {
  const { data, error } = await supabase
    .from('collab_messages')
    .select('id, thread_id, user_id, body, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function sendMessage(threadId, body) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const text = String(body || '').trim()
  if (!text) throw new Error('Empty message')

  const { data, error } = await supabase
    .from('collab_messages')
    .insert({
      thread_id: threadId,
      user_id: user.id,
      body: text.slice(0, 4000),
    })
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function markThreadRead(threadId) {
  const { error } = await supabase.rpc('mark_collab_thread_read', { p_thread_id: threadId })
  if (error) throw error
}

export async function leaveThread(threadId) {
  const { error } = await supabase.rpc('leave_collab_thread', { p_thread_id: threadId })
  if (error) throw error
}

export function subscribeCollabPosts(onChange) {
  const channel = supabase
    .channel('collab-posts-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'collab_posts' },
      (payload) => onChange?.(payload),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeThreadMessages(threadId, onInsert) {
  const channel = supabase
    .channel(`collab-msg-${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'collab_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => onInsert?.(payload.new),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function loadMySkills(userId) {
  const { data, error } = await supabase
    .from('skills')
    .select('skill_name')
    .eq('user_id', userId)
    .order('skill_name')
  if (error) throw error
  return (data || []).map((r) => r.skill_name).filter(Boolean)
}

export async function getCollabProfile(userId) {
  const { data, error } = await supabase.rpc('get_collab_profile', { p_user_id: userId })
  if (error) throw error
  return data?.[0] || null
}

export async function listThreadPeople(threadId) {
  const { data, error } = await supabase.rpc('list_collab_thread_people', { p_thread_id: threadId })
  if (error) throw error
  return data || []
}

export async function listFriends() {
  const { data, error } = await supabase.rpc('list_collab_friends')
  if (error) throw error
  return data || []
}

export async function listFriendRequests() {
  const { data, error } = await supabase.rpc('list_friend_requests')
  if (error) throw error
  return data || []
}

export async function sendFriendRequest(userId) {
  const { data, error } = await supabase.rpc('send_friend_request', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function respondFriendRequest(userId, accept) {
  const { data, error } = await supabase.rpc('respond_friend_request', {
    p_user_id: userId,
    accept,
  })
  if (error) throw error
  return data
}

export async function cancelFriendRequest(userId) {
  const { data, error } = await supabase.rpc('cancel_friend_request', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function unfriend(userId) {
  const { data, error } = await supabase.rpc('unfriend_collab', { p_user_id: userId })
  if (error) throw error
  return data
}

export async function recommendMatch({
  toUserId,
  kind,
  title,
  url,
  company,
  location,
  source,
  deadline,
  matchScore,
  note,
}) {
  const { data, error } = await supabase.rpc('recommend_match', {
    p_to_user: toUserId,
    p_kind: kind === 'scholarships' ? 'scholarship' : kind,
    p_title: title,
    p_url: url,
    p_company: company || null,
    p_location: location || null,
    p_source: source || null,
    p_deadline: deadline || null,
    p_match_score: matchScore ?? null,
    p_note: note || null,
  })
  if (error) throw error
  return data
}

export async function listMatchRecommendations() {
  const { data, error } = await supabase.rpc('list_match_recommendations')
  if (error) throw error
  return data || []
}

export async function dismissMatchRecommendation(id) {
  const { error } = await supabase.rpc('dismiss_match_recommendation', { p_id: id })
  if (error) throw error
}
