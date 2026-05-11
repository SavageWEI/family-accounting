import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../stores/app'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setUser = useAppStore((s) => s.setUser)
  const setSession = useAppStore((s) => s.setSession)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: err } = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    if (data.user) {
      setSession(true)
      setUser({
        id: data.user.id,
        nickname: data.user.user_metadata?.nickname || null,
        avatar_url: null,
        created_at: data.user.created_at,
      })
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center items-center px-6 bg-gradient-to-b from-indigo-50 to-white">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-2">家庭记账</h1>
        <p className="text-center text-gray-400 text-sm mb-8">和家人一起管理账单</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱地址"
            required
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-base focus:outline-none focus:border-indigo-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-base focus:outline-none focus:border-indigo-400"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium text-base disabled:opacity-50"
          >
            {loading ? '加载中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-400">
          {isRegister ? '已有账号？' : '没有账号？'}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-600 ml-1"
          >
            {isRegister ? '去登录' : '去注册'}
          </button>
        </p>
      </div>
    </div>
  )
}
