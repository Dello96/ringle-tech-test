export interface User {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  created_at: string
}

export interface MembershipPlan {
  id: number
  name: string
  features: string[]
  duration_days: number
  price_cents: number
  description: string
  created_at: string
}

export interface UserMembership {
  id: number
  starts_at: string
  expires_at: string
  created_at: string
  'active?': boolean
  remaining_days: number
  plan: MembershipPlan
}

export interface Conversation {
  id: number
  topic: string
  messages_count: number
  created_at: string
}

export interface Message {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  audio_url: string | null
}

export interface AuthResponse {
  user: User
  token: string
}

export interface MeResponse {
  user: User
  membership: UserMembership | null
}

export interface AdminMembership extends UserMembership {
  user: User
}

export interface AdminUser extends User {
  membership: UserMembership | null
}
