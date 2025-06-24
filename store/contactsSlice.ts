import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Contact {
  id: string
  username: string
  display_name: string
  avatar: string
  location?: {
    latitude: number
    longitude: number
    timestamp: string
    distance?: number
  }
  lastSeen?: string
  isOnline: boolean
  status: 'friend' | 'pending' | 'blocked'
}

interface ContactsState {
  contacts: Contact[]
  searchQuery: string
  pendingRequests: Contact[]
  blockedUsers: Contact[]
  nearbyContacts: Contact[]
  loadingContacts: boolean
  contactUpdates: number // Counter for real-time updates
}

const initialState: ContactsState = {
  contacts: [],
  searchQuery: '',
  pendingRequests: [],
  blockedUsers: [],
  nearbyContacts: [],
  loadingContacts: false,
  contactUpdates: 0,
}

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.contacts = action.payload
      state.loadingContacts = false
    },
    addContact: (state, action: PayloadAction<Contact>) => {
      const existingIndex = state.contacts.findIndex(c => c.id === action.payload.id)
      if (existingIndex >= 0) {
        state.contacts[existingIndex] = action.payload
      } else {
        state.contacts.push(action.payload)
      }
    },
    updateContactLocation: (state, action: PayloadAction<{ contactId: string; location: Contact['location'] }>) => {
      const contact = state.contacts.find(c => c.id === action.payload.contactId)
      if (contact) {
        contact.location = action.payload.location
        contact.lastSeen = new Date().toISOString()
      }
      state.contactUpdates += 1
    },
    updateContactStatus: (state, action: PayloadAction<{ contactId: string; isOnline: boolean; lastSeen?: string }>) => {
      const contact = state.contacts.find(c => c.id === action.payload.contactId)
      if (contact) {
        contact.isOnline = action.payload.isOnline
        if (action.payload.lastSeen) {
          contact.lastSeen = action.payload.lastSeen
        }
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    addPendingRequest: (state, action: PayloadAction<Contact>) => {
      if (!state.pendingRequests.find(c => c.id === action.payload.id)) {
        state.pendingRequests.push(action.payload)
      }
    },
    removePendingRequest: (state, action: PayloadAction<string>) => {
      state.pendingRequests = state.pendingRequests.filter(c => c.id !== action.payload)
    },
    blockContact: (state, action: PayloadAction<Contact>) => {
      // Remove from contacts and add to blocked
      state.contacts = state.contacts.filter(c => c.id !== action.payload.id)
      if (!state.blockedUsers.find(c => c.id === action.payload.id)) {
        state.blockedUsers.push({ ...action.payload, status: 'blocked' })
      }
    },
    unblockContact: (state, action: PayloadAction<string>) => {
      state.blockedUsers = state.blockedUsers.filter(c => c.id !== action.payload)
    },
    updateNearbyContacts: (state, action: PayloadAction<Contact[]>) => {
      state.nearbyContacts = action.payload
    },
    setLoadingContacts: (state, action: PayloadAction<boolean>) => {
      state.loadingContacts = action.payload
    },
    removeContact: (state, action: PayloadAction<string>) => {
      state.contacts = state.contacts.filter(c => c.id !== action.payload)
    },
  },
})

export const {
  setContacts,
  addContact,
  updateContactLocation,
  updateContactStatus,
  setSearchQuery,
  addPendingRequest,
  removePendingRequest,
  blockContact,
  unblockContact,
  updateNearbyContacts,
  setLoadingContacts,
  removeContact,
} = contactsSlice.actions

export default contactsSlice.reducer 