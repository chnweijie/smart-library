import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBooks,
  getBookDetail,
  createBook,
  updateBook,
  deleteBook,
  getSimilarBooks,
} from '../../api/books';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('books API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBooks', () => {
    it('should call GET /books with params', async () => {
      const params = { page: 1, limit: 10 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getBooks(params);
      expect(request.get).toHaveBeenCalledWith('/books', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('getBookDetail', () => {
    it('should call GET /books/{id}', async () => {
      request.get.mockResolvedValue({ data: { id: 1, title: 'Book' } });
      const result = await getBookDetail(1);
      expect(request.get).toHaveBeenCalledWith('/books/1');
      expect(result.data).toEqual({ id: 1, title: 'Book' });
    });
  });

  describe('createBook', () => {
    it('should call POST /books with data', async () => {
      const data = { title: 'New Book', author: 'Author' };
      request.post.mockResolvedValue({ data: { id: 2 } });
      const result = await createBook(data);
      expect(request.post).toHaveBeenCalledWith('/books', data);
      expect(result.data).toEqual({ id: 2 });
    });
  });

  describe('updateBook', () => {
    it('should call PUT /books/{id} with data', async () => {
      const data = { title: 'Updated' };
      request.put.mockResolvedValue({ data: { id: 1 } });
      const result = await updateBook(1, data);
      expect(request.put).toHaveBeenCalledWith('/books/1', data);
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('deleteBook', () => {
    it('should call DELETE /books/{id}', async () => {
      request.delete.mockResolvedValue({ data: { success: true } });
      const result = await deleteBook(1);
      expect(request.delete).toHaveBeenCalledWith('/books/1');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('getSimilarBooks', () => {
    it('should call GET /books/{id}/similar', async () => {
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getSimilarBooks(1);
      expect(request.get).toHaveBeenCalledWith('/books/1/similar');
      expect(result.data).toEqual({ items: [] });
    });
  });
});
