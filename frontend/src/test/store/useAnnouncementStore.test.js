import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAnnouncementStore } from '../../store/useAnnouncementStore';

// Mock announcement API
vi.mock('../../api/announcement', () => ({
  getAnnouncements: vi.fn(),
  createAnnouncement: vi.fn(),
  deleteAnnouncement: vi.fn(),
}));

import * as announcementApi from '../../api/announcement';

describe('useAnnouncementStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnnouncementStore.setState({ announcements: [] });
  });

  describe('initial state', () => {
    it('should have empty announcements array', () => {
      expect(useAnnouncementStore.getState().announcements).toEqual([]);
    });
  });

  describe('fetchAnnouncements', () => {
    it('should fetch and set announcements', async () => {
      const mockAnnouncements = [
        { id: 1, title: 'System Maintenance', content: 'Scheduled maintenance' },
        { id: 2, title: 'New Books', content: 'Check out new arrivals' },
      ];
      announcementApi.getAnnouncements.mockResolvedValue({ data: { list: mockAnnouncements } });

      await useAnnouncementStore.getState().fetchAnnouncements();

      expect(useAnnouncementStore.getState().announcements).toEqual(mockAnnouncements);
      expect(announcementApi.getAnnouncements).toHaveBeenCalledWith({ page: 1, size: 100 });
    });

    it('should handle empty response', async () => {
      announcementApi.getAnnouncements.mockResolvedValue({ data: {} });

      await useAnnouncementStore.getState().fetchAnnouncements();

      expect(useAnnouncementStore.getState().announcements).toEqual([]);
    });

    it('should handle null data', async () => {
      announcementApi.getAnnouncements.mockResolvedValue({ data: { list: null } });

      await useAnnouncementStore.getState().fetchAnnouncements();

      expect(useAnnouncementStore.getState().announcements).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      announcementApi.getAnnouncements.mockRejectedValue(new Error('Network error'));

      await useAnnouncementStore.getState().fetchAnnouncements();

      expect(useAnnouncementStore.getState().announcements).toEqual([]);
    });
  });

  describe('addAnnouncement', () => {
    it('should add an announcement and refresh the list', async () => {
      const data = { title: 'New Announcement', content: 'Content here' };
      announcementApi.createAnnouncement.mockResolvedValue({});
      announcementApi.getAnnouncements.mockResolvedValue({ data: { list: [] } });

      const result = await useAnnouncementStore.getState().addAnnouncement(data);

      expect(announcementApi.createAnnouncement).toHaveBeenCalledWith(data);
      expect(result).toBe('admin.addSuccess');
      expect(announcementApi.getAnnouncements).toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      announcementApi.createAnnouncement.mockRejectedValue(new Error('Create failed'));

      await expect(useAnnouncementStore.getState().addAnnouncement({})).rejects.toThrow('Create failed');
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete an announcement and refresh the list', async () => {
      announcementApi.deleteAnnouncement.mockResolvedValue({});
      announcementApi.getAnnouncements.mockResolvedValue({ data: { list: [] } });

      const result = await useAnnouncementStore.getState().deleteAnnouncement(1);

      expect(announcementApi.deleteAnnouncement).toHaveBeenCalledWith(1);
      expect(result).toBe('admin.deleteSuccess');
      expect(announcementApi.getAnnouncements).toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      announcementApi.deleteAnnouncement.mockRejectedValue(new Error('Delete failed'));

      await expect(useAnnouncementStore.getState().deleteAnnouncement(1)).rejects.toThrow('Delete failed');
    });
  });
});
