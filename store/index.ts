import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import authSlice from './authSlice'
import locationSlice from './locationSlice'
import privacySlice from './privacySlice'
import contactsSlice from './contactsSlice'
import messagingSlice from './messagingSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    location: locationSlice,
    privacy: privacySlice,
    contacts: contactsSlice,
    messaging: messagingSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector 