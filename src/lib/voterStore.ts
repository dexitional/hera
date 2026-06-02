import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  maskPhone: string | null
  otp: string | null
  
  // Actions
  loadOtp: (otp: string, maskPhone: string) => void
  login: (user: User, token: string) => void
  logout: () => void
  clearOtp: () => void
}

const STORAGE_KEY = 'ts_auth_session'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      otp: null,
      maskPhone: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      loadOtp: (otp, maskPhone) => set({ otp, maskPhone }),
      clearOtp: () => set({ otp: null, maskPhone: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * Promise-based utility to verify the Zustand store has read from localStorage
 * inside TanStack Router's beforeLoad hooks.
 */
export function waitForHydration(): Promise<AuthState> {
  return new Promise((resolve) => {
    // If the storage middleware has initialized on the client, resolve instantly
    if (useAuthStore.persist.hasHydrated()) {
      return resolve(useAuthStore.getState())
    }

    // Otherwise, listen for hydration completion and then resolve
    const unsub = useAuthStore.persist.onHydrate(() => {
      setTimeout(() => {
        unsub()
        resolve(useAuthStore.getState())
      }, 0)
    })
  })
}
