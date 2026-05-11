import { useEffect, useMemo } from 'react'
import { useAppStore } from '../stores/app'
import { formatAmount } from '../lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6']

export default function Stats() {
  const { bills, fetchBills, selectedMonth, setSelectedMonth, currentFamily, familyMembers, user } = useAppStore()

  useEffect(() => {
    if (currentFamily) fetchBills()
  }, [currentFamily, selectedMonth])

  const profileMap = useMemo(() => {
    const map: Record<string, string> = {}
    familyMembers.forEach((m) => {
      if (m.profile?.nickname) map[m.user_id] = m.profile.nickname
    })
    if (user?.nickname) map[user.id] = user.nickname
    return map
  }, [familyMembers, user])

  if (!currentFamily) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400 mt-20">请先创建或加入家庭组</p>
      </div>
    )
  }

  const expenseBills = bills.filter((b) => b.type === 'expense')
  const incomeBills = bills.filter((b) => b.type === 'income')
  const totalExpense = expenseBills.reduce((s, b) => s + b.amount, 0)
  const totalIncome = incomeBills.reduce((s, b) => s + b.amount, 0)

  const categoryData = expenseBills.reduce<Record<string, number>>((acc, b) => {
    const name = b.category_id || '其他'
    acc[name] = (acc[name] || 0) + b.amount
    return acc
  }, {})
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }))

  return (
    <div className="p-4">
      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 mb-4"
      />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-400 mb-1">支出</div>
          <div className="text-xl font-bold text-gray-800">{formatAmount(totalExpense)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-400 mb-1">收入</div>
          <div className="text-xl font-bold text-green-500">{formatAmount(totalIncome)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm col-span-2">
          <div className="text-xs text-gray-400 mb-1">结余</div>
          <div className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
            {formatAmount(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">支出分类</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height={224}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Member contributions */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 mb-3">成员记账情况</h3>
        {(() => {
          const memberData = bills.reduce<Record<string, { name: string; count: number; amount: number }>>((acc, b) => {
            const uid = b.user_id
            if (!acc[uid]) acc[uid] = { name: profileMap[uid] || '未知', count: 0, amount: 0 }
            acc[uid].count++
            acc[uid].amount += b.amount
            return acc
          }, {})
          return Object.values(memberData).map((m) => (
            <div key={m.name} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{m.name}</span>
              <span className="text-sm text-gray-400">{m.count}笔 · {formatAmount(m.amount)}</span>
            </div>
          ))
        })()}
      </div>
    </div>
  )
}
