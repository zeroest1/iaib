// Mock for the API service
const mockLoginMutation = jest.fn().mockReturnValue([
  jest.fn().mockReturnValue({
    unwrap: () => Promise.resolve({ token: 'fake-token' })
  }),
  { isLoading: false }
]);

const mockRegisterMutation = jest.fn().mockReturnValue([
  jest.fn().mockReturnValue({
    unwrap: () => Promise.resolve({ user: { id: 1 } })
  }),
  { isLoading: false }
]);

const mockGetMeQuery = jest.fn().mockReturnValue({
  data: { id: 1, name: 'Test User', email: 'test@example.com', role: 'tudeng' },
  isLoading: false,
  refetch: jest.fn()
});

const mockGetRegistrationGroupsQuery = jest.fn().mockReturnValue({
  data: [
    { id: 1, name: 'Group 1', description: 'First group' },
    { id: 2, name: 'Group 2', description: 'Second group' }
  ],
  isLoading: false
});

const mockMarkAsReadMutation = jest.fn().mockReturnValue([
  jest.fn().mockReturnValue({
    unwrap: () => Promise.resolve({ success: true })
  }),
  { isLoading: false }
]);

const mockAddFavoriteMutation = jest.fn().mockReturnValue([
  jest.fn().mockReturnValue({
    unwrap: () => Promise.resolve({ success: true })
  }),
  { isLoading: false }
]);

const mockRemoveFavoriteMutation = jest.fn().mockReturnValue([
  jest.fn().mockReturnValue({
    unwrap: () => Promise.resolve({ success: true })
  }),
  { isLoading: false }
]);

const mockDeleteNotificationMutation = jest.fn().mockReturnValue([
  jest.fn().mockReturnValue({
    unwrap: () => Promise.resolve({ success: true })
  }),
  { isLoading: false }
]);

const mockGetNotificationsQuery = jest.fn().mockReturnValue({
  data: [
    { id: 1, title: 'Test Notification 1', content: 'Content 1', priority: 'high', category: 'exam', created_at: '2023-05-15T10:30:45.000Z' },
    { id: 2, title: 'Test Notification 2', content: 'Content 2', priority: 'medium', category: 'general', created_at: '2023-05-16T10:30:45.000Z' }
  ],
  isLoading: false,
  refetch: jest.fn()
});

const mockGetNotificationReadStatusQuery = jest.fn().mockReturnValue({
  data: [
    { notification_id: 1, read: false },
    { notification_id: 2, read: true }
  ],
  isLoading: false,
  refetch: jest.fn()
});

const mockGetNotificationFavoritesQuery = jest.fn().mockReturnValue({
  data: [
    { notification_id: 1 }
  ],
  isLoading: false,
  refetch: jest.fn()
});

module.exports = {
  useLoginMutation: mockLoginMutation,
  useRegisterMutation: mockRegisterMutation,
  useGetMeQuery: mockGetMeQuery,
  useGetRegistrationGroupsQuery: mockGetRegistrationGroupsQuery,
  useMarkAsReadMutation: mockMarkAsReadMutation,
  useAddFavoriteMutation: mockAddFavoriteMutation,
  useRemoveFavoriteMutation: mockRemoveFavoriteMutation,
  useDeleteNotificationMutation: mockDeleteNotificationMutation,
  useGetNotificationsQuery: mockGetNotificationsQuery,
  useGetNotificationReadStatusQuery: mockGetNotificationReadStatusQuery,
  useGetNotificationFavoritesQuery: mockGetNotificationFavoritesQuery
}; 