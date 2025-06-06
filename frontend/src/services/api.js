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
      
      const result = await axios({ url: `${baseUrl}${url}`, method, data, params, headers });
      
      return { data: result.data };
    } catch (axiosError) {
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
  tagTypes: ['Auth', 'Notifications', 'Favorites', 'ReadStatus', 'Groups', 'UserGroups', 'Templates'],
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
    getRegistrationGroups: builder.query({
      query: () => ({ url: '/auth/groups', method: 'get' }),
      keepUnusedDataFor: 60,
    }),
    getNotifications: builder.query({
      query: (params = {}) => ({ 
        url: params.my ? '/notifications/my' : '/notifications', 
        method: 'get',
        params: { 
          page: params.page, 
          limit: params.limit 
        }
      }),
      providesTags: ['Notifications'],
      keepUnusedDataFor: 5,
    }),
    getNotification: builder.query({
      query: (id) => ({ url: `/notifications/${id}`, method: 'get' }),
      providesTags: (result, error, id) => [{ type: 'Notifications', id }],
      keepUnusedDataFor: 5,
    }),
    searchNotifications: builder.query({
      query: (params) => {
        if (typeof params === 'string') {
          // For backward compatibility
          return { 
            url: `/notifications/search`, 
            method: 'get',
            params: { query: params }
          };
        }
        return { 
          url: `/notifications/search`, 
          method: 'get',
          params: { 
            query: params.query,
            page: params.page,
            limit: params.limit
          }
        };
      },
      keepUnusedDataFor: 0, // Don't cache search results
    }),
    addNotification: builder.mutation({
      query: (notification) => ({ url: '/notifications', method: 'post', data: notification }),
      async onQueryStarted(notification, { dispatch, queryFulfilled }) {
        try {
          // Wait for the notification creation to complete
          const { data: createdNotification } = await queryFulfilled;
          
          // Automatically mark as read for the program manager who created it
          if (createdNotification?.id) {
            dispatch(
              api.endpoints.markAsRead.initiate(createdNotification.id)
            );
          }
        } catch (error) {
          // Log the error for troubleshooting, but don't disrupt user experience
          // Error will be handled by the component that called the mutation
          console.error('Error auto-marking notification as read:', error);
        }
      },
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
    // Fetch read status for a specific notification with user information
    getNotificationReadStatus: builder.query({
      query: (notificationId) => ({ url: `/notifications/${notificationId}/read-status`, method: 'get' }),
      providesTags: (result, error, id) => [{ type: 'ReadStatus', id }],
    }),
    // Template endpoints
    getTemplates: builder.query({
      query: () => ({ url: '/templates', method: 'get' }),
      providesTags: ['Templates'],
      keepUnusedDataFor: 60,
    }),
    getTemplateById: builder.query({
      query: (id) => ({ url: `/templates/${id}`, method: 'get' }),
      providesTags: (result, error, id) => [{ type: 'Templates', id }],
      keepUnusedDataFor: 60,
    }),
    createTemplate: builder.mutation({
      query: (template) => ({ url: '/templates', method: 'post', data: template }),
      invalidatesTags: ['Templates'],
    }),
    updateTemplate: builder.mutation({
      query: ({ id, ...template }) => ({ url: `/templates/${id}`, method: 'put', data: template }),
      invalidatesTags: ['Templates'],
    }),
    deleteTemplate: builder.mutation({
      query: (id) => ({ url: `/templates/${id}`, method: 'delete' }),
      invalidatesTags: ['Templates'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetRegistrationGroupsQuery,
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useSearchNotificationsQuery,
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
  useGetNotificationReadStatusQuery,
  useGetTemplatesQuery,
  useGetTemplateByIdQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} = api; 