import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleFavorite, getFavorites, checkFavorite } from '../../api/favorite';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('favorite API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleFavorite', () => {
    it('should call POST /favorites/{bookId}', async () => {
      request.post.mockResolvedValue({ data: { isFavorite: true } });
      const result = await toggleFavorite(5);
      expect(request.post).toHaveBeenCalledWith('/favorites/5');
      expect(result.data).toEqual({ isFavorite: true });
    });
  });

  describe('getFavorites', () => {
    it('should call GET /favorites with params', async () => {
      const params = { page: 1, limit: 10 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getFavorites(params);
      expect(request.get).toHaveBeenCalledWith('/favorites', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('checkFavorite', () => {
    it('should call GET /favorites/{bookId}/check', async () => {
      request.get.mockResolvedValue({ data: { isFavorite: false } });
      const result = await checkFavorite(5);
      expect(request.get).toHaveBeenCalledWith('/favorites/5/check');
      expect(result.data).toEqual({ isFavorite: false });
    });
  });
});
