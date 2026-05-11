import { useState } from 'react'
import { useAppStore } from '../stores/app'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight } from 'lucide-react'

export default function Profile() {
  const { user, setUser, setSession, setCurrentFamily } = useAppStore()
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  async function handleSaveNickname() {
    if (!user || !nickname) return
    setSaving(true)
    const { error: upsertErr } = await supabase.from('profiles').upsert({ id: user.id, nickname })
    if (upsertErr) {
      alert('保存失败: ' + upsertErr.message)
    } else {
      setUser({ ...user, nickname })
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(false)
    setCurrentFamily(null)
    navigate('/login')
  }

  return (
    <div className="p-4">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
          {(nickname || '用')[0]}
        </div>
        <div>
          <div className="font-medium text-gray-800">{nickname || '设置昵称'}</div>
          <div className="text-xs text-gray-400">ID: {user?.id?.slice(0, 8)}...</div>
        </div>
      </div>

      {/* Nickname edit */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 className="text-sm font-medium text-gray-500 mb-3">昵称</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="输入昵称"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
          />
          <button
            onClick={handleSaveNickname}
            disabled={saving || !nickname}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? '保存中' : '保存'}
          </button>
        </div>
      </div>

      {/* Menu items */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <button className="w-full flex items-center justify-between p-4 border-b border-gray-50">
          <span className="text-sm text-gray-700">类别管理</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
        <button className="w-full flex items-center justify-between p-4 border-b border-gray-50">
          <span className="text-sm text-gray-700">数据导出</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
        <button className="w-full flex items-center justify-between p-4">
          <span className="text-sm text-gray-700">关于</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-white text-red-500 rounded-xl font-medium shadow-sm flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        退出登录
      </button>
    </div>
  )
}
