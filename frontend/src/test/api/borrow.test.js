import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  borrowBook,
  applyReturn,
  cancelReturn,
  getCurrentBorrows,
  getBorrowHistory,
  getPendingReturns,
  approveReturn,
  rejectReturn,
} from '../../api/borrow';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('borrow API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('borrowBook', () => {
    it('should call POST /borrows with bookId', async () => {
      request.post.mockResolvedValue({ data: { id: 1 } });
      const result = await borrowBook(5);
      expect(request.post).toHaveBeenCalledWith('/borrows', { bookId: 5 });
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('applyReturn', () => {
    it('should call PUT /borrows/{id}/return', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await applyReturn(1);
      expect(request.put).toHaveBeenCalledWith('/borrows/1/return');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('cancelReturn', () => {
    it('should call PUT /borrows/{id}/cancel-return', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await cancelReturn(1);
      expect(request.put).toHaveBeenCalledWith('/borrows/1/cancel-return');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('getCurrentBorrows', () => {
    it('should call GET /borrows/current with params', async () => {
      const params = { page: 1 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getCurrentBorrows(params);
      expect(request.get).toHaveBeenCalledWith('/borrows/current', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('getBorrowHistory', () => {
    it('should call GET /borrows/history with params', async () => {
      const params = { page: 1 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getBorrowHistory(params);
      expect(request.get).toHaveBeenCalledWith('/borrows/history', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('getPendingReturns', () => {
    it('should call GET /borrows/pending with params', async () => {
      const params = { page: 1 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getPendingReturns(params);
      expect(request.get).toHaveBeenCalledWith('/borrows/pending', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('approveReturn', () => {
    it('should call PUT /borrows/{id}/approve', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await approveReturn(1);
      expect(request.put).toHaveBeenCalledWith('/borrows/1/approve');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('rejectReturn', () => {
    it('should call PUT /borrows/{id}/reject with reason', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await rejectReturn(1, 'Book is damaged');
      expect(request.put).toHaveBeenCalledWith('/borrows/1/reject', {
        reason: 'Book is damaged',
      });
      expect(result.data).toEqual({ success: true });
    });
  });
});
