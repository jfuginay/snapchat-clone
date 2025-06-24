import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface LocationState {
  currentLocation: {
    latitude: number
    longitude: number
    timestamp: string
    accuracy?: number
    heading?: number
    speed?: number
  } | null
  isTracking: boolean
  hasPermission: boolean
  trackingAccuracy: 'high' | 'medium' | 'low'
  updateInterval: number
  locationHistory: Array<{
    latitude: number
    longitude: number
    timestamp: string
    accuracy?: number
  }>
  backgroundTracking: boolean
}

const initialState: LocationState = {
  currentLocation: null,
  isTracking: false,
  hasPermission: false,
  trackingAccuracy: 'medium',
  updateInterval: 30000, // 30 seconds
  locationHistory: [],
  backgroundTracking: false,
}

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<LocationState['currentLocation']>) => {
      state.currentLocation = action.payload
      if (action.payload) {
        state.locationHistory.unshift(action.payload)
        // Keep only last 100 locations
        if (state.locationHistory.length > 100) {
          state.locationHistory = state.locationHistory.slice(0, 100)
        }
      }
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload
    },
    setPermission: (state, action: PayloadAction<boolean>) => {
      state.hasPermission = action.payload
    },
    setTrackingAccuracy: (state, action: PayloadAction<'high' | 'medium' | 'low'>) => {
      state.trackingAccuracy = action.payload
    },
    setUpdateInterval: (state, action: PayloadAction<number>) => {
      state.updateInterval = action.payload
    },
    setBackgroundTracking: (state, action: PayloadAction<boolean>) => {
      state.backgroundTracking = action.payload
    },
    clearLocationHistory: (state) => {
      state.locationHistory = []
    },
  },
})

export const {
  setCurrentLocation,
  setTracking,
  setPermission,
  setTrackingAccuracy,
  setUpdateInterval,
  setBackgroundTracking,
  clearLocationHistory,
} = locationSlice.actions

export default locationSlice.reducer 