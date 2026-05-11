export interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
  created_at: string
}

export interface Family {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profile?: Profile
}

export interface Category {
  id: string
  name: string
  icon: string
  type: 'income' | 'expense'
  is_system: boolean
}

export interface Bill {
  id: string
  family_id: string
  user_id: string
  category_id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  note: string | null
  created_at: string
  updated_at: string
  category?: Category
  profile?: Profile
}
