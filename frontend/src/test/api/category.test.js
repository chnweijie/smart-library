import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/category';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('category API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should call GET /categories', async () => {
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getCategories();
      expect(request.get).toHaveBeenCalledWith('/categories');
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('createCategory', () => {
    it('should call POST /categories with data', async () => {
      const data = { name: 'Fiction' };
      request.post.mockResolvedValue({ data: { id: 1 } });
      const result = await createCategory(data);
      expect(request.post).toHaveBeenCalledWith('/categories', data);
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('updateCategory', () => {
    it('should call PUT /categories/{id} with data', async () => {
      const data = { name: 'Science' };
      request.put.mockResolvedValue({ data: { id: 1 } });
      const result = await updateCategory(1, data);
      expect(request.put).toHaveBeenCalledWith('/categories/1', data);
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('deleteCategory', () => {
    it('should call DELETE /categories/{id}', async () => {
      request.delete.mockResolvedValue({ data: { success: true } });
      const result = await deleteCategory(1);
      expect(request.delete).toHaveBeenCalledWith('/categories/1');
      expect(result.data).toEqual({ success: true });
    });
  });
});
