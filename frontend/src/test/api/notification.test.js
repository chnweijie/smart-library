import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../../api/notification';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('notification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should call GET /notifications with params', async () => {
      const params = { page: 1, limit: 10 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getNotifications(params);
      expect(request.get).toHaveBeenCalledWith('/notifications', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('getUnreadCount', () => {
    it('should call GET /notifications/unread-count', async () => {
      request.get.mockResolvedValue({ data: { count: 5 } });
      const result = await getUnreadCount();
      expect(request.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result.data).toEqual({ count: 5 });
    });
  });

  describe('markAsRead', () => {
    it('should call PUT /notifications/{id}/read', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await markAsRead(1);
      expect(request.put).toHaveBeenCalledWith('/notifications/1/read');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('markAllAsRead', () => {
    it('should call PUT /notifications/read-all', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await markAllAsRead();
      expect(request.put).toHaveBeenCalledWith('/notifications/read-all');
      expect(result.data).toEqual({ success: true });
    });
  });
});
