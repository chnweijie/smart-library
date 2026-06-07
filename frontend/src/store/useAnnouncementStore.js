import { create } from 'zustand';
import * as announcementApi from '../api/announcement';
import { notifyError } from '../utils/notify';

export const useAnnouncementStore = create((set, get) => ({
  announcements: [],

  fetchAnnouncements: async () => {
    try {
      const res = await announcementApi.getAnnouncements({ page: 1, size: 100 });
      set({ announcements: res.data.list || [] });
    } catch (e) {
      notifyError(e, '加载公告失败');
    }
  },

  addAnnouncement: async (data) => {
    try {
      await announcementApi.createAnnouncement(data);
      get().fetchAnnouncements();
      return 'admin.addSuccess';
    } catch (e) {
      throw e;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      await announcementApi.deleteAnnouncement(id);
      get().fetchAnnouncements();
      return 'admin.deleteSuccess';
    } catch (e) {
      throw e;
    }
  },

  reset: () => {
    set({ announcements: [] });
  },
}));
