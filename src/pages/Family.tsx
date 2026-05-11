import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/app'
import { supabase } from '../lib/supabase'
import { generateInviteCode } from '../lib/utils'
import type { Family, FamilyMember } from '../types'
import { Pencil, Plus, Copy, LogIn, Trash2, Check, X } from 'lucide-react'

export default function Family() {
  const { user, currentFamily, setCurrentFamily, familyMembers, setFamilyMembers } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState('')

  useEffect(() => {
    if (user) fetchMyFamily()
  }, [user])

  async function fetchMyFamily() {
    // 1. 找到用户所属的家庭（通过 family_members）
    const { data: member } = await supabase
      .from('family_members')
      .select('family_id, role')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (member) {
      // 2. 用 family_id 查 families 表
      const { data: fam } = await supabase
        .from('families')
        .select('*')
        .eq('id', member.family_id)
        .single()

      if (fam) {
        setCurrentFamily(fam as Family)
        fetchMembers(fam.id)
      }
    }
  }

  async function fetchMembers(familyId: string) {
    // 先查成员
    const { data: members } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)

    if (!members) return

    // 再查每个成员的头像信息
    const withProfiles = await Promise.all(
      members.map(async (m) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', m.user_id)
          .single()
        return { ...m, profile: profile || undefined }
      })
    )
    setFamilyMembers(withProfiles as FamilyMember[])
  }

  async function handleCreate() {
    if (!familyName || !user) return
    setLoading(true)
    setError('')
    const code = generateInviteCode()

    const { data: family, error: insertErr } = await supabase
      .from('families')
      .insert({ name: familyName, invite_code: code, created_by: user.id })
      .select().single()

    if (insertErr) {
      setError('创建失败: ' + insertErr.message)
      setLoading(false)
      return
    }

    if (family) {
      await supabase.from('family_members').insert({
        family_id: family.id,
        user_id: user.id,
        role: 'admin',
      })
      setCurrentFamily(family as Family)
      setShowCreate(false)
      setFamilyName('')
      fetchMembers(family.id)
    }
    setLoading(false)
  }

  async function handleJoin() {
    if (!inviteCode || !user) return
    setLoading(true)
    setError('')

    const { data: family } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (!family) {
      setError('邀请码无效')
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', family.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      setError('你已在该家庭组中')
      setLoading(false)
      return
    }

    await supabase.from('family_members').insert({
      family_id: family.id,
      user_id: user.id,
      role: 'member',
    })

    setCurrentFamily(family as Family)
    setShowJoin(false)
    setInviteCode('')
    fetchMembers(family.id)
    setLoading(false)
  }

  async function handleRemoveMember(memberId: string) {
    const member = familyMembers.find((m) => m.id === memberId)
    if (!member) return

    // 删除该成员在此家庭中的所有账单
    await supabase.from('bills').delete()
      .eq('family_id', currentFamily!.id)
      .eq('user_id', member.user_id)

    // 删除成员记录
    await supabase.from('family_members').delete().eq('id', memberId)

    setFamilyMembers(familyMembers.filter((m) => m.id !== memberId))
  }

  function copyInviteCode() {
    if (currentFamily) {
      navigator.clipboard.writeText(currentFamily.invite_code)
    }
  }

  async function handleUpdateName() {
    if (!currentFamily || !newFamilyName) return
    const { error: updateErr } = await supabase
      .from('families')
      .update({ name: newFamilyName })
      .eq('id', currentFamily.id)

    if (updateErr) {
      setError('修改失败: ' + updateErr.message)
      return
    }

    setCurrentFamily({ ...currentFamily, name: newFamilyName })
    setEditingName(false)
    // 重新从数据库确认
    fetchMyFamily()
  }

  if (!currentFamily) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">家庭组</h2>
        <div className="text-center py-12">
          <p className="text-gray-400 mb-6">你还没有家庭组</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Plus size={20} /> 创建家庭组
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="w-full py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <LogIn size={20} /> 加入家庭组
            </button>
          </div>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center p-6" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">创建家庭组</h3>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="家庭组名称，如：我的家"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 mb-4"
              />
              <button
                onClick={handleCreate}
                disabled={loading || !familyName}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        )}

        {/* Join modal */}
        {showJoin && (
          <div className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center p-6" onClick={() => setShowJoin(false)}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">加入家庭组</h3>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="输入6位邀请码"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 mb-4 uppercase"
              />
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={loading || inviteCode.length < 6}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {loading ? '加入中...' : '加入'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const isAdmin = familyMembers.find((m) => m.user_id === user?.id)?.role === 'admin'

  return (
    <div className="p-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              className="text-xl font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 w-full focus:outline-none focus:border-indigo-400"
              autoFocus
            />
            <button onClick={handleUpdateName} className="text-green-500 shrink-0"><Check size={20} /></button>
            <button onClick={() => setEditingName(false)} className="text-gray-300 shrink-0"><X size={20} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">{currentFamily.name}</h2>
            {isAdmin && (
              <button onClick={() => { setNewFamilyName(currentFamily.name); setEditingName(true) }} className="text-gray-300 hover:text-indigo-400">
                <Pencil size={14} />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-400">邀请码：</span>
          <span className="text-lg font-mono font-bold text-indigo-600 tracking-widest">
            {currentFamily.invite_code}
          </span>
          <button onClick={copyInviteCode} className="text-indigo-400 active:text-indigo-600">
            <Copy size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          家庭成员 ({familyMembers.length})
        </h3>
        {familyMembers.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                {(m.profile?.nickname || '用')[0]}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">
                  {m.profile?.nickname || '未知用户'}
                  {m.user_id === user?.id && ' (我)'}
                </div>
                <div className="text-xs text-gray-400">
                  {m.role === 'admin' ? '管理员' : '成员'} · {new Date(m.joined_at).toLocaleDateString('zh-CN')} 加入
                </div>
              </div>
            </div>
            {isAdmin && m.user_id !== user?.id && (
              <button
                onClick={() => handleRemoveMember(m.id)}
                className="text-gray-300 hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
