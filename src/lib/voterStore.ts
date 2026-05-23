// src/store/authStore.ts
import { createStore } from '@tanstack/react-store'

export interface User {
  id: string
  email: string
  name: string
} 

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

const STORAGE_KEY = 'ts_auth_session'

// Helper: Safely load initial persisted state during browser boot
const getInitialState = (): any => {
  const defaultState: any = {
    user: null,
    token: null,
    isAuthenticated: false,
  }

  if (typeof window === 'undefined') return defaultState

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultState
  } catch (error) {
    console.error('Failed to parse persisted auth state:', error)
    return defaultState
  }
}

// Initialize the store with local data
export const authStore:any = createStore<any>({
  initialState: getInitialState()
})

// Automatically write changes to localStorage on any store updates

authStore.subscribe(() => {
    const currentState = authStore.state
    if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState))
        } catch (error) {
          console.error('Failed to persist auth state:', error)
        }
      }
  })

// Dispatchers/Actions remain clean and mutation-free
export const authActions = {
  login: (user: User, token: string) => {
    authStore.setState(() => ({
      user,
      token,
      isAuthenticated: true,
    }))
  },
  logout: () => {
    authStore.setState(() => ({
      user: null,
      token: null,
      isAuthenticated: false,
    }))
  }
}
