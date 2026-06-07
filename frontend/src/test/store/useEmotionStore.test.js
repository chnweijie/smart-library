import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEmotionStore } from '../../store/useEmotionStore';

// Mock emotion API
vi.mock('../../api/emotion', () => ({
  getEmotionRecommend: vi.fn(),
}));

import * as emotionApi from '../../api/emotion';

describe('useEmotionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have no state properties except fetchEmotionRecommend', () => {
      const state = useEmotionStore.getState();
      expect(typeof state.fetchEmotionRecommend).toBe('function');
    });
  });

  describe('fetchEmotionRecommend', () => {
    it('should return recommended books for an emotion', async () => {
      const mockBooks = [
        { id: 1, title: 'Happy Book 1' },
        { id: 2, title: 'Happy Book 2' },
      ];
      emotionApi.getEmotionRecommend.mockResolvedValue({ data: mockBooks });

      const result = await useEmotionStore.getState().fetchEmotionRecommend('happy');

      expect(result).toEqual(mockBooks);
      expect(emotionApi.getEmotionRecommend).toHaveBeenCalledWith('happy');
    });

    it('should return empty array when data is null', async () => {
      emotionApi.getEmotionRecommend.mockResolvedValue({ data: null });

      const result = await useEmotionStore.getState().fetchEmotionRecommend('sad');

      expect(result).toEqual([]);
    });

    it('should return empty array when data is undefined', async () => {
      emotionApi.getEmotionRecommend.mockResolvedValue({});

      const result = await useEmotionStore.getState().fetchEmotionRecommend('angry');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      emotionApi.getEmotionRecommend.mockRejectedValue(new Error('Network error'));

      const result = await useEmotionStore.getState().fetchEmotionRecommend('anxious');

      expect(result).toEqual([]);
    });

    it('should pass different emotion values', async () => {
      emotionApi.getEmotionRecommend.mockResolvedValue({ data: [] });

      await useEmotionStore.getState().fetchEmotionRecommend('excited');

      expect(emotionApi.getEmotionRecommend).toHaveBeenCalledWith('excited');
    });
  });
});
