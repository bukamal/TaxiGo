import { create } from 'zustand'
import { Tables } from '../lib/supabaseClient'
type Profile = Tables<'profiles'>
interface AppState { profile: Profile|null; setProfile: (p: Profile|null) => void; isLoading: boolean; setIsLoading: (l: boolean) => void }
export const useAppStore = create<AppState>((set) => ({
    profile: null, setProfile: (p) => set({ profile: p }),
    isLoading: true, setIsLoading: (l) => set({ isLoading: l })
}))
