import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  reserveBook,
  cancelReservation,
  getReservations,
} from '../../api/reservation';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('reservation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reserveBook', () => {
    it('should call POST /reservations with bookId', async () => {
      request.post.mockResolvedValue({ data: { id: 1 } });
      const result = await reserveBook(5);
      expect(request.post).toHaveBeenCalledWith('/reservations', { bookId: 5 });
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('cancelReservation', () => {
    it('should call DELETE /reservations/{id}', async () => {
      request.delete.mockResolvedValue({ data: { success: true } });
      const result = await cancelReservation(1);
      expect(request.delete).toHaveBeenCalledWith('/reservations/1');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('getReservations', () => {
    it('should call GET /reservations with params', async () => {
      const params = { page: 1 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getReservations(params);
      expect(request.get).toHaveBeenCalledWith('/reservations', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });
});
