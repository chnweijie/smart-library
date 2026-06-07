import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordEmotion, getEmotionHistory, getEmotionRecommend } from '../../api/emotion';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('emotion API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordEmotion', () => {
    it('should call POST /emotion/record with data', async () => {
      const data = { emotion: 'happy', score: 0.9 };
      request.post.mockResolvedValue({ data: { success: true } });
      const result = await recordEmotion(data);
      expect(request.post).toHaveBeenCalledWith('/emotion/record', data);
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('getEmotionHistory', () => {
    it('should call GET /emotion/history with params', async () => {
      const params = { page: 1, limit: 10 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getEmotionHistory(params);
      expect(request.get).toHaveBeenCalledWith('/emotion/history', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('getEmotionRecommend', () => {
    it('should call GET /emotion/recommend with emotion param', async () => {
      request.get.mockResolvedValue({ data: { books: [] } });
      const result = await getEmotionRecommend('happy');
      expect(request.get).toHaveBeenCalledWith('/emotion/recommend', {
        params: { emotion: 'happy' },
      });
      expect(result.data).toEqual({ books: [] });
    });
  });
});
