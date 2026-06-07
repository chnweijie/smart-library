import { create } from 'zustand';
import * as notificationApi from '../api/notification';
import { notifyError } from '../utils/notify';

const DEFAULT_SETTINGS = { borrowDueReminder: true, reservationArrivalReminder: true, systemAnnouncements: true };

const loadSettings = () => {
  const saved = localStorage.getItem('notifSettings');
  return saved ? JSON.parse(saved) : { ...DEFAULT_SETTINGS };
};

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  notifSettings: loadSettings(),

  updateNotifSetting: (key, value) => {
    const next = { ...get().notifSettings, [key]: value };
    set({ notifSettings: next });
    localStorage.setItem('notifSettings', JSON.stringify(next));
  },

  fetchNotifications: async (params = {}) => {
    try {
      const res = await notificationApi.getNotifications({ page: 1, size: 100, ...params });
      set({ notifications: res.data.list || [] });
    } catch (e) {
      notifyError(e, '加载通知失败');
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      set({ unreadCount: res.data || 0 });
    } catch (e) {
      notifyError(e, '获取未读数量失败');
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      get().fetchNotifications();
      get().fetchUnreadCount();
    } catch (e) {
      notifyError(e, '标记已读失败');
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      get().fetchNotifications();
      get().fetchUnreadCount();
      return 'notification.markAllReadSuccess';
    } catch (e) {
      notifyError(e, '全部标记已读失败');
    }
  },

  reset: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
