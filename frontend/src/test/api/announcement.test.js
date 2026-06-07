import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '../../api/announcement';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('announcement API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAnnouncements', () => {
    it('should call GET /announcements with params', async () => {
      const params = { page: 1 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getAnnouncements(params);
      expect(request.get).toHaveBeenCalledWith('/announcements', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('createAnnouncement', () => {
    it('should call POST /announcements with data', async () => {
      const data = { title: 'Notice', content: 'Hello' };
      request.post.mockResolvedValue({ data: { id: 1 } });
      const result = await createAnnouncement(data);
      expect(request.post).toHaveBeenCalledWith('/announcements', data);
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('deleteAnnouncement', () => {
    it('should call DELETE /announcements/{id}', async () => {
      request.delete.mockResolvedValue({ data: { success: true } });
      const result = await deleteAnnouncement(1);
      expect(request.delete).toHaveBeenCalledWith('/announcements/1');
      expect(result.data).toEqual({ success: true });
    });
  });
});
