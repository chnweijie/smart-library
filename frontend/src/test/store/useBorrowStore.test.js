import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBorrowStore } from '../../store/useBorrowStore';

// Mock APIs
vi.mock('../../api/borrow', () => ({
  getCurrentBorrows: vi.fn(),
  borrowBook: vi.fn(),
  applyReturn: vi.fn(),
  cancelReturn: vi.fn(),
  getBorrowHistory: vi.fn(),
  getPendingReturns: vi.fn(),
  approveReturn: vi.fn(),
  rejectReturn: vi.fn(),
}));

vi.mock('../../api/reservation', () => ({
  getReservations: vi.fn(),
  reserveBook: vi.fn(),
  cancelReservation: vi.fn(),
}));

import * as borrowApi from '../../api/borrow';
import * as reservationApi from '../../api/reservation';

describe('useBorrowStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBorrowStore.setState({
      borrows: [],
      borrowHistory: [],
      reservations: [],
      reviewRequests: [],
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useBorrowStore.getState();
      expect(state.borrows).toEqual([]);
      expect(state.borrowHistory).toEqual([]);
      expect(state.reservations).toEqual([]);
      expect(state.reviewRequests).toEqual([]);
    });
  });

  describe('fetchCurrentBorrows', () => {
    it('should fetch and set borrows', async () => {
      const mockBorrows = [
        { id: 1, bookId: 10, status: 'borrowed' },
        { id: 2, bookId: 20, status: 'borrowed' },
      ];
      borrowApi.getCurrentBorrows.mockResolvedValue({ data: { list: mockBorrows } });

      await useBorrowStore.getState().fetchCurrentBorrows();

      expect(useBorrowStore.getState().borrows).toEqual(mockBorrows);
      expect(borrowApi.getCurrentBorrows).toHaveBeenCalledWith({ page: 1, size: 100 });
    });

    it('should handle empty response', async () => {
      borrowApi.getCurrentBorrows.mockResolvedValue({ data: {} });

      await useBorrowStore.getState().fetchCurrentBorrows();

      expect(useBorrowStore.getState().borrows).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      borrowApi.getCurrentBorrows.mockRejectedValue(new Error('Network error'));

      await useBorrowStore.getState().fetchCurrentBorrows();

      expect(useBorrowStore.getState().borrows).toEqual([]);
    });
  });

  describe('borrowBook', () => {
    it('should borrow a book and refresh borrows', async () => {
      borrowApi.borrowBook.mockResolvedValue({});
      borrowApi.getCurrentBorrows.mockResolvedValue({ data: { list: [] } });

      const result = await useBorrowStore.getState().borrowBook(5);

      expect(borrowApi.borrowBook).toHaveBeenCalledWith(5);
      expect(result).toBe('book.borrowSuccess');
      expect(borrowApi.getCurrentBorrows).toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      borrowApi.borrowBook.mockRejectedValue(new Error('Already borrowed'));

      await expect(useBorrowStore.getState().borrowBook(5)).rejects.toThrow('Already borrowed');
    });
  });

  describe('applyReturn', () => {
    it('should apply return and refresh borrows', async () => {
      borrowApi.applyReturn.mockResolvedValue({});
      borrowApi.getCurrentBorrows.mockResolvedValue({ data: { list: [] } });

      const result = await useBorrowStore.getState().applyReturn(1);

      expect(borrowApi.applyReturn).toHaveBeenCalledWith(1);
      expect(result).toBe('borrow.applyReturnSuccess');
    });

    it('should throw on error', async () => {
      borrowApi.applyReturn.mockRejectedValue(new Error('Cannot return'));

      await expect(useBorrowStore.getState().applyReturn(1)).rejects.toThrow('Cannot return');
    });
  });

  describe('cancelReturn', () => {
    it('should cancel return and refresh borrows', async () => {
      borrowApi.cancelReturn.mockResolvedValue({});
      borrowApi.getCurrentBorrows.mockResolvedValue({ data: { list: [] } });

      const result = await useBorrowStore.getState().cancelReturn(1);

      expect(borrowApi.cancelReturn).toHaveBeenCalledWith(1);
      expect(result).toBe('borrow.cancelReturnSuccess');
    });

    it('should throw on error', async () => {
      borrowApi.cancelReturn.mockRejectedValue(new Error('Fail'));

      await expect(useBorrowStore.getState().cancelReturn(1)).rejects.toThrow('Fail');
    });
  });

  describe('fetchBorrowHistory', () => {
    it('should fetch and set borrow history', async () => {
      const mockHistory = [
        { id: 1, bookId: 10, status: 'returned' },
      ];
      borrowApi.getBorrowHistory.mockResolvedValue({ data: { list: mockHistory } });

      await useBorrowStore.getState().fetchBorrowHistory();

      expect(useBorrowStore.getState().borrowHistory).toEqual(mockHistory);
    });

    it('should handle empty response', async () => {
      borrowApi.getBorrowHistory.mockResolvedValue({ data: {} });

      await useBorrowStore.getState().fetchBorrowHistory();

      expect(useBorrowStore.getState().borrowHistory).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      borrowApi.getBorrowHistory.mockRejectedValue(new Error('Error'));

      await useBorrowStore.getState().fetchBorrowHistory();

      expect(useBorrowStore.getState().borrowHistory).toEqual([]);
    });
  });

  describe('fetchReservations', () => {
    it('should fetch and set reservations', async () => {
      const mockReservations = [
        { id: 1, bookId: 10, status: 'pending' },
      ];
      reservationApi.getReservations.mockResolvedValue({ data: { list: mockReservations } });

      await useBorrowStore.getState().fetchReservations();

      expect(useBorrowStore.getState().reservations).toEqual(mockReservations);
    });

    it('should handle empty response', async () => {
      reservationApi.getReservations.mockResolvedValue({ data: {} });

      await useBorrowStore.getState().fetchReservations();

      expect(useBorrowStore.getState().reservations).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      reservationApi.getReservations.mockRejectedValue(new Error('Error'));

      await useBorrowStore.getState().fetchReservations();

      expect(useBorrowStore.getState().reservations).toEqual([]);
    });
  });

  describe('reserveBook', () => {
    it('should reserve a book and refresh reservations', async () => {
      reservationApi.reserveBook.mockResolvedValue({});
      reservationApi.getReservations.mockResolvedValue({ data: { list: [] } });

      const result = await useBorrowStore.getState().reserveBook(5);

      expect(reservationApi.reserveBook).toHaveBeenCalledWith(5);
      expect(result).toBe('reservation.reserveSuccess');
    });

    it('should throw on error', async () => {
      reservationApi.reserveBook.mockRejectedValue(new Error('Already reserved'));

      await expect(useBorrowStore.getState().reserveBook(5)).rejects.toThrow('Already reserved');
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation and refresh', async () => {
      reservationApi.cancelReservation.mockResolvedValue({});
      reservationApi.getReservations.mockResolvedValue({ data: { list: [] } });

      const result = await useBorrowStore.getState().cancelReservation(1);

      expect(reservationApi.cancelReservation).toHaveBeenCalledWith(1);
      expect(result).toBe('reservation.cancelSuccess');
    });

    it('should throw on error', async () => {
      reservationApi.cancelReservation.mockRejectedValue(new Error('Fail'));

      await expect(useBorrowStore.getState().cancelReservation(1)).rejects.toThrow('Fail');
    });
  });

  describe('fetchReviewRequests', () => {
    it('should fetch and set review requests', async () => {
      const mockRequests = [
        { id: 1, bookId: 10, status: 'pending_review' },
      ];
      borrowApi.getPendingReturns.mockResolvedValue({ data: { list: mockRequests } });

      await useBorrowStore.getState().fetchReviewRequests();

      expect(useBorrowStore.getState().reviewRequests).toEqual(mockRequests);
    });

    it('should handle empty response', async () => {
      borrowApi.getPendingReturns.mockResolvedValue({ data: {} });

      await useBorrowStore.getState().fetchReviewRequests();

      expect(useBorrowStore.getState().reviewRequests).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      borrowApi.getPendingReturns.mockRejectedValue(new Error('Error'));

      await useBorrowStore.getState().fetchReviewRequests();

      expect(useBorrowStore.getState().reviewRequests).toEqual([]);
    });
  });

  describe('approveReturn', () => {
    it('should approve return and refresh review requests', async () => {
      borrowApi.approveReturn.mockResolvedValue({});
      borrowApi.getPendingReturns.mockResolvedValue({ data: { list: [] } });

      const result = await useBorrowStore.getState().approveReturn(1);

      expect(borrowApi.approveReturn).toHaveBeenCalledWith(1);
      expect(result).toBe('admin.approved');
    });

    it('should throw on error', async () => {
      borrowApi.approveReturn.mockRejectedValue(new Error('Fail'));

      await expect(useBorrowStore.getState().approveReturn(1)).rejects.toThrow('Fail');
    });
  });

  describe('rejectReturn', () => {
    it('should reject return with reason and refresh review requests', async () => {
      borrowApi.rejectReturn.mockResolvedValue({});
      borrowApi.getPendingReturns.mockResolvedValue({ data: { list: [] } });

      const result = await useBorrowStore.getState().rejectReturn(1, 'Damaged book');

      expect(borrowApi.rejectReturn).toHaveBeenCalledWith(1, 'Damaged book');
      expect(result).toBe('admin.rejected');
    });

    it('should throw on error', async () => {
      borrowApi.rejectReturn.mockRejectedValue(new Error('Fail'));

      await expect(useBorrowStore.getState().rejectReturn(1, 'reason')).rejects.toThrow('Fail');
    });
  });
});
