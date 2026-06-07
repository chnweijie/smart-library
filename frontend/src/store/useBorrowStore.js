import { create } from 'zustand';
import * as borrowApi from '../api/borrow';
import * as reservationApi from '../api/reservation';
import { notifyError } from '../utils/notify';

export const useBorrowStore = create((set, get) => ({
  borrows: [],
  borrowHistory: [],
  reservations: [],
  reviewRequests: [],

  fetchCurrentBorrows: async () => {
    try {
      const res = await borrowApi.getCurrentBorrows({ page: 1, size: 100 });
      set({ borrows: res.data.list || [] });
    } catch (e) {
      notifyError(e, '加载借阅列表失败');
    }
  },

  borrowBook: async (bookId) => {
    try {
      await borrowApi.borrowBook(bookId);
      get().fetchCurrentBorrows();
      return 'book.borrowSuccess';
    } catch (e) {
      throw e;
    }
  },

  applyReturn: async (id) => {
    try {
      await borrowApi.applyReturn(id);
      get().fetchCurrentBorrows();
      return 'borrow.applyReturnSuccess';
    } catch (e) {
      throw e;
    }
  },

  cancelReturn: async (id) => {
    try {
      await borrowApi.cancelReturn(id);
      get().fetchCurrentBorrows();
      return 'borrow.cancelReturnSuccess';
    } catch (e) {
      throw e;
    }
  },

  fetchBorrowHistory: async () => {
    try {
      const res = await borrowApi.getBorrowHistory({ page: 1, size: 100 });
      set({ borrowHistory: res.data.list || [] });
    } catch (e) {
      notifyError(e, '加载借阅历史失败');
    }
  },

  fetchReservations: async () => {
    try {
      const res = await reservationApi.getReservations({ page: 1, size: 100 });
      set({ reservations: res.data.list || [] });
    } catch (e) {
      notifyError(e, '加载预约列表失败');
    }
  },

  reserveBook: async (bookId) => {
    try {
      await reservationApi.reserveBook(bookId);
      get().fetchReservations();
      return 'reservation.reserveSuccess';
    } catch (e) {
      throw e;
    }
  },

  cancelReservation: async (id) => {
    try {
      await reservationApi.cancelReservation(id);
      get().fetchReservations();
      return 'reservation.cancelSuccess';
    } catch (e) {
      throw e;
    }
  },

  fetchReviewRequests: async () => {
    try {
      const res = await borrowApi.getPendingReturns({ page: 1, size: 100 });
      set({ reviewRequests: res.data.list || [] });
    } catch (e) {
      notifyError(e, '加载审批列表失败');
    }
  },

  approveReturn: async (id) => {
    try {
      await borrowApi.approveReturn(id);
      get().fetchReviewRequests();
      return 'admin.approved';
    } catch (e) {
      throw e;
    }
  },

  rejectReturn: async (id, reason) => {
    try {
      await borrowApi.rejectReturn(id, reason);
      get().fetchReviewRequests();
      return 'admin.rejected';
    } catch (e) {
      throw e;
    }
  },

  reset: () => {
    set({ borrows: [], borrowHistory: [], reservations: [], reviewRequests: [] });
  },
}));
