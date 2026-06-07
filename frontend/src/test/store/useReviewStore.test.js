import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReviewStore } from '../../store/useReviewStore';

// Mock review API
vi.mock('../../api/review', () => ({
  getBookReviews: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
  approveReview: vi.fn(),
  rejectReview: vi.fn(),
  voteReview: vi.fn(),
  replyReview: vi.fn(),
  getPendingReviews: vi.fn(),
}));

import * as reviewApi from '../../api/review';

describe('useReviewStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useReviewStore.setState({
      reviews: [],
      pendingReviews: [],
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useReviewStore.getState();
      expect(state.reviews).toEqual([]);
      expect(state.pendingReviews).toEqual([]);
    });
  });

  describe('fetchBookReviews', () => {
    it('should fetch and set reviews for a book', async () => {
      const mockReviews = [
        { id: 1, content: 'Great book', rating: 5 },
        { id: 2, content: 'Good read', rating: 4 },
      ];
      reviewApi.getBookReviews.mockResolvedValue({ data: { list: mockReviews } });

      await useReviewStore.getState().fetchBookReviews(10);

      expect(useReviewStore.getState().reviews).toEqual(mockReviews);
      expect(reviewApi.getBookReviews).toHaveBeenCalledWith(10, { page: 1, size: 100 });
    });

    it('should pass custom params', async () => {
      reviewApi.getBookReviews.mockResolvedValue({ data: { list: [] } });

      await useReviewStore.getState().fetchBookReviews(10, { page: 2, size: 50 });

      expect(reviewApi.getBookReviews).toHaveBeenCalledWith(10, { page: 2, size: 50 });
    });

    it('should handle empty response', async () => {
      reviewApi.getBookReviews.mockResolvedValue({ data: {} });

      await useReviewStore.getState().fetchBookReviews(10);

      expect(useReviewStore.getState().reviews).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      reviewApi.getBookReviews.mockRejectedValue(new Error('Error'));

      await useReviewStore.getState().fetchBookReviews(10);

      expect(useReviewStore.getState().reviews).toEqual([]);
    });
  });

  describe('addReview', () => {
    it('should add a review and refresh book reviews', async () => {
      reviewApi.createReview.mockResolvedValue({});
      reviewApi.getBookReviews.mockResolvedValue({ data: { list: [] } });

      const result = await useReviewStore.getState().addReview({ bookId: 10, content: 'Nice', rating: 4 });

      expect(reviewApi.createReview).toHaveBeenCalledWith({ bookId: 10, content: 'Nice', rating: 4 });
      expect(result).toBe('review.submitSuccess');
      expect(reviewApi.getBookReviews).toHaveBeenCalled();
    });

    it('should not refresh reviews when bookId is missing', async () => {
      reviewApi.createReview.mockResolvedValue({});

      const result = await useReviewStore.getState().addReview({ content: 'Nice', rating: 4 });

      expect(result).toBe('review.submitSuccess');
      expect(reviewApi.getBookReviews).not.toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      reviewApi.createReview.mockRejectedValue(new Error('Create failed'));

      await expect(useReviewStore.getState().addReview({ bookId: 10 })).rejects.toThrow('Create failed');
    });
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      reviewApi.updateReview.mockResolvedValue({});

      await useReviewStore.getState().updateReview(1, { content: 'Updated review' });

      expect(reviewApi.updateReview).toHaveBeenCalledWith(1, { content: 'Updated review' });
    });

    it('should throw on error', async () => {
      reviewApi.updateReview.mockRejectedValue(new Error('Update failed'));

      await expect(useReviewStore.getState().updateReview(1, {})).rejects.toThrow('Update failed');
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      reviewApi.deleteReview.mockResolvedValue({});

      const result = await useReviewStore.getState().deleteReview(1);

      expect(reviewApi.deleteReview).toHaveBeenCalledWith(1);
      expect(result).toBe('admin.deleteSuccess');
    });

    it('should throw on error', async () => {
      reviewApi.deleteReview.mockRejectedValue(new Error('Delete failed'));

      await expect(useReviewStore.getState().deleteReview(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('approveReview', () => {
    it('should approve a review', async () => {
      reviewApi.approveReview.mockResolvedValue({});

      const result = await useReviewStore.getState().approveReview(1);

      expect(reviewApi.approveReview).toHaveBeenCalledWith(1);
      expect(result).toBe('admin.approved');
    });

    it('should throw on error', async () => {
      reviewApi.approveReview.mockRejectedValue(new Error('Fail'));

      await expect(useReviewStore.getState().approveReview(1)).rejects.toThrow('Fail');
    });
  });

  describe('rejectReview', () => {
    it('should reject a review', async () => {
      reviewApi.rejectReview.mockResolvedValue({});

      const result = await useReviewStore.getState().rejectReview(1);

      expect(reviewApi.rejectReview).toHaveBeenCalledWith(1);
      expect(result).toBe('admin.rejected');
    });

    it('should throw on error', async () => {
      reviewApi.rejectReview.mockRejectedValue(new Error('Fail'));

      await expect(useReviewStore.getState().rejectReview(1)).rejects.toThrow('Fail');
    });
  });

  describe('voteHelpful', () => {
    it('should return vote success when voted', async () => {
      reviewApi.voteReview.mockResolvedValue({ data: true });

      const result = await useReviewStore.getState().voteHelpful(1);

      expect(result).toBe('review.voteSuccess');
    });

    it('should return unvote success when unvoted', async () => {
      reviewApi.voteReview.mockResolvedValue({ data: false });

      const result = await useReviewStore.getState().voteHelpful(1);

      expect(result).toBe('review.unvoteSuccess');
    });

    it('should return login message on error', async () => {
      reviewApi.voteReview.mockRejectedValue(new Error('Not logged in'));

      const result = await useReviewStore.getState().voteHelpful(1);

      expect(result).toBe('auth.loginToVote');
    });
  });

  describe('addReviewComment', () => {
    it('should add a comment to a review', async () => {
      reviewApi.replyReview.mockResolvedValue({});

      const result = await useReviewStore.getState().addReviewComment(1, 'Great point', 5);

      expect(reviewApi.replyReview).toHaveBeenCalledWith(1, 'Great point', 5);
      expect(result).toBe('review.commentSuccess');
    });

    it('should add a comment without replyToUserId', async () => {
      reviewApi.replyReview.mockResolvedValue({});

      const result = await useReviewStore.getState().addReviewComment(1, 'Comment');

      expect(reviewApi.replyReview).toHaveBeenCalledWith(1, 'Comment', undefined);
      expect(result).toBe('review.commentSuccess');
    });

    it('should return login message on error', async () => {
      reviewApi.replyReview.mockRejectedValue(new Error('Not logged in'));

      const result = await useReviewStore.getState().addReviewComment(1, 'Comment');

      expect(result).toBe('auth.loginToReview');
    });
  });

  describe('fetchPendingReviews', () => {
    it('should fetch and set pending reviews', async () => {
      const mockPending = [
        { id: 1, content: 'Pending review', status: 'pending' },
      ];
      reviewApi.getPendingReviews.mockResolvedValue({ data: { list: mockPending } });

      await useReviewStore.getState().fetchPendingReviews();

      expect(useReviewStore.getState().pendingReviews).toEqual(mockPending);
      expect(reviewApi.getPendingReviews).toHaveBeenCalledWith({ page: 1, size: 100 });
    });

    it('should handle empty response', async () => {
      reviewApi.getPendingReviews.mockResolvedValue({ data: {} });

      await useReviewStore.getState().fetchPendingReviews();

      expect(useReviewStore.getState().pendingReviews).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      reviewApi.getPendingReviews.mockRejectedValue(new Error('Error'));

      await useReviewStore.getState().fetchPendingReviews();

      expect(useReviewStore.getState().pendingReviews).toEqual([]);
    });
  });
});
