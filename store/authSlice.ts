import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: any | null
  loading: boolean
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User | null; session: any | null }>) => {
      state.user = action.payload.user
      state.session = action.payload.session
      // User is authenticated if they have a valid session, even without a profile (new signups)
      state.isAuthenticated = !!action.payload.session
      state.loading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    clearAuth: (state) => {
      state.user = null
      state.session = null
      state.isAuthenticated = false
      state.loading = false
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
})

export const { setAuth, setLoading, clearAuth, updateUser } = authSlice.actions
export default authSlice.reducer 