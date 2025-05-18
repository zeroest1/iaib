/**
 * Redux store configuration
 * Sets up the global state store with API and auth reducers
 */
import { configureStore } from '@reduxjs/toolkit';
import { api } from './services/api';
import authReducer from './features/authSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
}); 