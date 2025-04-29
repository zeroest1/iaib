import { createSlice } from '@reduxjs/toolkit';
import { api } from '../services/api';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(api.endpoints.login.matchFulfilled, (state, { payload }) => {
        localStorage.setItem('token', payload.token);
        state.loading = true;
      })
      .addMatcher(api.endpoints.getMe.matchPending, (state) => {
        state.loading = true;
      })
      .addMatcher(api.endpoints.getMe.matchFulfilled, (state, { payload }) => {
        state.user = payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addMatcher(api.endpoints.getMe.matchRejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer; 