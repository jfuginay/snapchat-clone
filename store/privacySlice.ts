import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface PrivacyState {
  shareLocation: boolean
  privacyLevel: 'everyone' | 'friends' | 'custom' | 'nobody'
  ghostMode: {
    enabled: boolean
    until?: string // ISO timestamp
    duration?: '1h' | '6h' | '24h' | 'indefinite'
  }
  allowedContacts: string[] // user IDs
  blockedContacts: string[] // user IDs
  showPreciseLocation: boolean
  shareLocationHistory: boolean
  allowStrangerMessages: boolean
  showOnlineStatus: boolean
  notifications: {
    pushEnabled: boolean
    locationUpdates: boolean
    friendRequests: boolean
    messages: boolean
  }
}

const initialState: PrivacyState = {
  shareLocation: false,
  privacyLevel: 'friends',
  ghostMode: {
    enabled: false,
  },
  allowedContacts: [],
  blockedContacts: [],
  showPreciseLocation: true,
  shareLocationHistory: false,
  allowStrangerMessages: false,
  showOnlineStatus: true,
  notifications: {
    pushEnabled: true,
    locationUpdates: true,
    friendRequests: true,
    messages: true,
  },
}

const privacySlice = createSlice({
  name: 'privacy',
  initialState,
  reducers: {
    setShareLocation: (state, action: PayloadAction<boolean>) => {
      state.shareLocation = action.payload
    },
    setPrivacyLevel: (state, action: PayloadAction<PrivacyState['privacyLevel']>) => {
      state.privacyLevel = action.payload
    },
    setGhostMode: (state, action: PayloadAction<PrivacyState['ghostMode']>) => {
      state.ghostMode = action.payload
    },
    addAllowedContact: (state, action: PayloadAction<string>) => {
      if (!state.allowedContacts.includes(action.payload)) {
        state.allowedContacts.push(action.payload)
      }
    },
    removeAllowedContact: (state, action: PayloadAction<string>) => {
      state.allowedContacts = state.allowedContacts.filter(id => id !== action.payload)
    },
    addBlockedContact: (state, action: PayloadAction<string>) => {
      if (!state.blockedContacts.includes(action.payload)) {
        state.blockedContacts.push(action.payload)
      }
    },
    removeBlockedContact: (state, action: PayloadAction<string>) => {
      state.blockedContacts = state.blockedContacts.filter(id => id !== action.payload)
    },
    setShowPreciseLocation: (state, action: PayloadAction<boolean>) => {
      state.showPreciseLocation = action.payload
    },
    setShareLocationHistory: (state, action: PayloadAction<boolean>) => {
      state.shareLocationHistory = action.payload
    },
    setAllowStrangerMessages: (state, action: PayloadAction<boolean>) => {
      state.allowStrangerMessages = action.payload
    },
    setShowOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.showOnlineStatus = action.payload
    },
    updateNotifications: (state, action: PayloadAction<Partial<PrivacyState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload }
    },
  },
})

export const {
  setShareLocation,
  setPrivacyLevel,
  setGhostMode,
  addAllowedContact,
  removeAllowedContact,
  addBlockedContact,
  removeBlockedContact,
  setShowPreciseLocation,
  setShareLocationHistory,
  setAllowStrangerMessages,
  setShowOnlineStatus,
  updateNotifications,
} = privacySlice.actions

export default privacySlice.reducer 