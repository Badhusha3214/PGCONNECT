import { createBrowserClient } from '@supabase/ssr'

const DIRECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// In the browser, talk to Supabase via our own origin (rewritten to Supabase in
// next.config.mjs) so ISP/extension blocks on *.supabase.co can't break login.
const SUPABASE_URL = typeof window !== 'undefined' ? `${window.location.origin}/sb` : DIRECT_URL

// The session key is normally derived from the URL's hostname; pin it to the
// project's own key so moving to the proxy doesn't log anyone out.
const PROJECT_REF = new URL(DIRECT_URL).hostname.split('.')[0]

export const supabase = createBrowserClient(
  SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { cookieOptions: { name: `sb-${PROJECT_REF}-auth-token` } }
)

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const getAuthToken = async () => {
  const session = await getSession()
  return session?.access_token ?? null
}
