import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// One client per Worker isolate instead of one per request. The client is
// stateless here (service role, no session), so sharing it is safe and saves
// re-building it on every request under load.
let client: SupabaseClient | null = null
let clientKey = ''

export const getSupabase = (env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }) => {
  const key = `${env.SUPABASE_URL}|${env.SUPABASE_SERVICE_ROLE_KEY}`
  if (!client || clientKey !== key) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    clientKey = key
  }
  return client
}
