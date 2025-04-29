import { createApi } from '@reduxjs/toolkit/query/react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, data, params }) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      
      console.log(`API Request: ${method.toUpperCase()} ${baseUrl}${url}`, { 
        headers: { ...headers, Authorization: token ? 'Bearer [REDACTED]' : undefined },
        params
      });
      
      const result = await axios({ url: `${baseUrl}${url}`, method, data, params, headers });
      
      console.log(`API Response: ${method.toUpperCase()} ${baseUrl}${url}`, { 
        status: result.status, 
        data: result.data
      });
      
      return { data: result.data };
    } catch (axiosError) {
      console.error(`API Error: ${method.toUpperCase()} ${baseUrl}${url}`, { 
        status: axiosError.response?.status, 
        data: axiosError.response?.data, 
        message: axiosError.message,
        stack: axiosError.stack
      });
      
      return {
        error: { 
          status: axiosError.response?.status, 
          data: axiosError.response?.data,
          message: axiosError.message
        },
      };
    }
  };

export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Auth', 'Notifications', 'Favorites', 'ReadStatus', 'Groups', 'UserGroups'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'post', data: credentials }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation({
      query: (form) => ({ url: '/auth/register', method: 'post', data: form }),
      invalidatesTags: ['Auth'],
    }),
    getMe: builder.query({
      query: () => ({ url: '/auth/me', method: 'get' }),
      providesTags: ['Auth'],
      keepUnusedDataFor: 30,
    }),
    getNotifications: builder.query({
      query: ({ my = false }) => ({ url: my ? '/notifications/my' : '/notifications', method: 'get' }),
      providesTags: ['Notifications'],
      keepUnusedDataFor: 5,
    }),
    getNotification: builder.query({
      query: (id) => ({ url: `/notifications/${id}`, method: 'get' }),
      providesTags: (result, error, id) => [{ type: 'Notifications', id }],
    }),
    addNotification: builder.mutation({
      query: (notification) => ({ url: '/notifications', method: 'post', data: notification }),
      invalidatesTags: ['Notifications'],
    }),
    updateNotification: builder.mutation({
      query: ({ id, ...notification }) => ({ url: `/notifications/${id}`, method: 'put', data: notification }),
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}`, method: 'delete' }),
      invalidatesTags: ['Notifications'],
    }),
    getFavorites: builder.query({
      query: () => ({ url: '/favorites', method: 'get' }),
      providesTags: ['Favorites'],
      keepUnusedDataFor: 5,
    }),
    addFavorite: builder.mutation({
      query: (notificationId) => ({ url: '/favorites', method: 'post', data: { notificationId } }),
      invalidatesTags: ['Favorites'],
    }),
    removeFavorite: builder.mutation({
      query: (notificationId) => ({ url: `/favorites/${notificationId}`, method: 'delete' }),
      invalidatesTags: ['Favorites'],
    }),
    getReadStatus: builder.query({
      query: () => ({ url: '/notifications/read-status', method: 'get' }),
      providesTags: ['ReadStatus'],
      keepUnusedDataFor: 5,
      transformResponse: (response) => {
        return response || [];
      },
    }),
    markAsRead: builder.mutation({
      query: (notificationId) => ({ url: `/notifications/${notificationId}/read`, method: 'post' }),
      invalidatesTags: ['ReadStatus', 'Notifications'],
    }),
    getGroups: builder.query({
      query: () => ({ url: '/notifications/groups', method: 'get' }),
      providesTags: ['Groups'],
      keepUnusedDataFor: 30,
    }),
    getUserGroups: builder.query({
      query: () => ({ url: '/notifications/user-groups', method: 'get' }),
      providesTags: ['UserGroups'],
      keepUnusedDataFor: 30,
    }),
    getNotificationGroups: builder.query({
      query: (notificationId) => ({ url: `/notifications/${notificationId}/groups`, method: 'get' }),
      providesTags: (result, error, id) => [{ type: 'Groups', id }],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useAddNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
  useGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useGetReadStatusQuery,
  useMarkAsReadMutation,
  useGetGroupsQuery,
  useGetUserGroupsQuery,
  useGetNotificationGroupsQuery,
} = api; 