export type Env = {
  Bindings: {
    R2: R2Bucket
    SUPABASE_URL: string
    SUPABASE_SERVICE_ROLE_KEY: string
    RAZORPAY_KEY_ID: string
    RAZORPAY_KEY_SECRET: string
    RAZORPAY_WEBHOOK_SECRET: string
    CLIENT_URL: string
    RESEND_API_KEY?: string
    EMAIL_FROM?: string
  }
  Variables: {
    user: UserProfile
  }
}

export type UserProfile = {
  id: string
  email: string
  role: 'student' | 'owner' | 'agent' | 'admin'
  first_name: string
  last_name: string
  phone?: string
  avatar?: string
  university?: string
  is_verified_owner: boolean
  is_verified_agent: boolean
  is_active: boolean
  referral_code?: string
  agent_code?: string
  commission_type: 'recurring' | 'one-time'
  total_commission_earned: number
  commission_balance: number
  created_at?: string
  last_login?: string
}
