import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../stores/app'

async function loadProfile(userId: string) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession } = useAppStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!cancelled && session?.user) {
          setSession(true)
          const profile = await loadProfile(session.user.id)
          if (!cancelled) {
            setUser({
              id: session.user.id,
              nickname: profile?.nickname || null,
              avatar_url: profile?.avatar_url || null,
              created_at: session.user.created_at,
            })
          }
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession(true)
        loadProfile(session.user.id).then((profile) => {
          setUser({
            id: session.user.id,
            nickname: profile?.nickname || null,
            avatar_url: profile?.avatar_url || null,
            created_at: session.user.created_at,
          })
        })
      } else {
        setSession(false)
        setUser(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  if (!ready) return null
  return <>{children}</>
}
