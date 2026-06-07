import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, register, faceLogin, refreshToken } from '../../api/auth';

vi.mock('../../api/request', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import request from '../../api/request';

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call POST /auth/login with username and password', async () => {
      request.post.mockResolvedValue({ data: { token: 'abc' } });
      const result = await login('testuser', 'testpass');
      expect(request.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'testpass',
      });
      expect(result.data).toEqual({ token: 'abc' });
    });
  });

  describe('register', () => {
    it('should call POST /auth/register with data', async () => {
      const data = { username: 'newuser', password: 'pass123', email: 'a@b.com' };
      request.post.mockResolvedValue({ data: { success: true } });
      const result = await register(data);
      expect(request.post).toHaveBeenCalledWith('/auth/register', data);
      expect(result.data).toEqual({ success: true });
    });
  });

  describe('faceLogin', () => {
    it('should call POST /auth/face-login with array faceFeature', async () => {
      const feature = [0.1, 0.2, 0.3];
      request.post.mockResolvedValue({ data: { token: 'abc' } });
      await faceLogin(feature);
      expect(request.post).toHaveBeenCalledWith('/auth/face-login', {
        faceFeature: feature,
      });
    });

    it('should parse string faceFeature to array', async () => {
      const feature = '[0.1, 0.2, 0.3]';
      request.post.mockResolvedValue({ data: { token: 'abc' } });
      await faceLogin(feature);
      expect(request.post).toHaveBeenCalledWith('/auth/face-login', {
        faceFeature: [0.1, 0.2, 0.3],
      });
    });

    it('should pass faceFeature as-is if not array or string', async () => {
      const feature = { data: [0.1, 0.2] };
      request.post.mockResolvedValue({ data: { token: 'abc' } });
      await faceLogin(feature);
      expect(request.post).toHaveBeenCalledWith('/auth/face-login', {
        faceFeature: feature,
      });
    });
  });

  describe('refreshToken', () => {
    it('should call POST /auth/refresh with refreshToken', async () => {
      request.post.mockResolvedValue({ data: { token: 'newtoken' } });
      const result = await refreshToken('old-refresh-token');
      expect(request.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(result.data).toEqual({ token: 'newtoken' });
    });
  });
});
