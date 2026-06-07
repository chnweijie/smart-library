import { create } from 'zustand';
import * as emotionApi from '../api/emotion';

export const useEmotionStore = create((set, get) => ({
  currentEmotionRecordId: null,
  setCurrentEmotionRecordId: (id) => set({ currentEmotionRecordId: id }),
  clearEmotionRecordId: () => set({ currentEmotionRecordId: null }),

  fetchEmotionRecommend: async (emotion) => {
    try {
      const res = await emotionApi.getEmotionRecommend(emotion);
      return res.data || [];
    } catch (e) {
      return [];
    }
  },
  recordEmotion: async (data) => {
    try {
      const res = await emotionApi.recordEmotion(data);
      return res.data;
    } catch (e) {
      return null;
    }
  },
  updateEmotionBookId: async (recordId, bookId) => {
    try {
      const res = await emotionApi.updateEmotionBookId(recordId, bookId);
      return res.data;
    } catch (e) {
      return null;
    }
  },
}));
