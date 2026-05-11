import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Profile, Family, FamilyMember, Bill } from '../types'

interface AppState {
  // Auth
  user: Profile | null
  session: boolean
  setUser: (user: Profile | null) => void
  setSession: (session: boolean) => void

  // Family
  currentFamily: Family | null
  familyMembers: FamilyMember[]
  setCurrentFamily: (family: Family | null) => void
  setFamilyMembers: (members: FamilyMember[]) => void

  // Bills
  bills: Bill[]
  selectedMonth: string
  fetchBills: () => Promise<void>
  setBills: (bills: Bill[]) => void
  addBill: (bill: Bill) => void
  updateBill: (bill: Bill) => void
  removeBill: (id: string) => void
  setSelectedMonth: (month: string) => void
}

export const useAppStore = create<AppState>()((set, get) => ({
  user: null,
  session: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),

  currentFamily: null,
  familyMembers: [],
  setCurrentFamily: (family) => set({ currentFamily: family }),
  setFamilyMembers: (members) => set({ familyMembers: members }),

  bills: [],
  selectedMonth: new Date().toISOString().slice(0, 7),
  fetchBills: async () => {
    const { currentFamily, selectedMonth } = get()
    if (!currentFamily) return
    const start = `${selectedMonth}-01`
    const end = `${selectedMonth}-31`
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('family_id', currentFamily.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
    if (data) set({ bills: data as Bill[] })
  },
  setBills: (bills) => set({ bills }),
  addBill: (bill) => set((s) => ({ bills: [bill, ...s.bills] })),
  updateBill: (bill) =>
    set((s) => ({ bills: s.bills.map((b) => (b.id === bill.id ? bill : b)) })),
  removeBill: (id) => set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}))
