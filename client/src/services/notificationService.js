import api, { unwrap } from '../utils/axiosInstance';

export const notificationService = {
  getNotifications: (params) => unwrap(api.get('/notifications', { params })),
  getUnreadCount: () => unwrap(api.get('/notifications/unread-count')),
  markAsRead: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllAsRead: () => unwrap(api.patch('/notifications/read-all')),
  deleteNotification: (id) => unwrap(api.delete(`/notifications/${id}`)),
};
