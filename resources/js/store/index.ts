import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import petsReducer from './slices/petsSlice';
import calendarEventsReducer from './slices/calendarEventsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pets: petsReducer,
    calendarEvents: calendarEventsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;