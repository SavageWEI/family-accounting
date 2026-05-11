import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/app'
import type { Bill } from '../types'
import { formatAmount, formatDate, getCategoryIcon } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { Plus, X } from 'lucide-react'

const expenseIcons: Record<string, string> = {
  '餐饮': '🍽️', '交通': '🚗', '购物': '🛍️', '居住': '🏠',
  '娱乐': '🎮', '医疗': '💊', '教育': '📚', '通讯': '📱',
  '服饰': '👔', '日用': '🧴', '其他': '💸',
}

const incomeIcons: Record<string, string> = {
  '工资': '💰', '奖金': '🎁', '投资': '📈', '兼职': '💼',
  '退款': '↩️', '其他': '💵',
}

const defaultExpenseCategories = Object.entries(expenseIcons).map(([name, icon]) => ({
  id: name, name, icon, type: 'expense' as const,
}))
const defaultIncomeCategories = Object.entries(incomeIcons).map(([name, icon]) => ({
  id: name, name, icon, type: 'income' as const,
}))

export default function Home() {
  const { bills, fetchBills, addBill, removeBill, selectedMonth, currentFamily, user, familyMembers } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [profileMap, setProfileMap] = useState<Record<string, string>>({})

  // Add bill form
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [selectedCategory, setSelectedCategory] = useState('餐饮')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  useEffect(() => {
    if (currentFamily) fetchBills()
  }, [currentFamily, selectedMonth])

  useEffect(() => {
    const map: Record<string, string> = {}
    familyMembers.forEach((m) => {
      if (m.profile?.nickname) map[m.user_id] = m.profile.nickname
    })
    if (user?.nickname) map[user.id] = user.nickname
    setProfileMap(map)
  }, [familyMembers, user])

  async function handleAdd() {
    if (!amount || !currentFamily || !user) return
    setLoading(true)
    const { data } = await supabase.from('bills').insert({
      family_id: currentFamily.id,
      user_id: user.id,
      category_id: selectedCategory,
      type,
      amount: parseFloat(amount),
      date,
      note: note || null,
    }).select('*').single()

    if (data) {
      addBill(data as Bill)
      setShowAdd(false)
      resetForm()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('bills').delete().eq('id', id)
    removeBill(id)
    setDeletingId(null)
  }

  function resetForm() {
    setAmount('')
    setType('expense')
    setSelectedCategory('餐饮')
    setDate(new Date().toISOString().slice(0, 10))
    setNote('')
  }

  const categories = type === 'expense' ? defaultExpenseCategories : defaultIncomeCategories
  const totalIncome = bills.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const totalExpense = bills.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0)

  if (!currentFamily) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400 mt-20">请先创建或加入家庭组</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Monthly summary card */}
      <div className="bg-indigo-600 text-white rounded-2xl p-5 mb-4">
        <div className="text-sm opacity-80 mb-1">
          {selectedMonth.replace('-', '年')}月
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs opacity-70">支出</div>
            <div className="text-2xl font-bold">{formatAmount(totalExpense)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-70">收入</div>
            <div className="text-2xl font-bold">{formatAmount(totalIncome)}</div>
          </div>
        </div>
      </div>

      {/* Bill list */}
      <div className="space-y-2">
        {bills.length === 0 && (
          <p className="text-center text-gray-300 py-10">暂无账单，记一笔吧</p>
        )}
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm"
          >
            <div className="text-2xl">{getCategoryIcon(bill.category_id, bill.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">
                  {bill.category_id}
                </span>
                <span className={`font-semibold ${bill.type === 'income' ? 'text-green-500' : 'text-gray-800'}`}>
                  {bill.type === 'income' ? '+' : '-'}{formatAmount(bill.amount)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>{profileMap[bill.user_id] || '我'} · {formatDate(bill.date)}</span>
                {bill.note && <span className="truncate ml-2">{bill.note}</span>}
              </div>
            </div>
            {bill.user_id === user?.id && (
              <button
                onClick={() => handleDelete(bill.id)}
                disabled={deletingId === bill.id}
                className="text-gray-300 hover:text-red-400 shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => { resetForm(); setShowAdd(true) }}
        className="fixed right-4 bottom-20 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-10"
      >
        <Plus size={28} />
      </button>

      {/* Add bill sheet */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-20 flex items-end" onClick={() => setShowAdd(false)}>
          <div
            className="bg-white rounded-t-2xl w-full p-5 max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">记一笔</h2>

            {/* Type toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setType(t); setSelectedCategory(t === 'expense' ? '餐饮' : '工资') }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    type === t ? 'bg-white shadow text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {t === 'expense' ? '支出' : '收入'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full text-4xl font-bold text-center py-4 border-b border-gray-100 focus:outline-none mb-4"
              autoFocus
            />

            {/* Categories */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl ${
                    selectedCategory === cat.name ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs text-gray-500">{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Date & Note */}
            <div className="flex gap-3 mb-4">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="备注（可选）"
                className="flex-[2] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={loading || !amount}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
