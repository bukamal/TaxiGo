import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// استخدام مفتاح الخدمة (Service Role Key) للتجربة - تحذير: غير آمن للإنتاج!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables (Service Key required for testing)')
}

const customFetch = (telegramId?: number) => {
    return (url: RequestInfo | URL, options?: RequestInit) => {
        const headers = new Headers(options?.headers)
        if (telegramId) {
            headers.set('X-Telegram-Id', telegramId.toString())
        }
        return fetch(url, { ...options, headers })
    }
}

export const createSupabaseClient = (telegramId?: number): SupabaseClient<Database> => {
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
        global: {
            fetch: customFetch(telegramId)
        }
    })
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
