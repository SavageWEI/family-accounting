export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDate(date: string): string {
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const expenseIcons: Record<string, string> = {
  '餐饮': '🍽️', '交通': '🚗', '购物': '🛍️', '居住': '🏠',
  '娱乐': '🎮', '医疗': '💊', '教育': '📚', '通讯': '📱',
  '服饰': '👔', '日用': '🧴', '其他支出': '💸', '其他': '💸',
}

const incomeIcons: Record<string, string> = {
  '工资': '💰', '奖金': '🎁', '投资': '📈', '兼职': '💼',
  '退款': '↩️', '其他收入': '💵',
}

export function getCategoryIcon(categoryId: string, type: string): string {
  const map = type === 'expense' ? expenseIcons : incomeIcons
  return map[categoryId] || (type === 'expense' ? '💸' : '💰')
}
