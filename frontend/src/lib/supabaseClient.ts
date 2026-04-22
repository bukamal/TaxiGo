import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
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
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        global: {
            fetch: customFetch(telegramId)
        }
    })
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
