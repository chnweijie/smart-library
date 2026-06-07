import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  registerFace,
  unregisterFace,
  getUserStats,
  getAllUsers,
  toggleUserStatus,
  createUser,
  updateUser,
  deleteUser,
} from '../../api/user';

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('user API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should call GET /users/me', async () => {
      request.get.mockResolvedValue({ data: { id: 1, username: 'test' } });
      const result = await getUserProfile();
      expect(request.get).toHaveBeenCalledWith('/users/me');
      expect(result.data).toEqual({ id: 1, username: 'test' });
    });
  });

  describe('updateUserProfile', () => {
    it('should call PUT /users/me with data', async () => {
      const data = { email: 'new@email.com' };
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await updateUserProfile(data);
      expect(request.put).toHaveBeenCalledWith('/users/me', data);
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('changePassword', () => {
    it('should call PUT /users/me/password with oldPassword and newPassword', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await changePassword('oldPass', 'newPass');
      expect(request.put).toHaveBeenCalledWith('/users/me/password', {
        oldPassword: 'oldPass',
        newPassword: 'newPass',
      });
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('registerFace', () => {
    it('should call POST /users/me/face with array faceFeature', async () => {
      const feature = [0.1, 0.2, 0.3];
      request.post.mockResolvedValue({ data: { success: true } });
      await registerFace(feature);
      expect(request.post).toHaveBeenCalledWith('/users/me/face', {
        faceFeature: feature,
      });
    });

    it('should parse string faceFeature to array', async () => {
      const feature = '[0.1, 0.2, 0.3]';
      request.post.mockResolvedValue({ data: { success: true } });
      await registerFace(feature);
      expect(request.post).toHaveBeenCalledWith('/users/me/face', {
        faceFeature: [0.1, 0.2, 0.3],
      });
    });

    it('should pass faceFeature as-is if not array or string', async () => {
      const feature = { data: [0.1, 0.2] };
      request.post.mockResolvedValue({ data: { success: true } });
      await registerFace(feature);
      expect(request.post).toHaveBeenCalledWith('/users/me/face', {
        faceFeature: feature,
      });
    });
  });

  describe('unregisterFace', () => {
    it('should call DELETE /users/me/face', async () => {
      request.delete.mockResolvedValue({ data: { success: true } });
      const result = await unregisterFace();
      expect(request.delete).toHaveBeenCalledWith('/users/me/face');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('getUserStats', () => {
    it('should call GET /users/me/stats', async () => {
      request.get.mockResolvedValue({ data: { totalBorrows: 10 } });
      const result = await getUserStats();
      expect(request.get).toHaveBeenCalledWith('/users/me/stats');
      expect(result.data).toEqual({ totalBorrows: 10 });
    });
  });

  describe('getAllUsers', () => {
    it('should call GET /users with params', async () => {
      const params = { page: 1 };
      request.get.mockResolvedValue({ data: { items: [] } });
      const result = await getAllUsers(params);
      expect(request.get).toHaveBeenCalledWith('/users', { params });
      expect(result.data).toEqual({ items: [] });
    });
  });

  describe('toggleUserStatus', () => {
    it('should call PUT /users/{id}/status', async () => {
      request.put.mockResolvedValue({ data: { success: true } });
      const result = await toggleUserStatus(1);
      expect(request.put).toHaveBeenCalledWith('/users/1/status');
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('createUser', () => {
    it('should call POST /users with data', async () => {
      const data = { username: 'newuser', password: 'pass' };
      request.post.mockResolvedValue({ data: { id: 2 } });
      const result = await createUser(data);
      expect(request.post).toHaveBeenCalledWith('/users', data);
      expect(result.data).toEqual({ id: 2 });
    });
  });

  describe('updateUser', () => {
    it('should call PUT /users/{id} with data', async () => {
      const data = { email: 'updated@email.com' };
      request.put.mockResolvedValue({ data: { id: 1 } });
      const result = await updateUser(1, data);
      expect(request.put).toHaveBeenCalledWith('/users/1', data);
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('deleteUser', () => {
    it('should call DELETE /users/{id}', async () => {
      request.delete.mockResolvedValue({ data: { success: true } });
      const result = await deleteUser(1);
      expect(request.delete).toHaveBeenCalledWith('/users/1');
      expect(result.data).toEqual({ success: true });
    });
  });
});
