import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createReview,
  updateReview,
  deleteReview,
  getBookReviews,
  voteReview,
  replyReview,
  getPendingReviews,
  approveReview,
  rejectReview,
} from '../../api/review';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('review API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    it('should call POST /reviews with data', async () => {
      const data = { bookId: 1, content: 'Great book', rating: 5 };
      request.post.mockResolvedValue({ data: { id: 1 } });
      const result = await createReview(data);
      expect(request.post).toHaveBeenCalledWith('/reviews', data);
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('updateReview', () => {
    it('should call PUT /reviews/{id} with data', async () => {
      const data = { content: 'Updated review' };
      request.put.mockResolvedValue({ data: { id: 1 } });
      const result = await updateReview(1, data);
      expect(request.put).toHaveBeenCalledWith('/reviews/1', data);
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('deleteReview', () => {
    it('should call DELETE /reviews/{id}', async () => {
      request.delete.mockResolvedValue({ data: { success: true } });
      const result = await deleteReview(1);
      expect(request.delete).toHaveBeenCalledWith('/reviews/1');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('getBookReviews', () => {
    it('should call GET /reviews/book/{bookId} with params', async () => {
      const params = { page: 1 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getBookReviews(5, params);
      expect(request.get).toHaveBeenCalledWith('/reviews/book/5', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('voteReview', () => {
    it('should call POST /reviews/{id}/vote', async () => {
      request.post.mockResolvedValue({ data: { success: true } });
      const result = await voteReview(1);
      expect(request.post).toHaveBeenCalledWith('/reviews/1/vote');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('replyReview', () => {
    it('should call POST /reviews/{id}/reply with content and replyToUserId', async () => {
      request.post.mockResolvedValue({ data: { id: 10 } });
      const result = await replyReview(1, 'Nice review', 5);
      expect(request.post).toHaveBeenCalledWith('/reviews/1/reply', {
        content: 'Nice review',
        replyToUserId: 5,
      });
      expect(result.data).toEqual({ id: 10 });
    });
  });

  describe('getPendingReviews', () => {
    it('should call GET /reviews/pending with params', async () => {
      const params = { page: 1 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getPendingReviews(params);
      expect(request.get).toHaveBeenCalledWith('/reviews/pending', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('approveReview', () => {
    it('should call PUT /reviews/{id}/approve', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await approveReview(1);
      expect(request.put).toHaveBeenCalledWith('/reviews/1/approve');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('rejectReview', () => {
    it('should call PUT /reviews/{id}/reject', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await rejectReview(1);
      expect(request.put).toHaveBeenCalledWith('/reviews/1/reject');
      expect(result.data).toEqual({ success: true });
    });
  });
});
