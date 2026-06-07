import { create } from 'zustand';
import * as reviewApi from '../api/review';
import { notifyError } from '../utils/notify';

export const useReviewStore = create((set, get) => ({
  reviews: [],
  pendingReviews: [],

  fetchBookReviews: async (bookId, params = {}) => {
    try {
      const res = await reviewApi.getBookReviews(bookId, { page: 1, size: 100, ...params });
      set({ reviews: res.data.list || [] });
    } catch (e) {
      notifyError(e, '加载评论失败');
    }
  },

  addReview: async (review) => {
    try {
      await reviewApi.createReview(review);
      if (review.bookId) get().fetchBookReviews(review.bookId);
      return 'review.submitSuccess';
    } catch (e) {
      throw e;
    }
  },

  updateReview: async (id, updates) => {
    try {
      await reviewApi.updateReview(id, updates);
    } catch (e) {
      throw e;
    }
  },

  deleteReview: async (id) => {
    try {
      await reviewApi.deleteReview(id);
      return 'admin.deleteSuccess';
    } catch (e) {
      throw e;
    }
  },

  approveReview: async (id) => {
    try {
      await reviewApi.approveReview(id);
      return 'admin.approved';
    } catch (e) {
      throw e;
    }
  },

  rejectReview: async (id) => {
    try {
      await reviewApi.rejectReview(id);
      return 'admin.rejected';
    } catch (e) {
      throw e;
    }
  },

  voteHelpful: async (reviewId) => {
    try {
      const res = await reviewApi.voteReview(reviewId);
      return res.data ? 'review.voteSuccess' : 'review.unvoteSuccess';
    } catch (e) {
      return 'auth.loginToVote';
    }
  },

  addReviewComment: async (reviewId, comment, replyToUserId) => {
    try {
      await reviewApi.replyReview(reviewId, comment, replyToUserId);
      return 'review.commentSuccess';
    } catch (e) {
      return 'auth.loginToReview';
    }
  },

  fetchPendingReviews: async () => {
    try {
      const res = await reviewApi.getPendingReviews({ page: 1, size: 100 });
      set({ pendingReviews: res.data.list || [] });
    } catch (e) {
      notifyError(e, '加载待审核评论失败');
    }
  },

  reset: () => {
    set({ reviews: [], pendingReviews: [] });
  },
}));
