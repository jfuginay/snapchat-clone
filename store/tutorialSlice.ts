import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface TutorialState {
  hasCompletedOnboarding: boolean
  lastCompletedStep: number
  tutorialVisible: boolean
  firstTimeUser: boolean
}

const initialState: TutorialState = {
  hasCompletedOnboarding: false,
  lastCompletedStep: -1,
  tutorialVisible: false,
  firstTimeUser: true
}

const tutorialSlice = createSlice({
  name: 'tutorial',
  initialState,
  reducers: {
    setTutorialVisible: (state, action: PayloadAction<boolean>) => {
      state.tutorialVisible = action.payload
    },
    
    completeTutorial: (state) => {
      state.hasCompletedOnboarding = true
      state.lastCompletedStep = 3 // Total steps - 1 (now 4 steps: 0,1,2,3)
      state.tutorialVisible = false
      state.firstTimeUser = false
    },
    
    skipTutorial: (state) => {
      state.hasCompletedOnboarding = true
      state.tutorialVisible = false
      state.firstTimeUser = false
    },
    
    updateLastCompletedStep: (state, action: PayloadAction<number>) => {
      state.lastCompletedStep = action.payload
    },
    
    markUserAsReturning: (state) => {
      state.firstTimeUser = false
    },
    
    showTutorialFromStep: (state, action: PayloadAction<number>) => {
      state.tutorialVisible = true
      state.lastCompletedStep = action.payload - 1
    },
    
    resetTutorial: (state) => {
      state.hasCompletedOnboarding = false
      state.lastCompletedStep = -1
      state.tutorialVisible = true
      state.firstTimeUser = true
    }
  }
})

export const {
  setTutorialVisible,
  completeTutorial,
  skipTutorial,
  updateLastCompletedStep,
  markUserAsReturning,
  showTutorialFromStep,
  resetTutorial
} = tutorialSlice.actions

export default tutorialSlice.reducer 