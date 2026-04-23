import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables.')
}

const customFetch = (telegramId?: string) => {
    return (url: RequestInfo | URL, options?: RequestInit) => {
        const headers = new Headers(options?.headers)
        if (telegramId) {
            headers.set('X-Telegram-Id', telegramId)
        }
        return fetch(url, { ...options, headers })
    }
}

export const createSupabaseClient = (telegramId?: string): SupabaseClient<Database> => {
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
        global: { fetch: customFetch(telegramId) }
    })
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
