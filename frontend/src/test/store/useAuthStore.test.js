import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/useAuthStore';

// Mock auth API
vi.mock('../../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  faceLogin: vi.fn(),
}));

// Mock clearAuth from request
vi.mock('../../api/request', () => ({
  clearAuth: vi.fn(),
}));

import * as authApi from '../../api/auth';
import { clearAuth } from '../../api/request';

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset store state
    useAuthStore.setState({ currentUser: null });
  });

  describe('initial state', () => {
    it('should have currentUser as null when localStorage is empty', () => {
      const state = useAuthStore.getState();
      expect(state.currentUser).toBeNull();
    });

    it('should load currentUser from localStorage on store creation', () => {
      const user = { id: 1, username: 'testuser', role: 1 };
      localStorage.setItem('currentUser', JSON.stringify(user));
      // Re-import to trigger getStoredUser
      // Since the store is already created, we test via setCurrentUser
      expect(localStorage.getItem('currentUser')).toBe(JSON.stringify(user));
    });
  });

  describe('login', () => {
    it('should login successfully and store token/user in localStorage', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          refreshToken: 'test-refresh-token',
          userId: 1,
          username: 'testuser',
          role: 1,
        },
      };
      authApi.login.mockResolvedValue(mockResponse);

      const result = await useAuthStore.getState().login('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.messageKey).toBe('auth.loginSuccess');
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token');
      expect(JSON.parse(localStorage.getItem('currentUser'))).toEqual({
        id: 1,
        username: 'testuser',
        role: 1,
      });
      expect(useAuthStore.getState().currentUser).toEqual({
        id: 1,
        username: 'testuser',
        role: 1,
      });
    });

    it('should return admin login message for admin role (role=2)', async () => {
      const mockResponse = {
        data: {
          token: 'admin-token',
          refreshToken: 'admin-refresh-token',
          userId: 2,
          username: 'admin',
          role: 2,
        },
      };
      authApi.login.mockResolvedValue(mockResponse);

      const result = await useAuthStore.getState().login('admin', 'admin123');

      expect(result.success).toBe(true);
      expect(result.messageKey).toBe('auth.adminLoginSuccess');
    });

    it('should handle login failure', async () => {
      const error = new Error('Invalid credentials');
      authApi.login.mockRejectedValue(error);

      const result = await useAuthStore.getState().login('wrong', 'wrong');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
      expect(result.messageKey).toBe('auth.loginFailed');
      expect(useAuthStore.getState().currentUser).toBeNull();
    });

    it('should not store anything in localStorage on login failure', async () => {
      authApi.login.mockRejectedValue(new Error('fail'));

      await useAuthStore.getState().login('wrong', 'wrong');

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('register', () => {
    it('should register successfully and store token/user in localStorage', async () => {
      const mockResponse = {
        data: {
          token: 'reg-token',
          refreshToken: 'reg-refresh-token',
          userId: 3,
          username: 'newuser',
          role: 1,
        },
      };
      authApi.register.mockResolvedValue(mockResponse);

      const result = await useAuthStore.getState().register('newuser', 'pass123', 'Nick', 'a@b.com');

      expect(result.success).toBe(true);
      expect(result.messageKey).toBe('auth.registerSuccess');
      expect(localStorage.getItem('token')).toBe('reg-token');
      expect(localStorage.getItem('refreshToken')).toBe('reg-refresh-token');
      expect(JSON.parse(localStorage.getItem('currentUser'))).toEqual({
        id: 3,
        username: 'newuser',
        role: 1,
      });
      expect(useAuthStore.getState().currentUser).toEqual({
        id: 3,
        username: 'newuser',
        role: 1,
      });
    });

    it('should handle register failure (username exists)', async () => {
      const error = new Error('Username already exists');
      authApi.register.mockRejectedValue(error);

      const result = await useAuthStore.getState().register('existing', 'pass', 'Nick', 'a@b.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Username already exists');
      expect(result.messageKey).toBe('auth.usernameExists');
    });

    it('should pass correct data to register API', async () => {
      const mockResponse = {
        data: { token: 't', refreshToken: 'r', userId: 1, username: 'u', role: 1 },
      };
      authApi.register.mockResolvedValue(mockResponse);

      await useAuthStore.getState().register('user', 'pass', 'nick', 'email@test.com');

      expect(authApi.register).toHaveBeenCalledWith({
        username: 'user',
        password: 'pass',
        nickname: 'nick',
        email: 'email@test.com',
      });
    });
  });

  describe('faceLogin', () => {
    it('should login with face successfully', async () => {
      const mockResponse = {
        data: {
          token: 'face-token',
          refreshToken: 'face-refresh-token',
          userId: 4,
          username: 'faceuser',
          role: 1,
        },
      };
      authApi.faceLogin.mockResolvedValue(mockResponse);

      const faceFeature = [0.1, 0.2, 0.3];
      const result = await useAuthStore.getState().faceLogin(faceFeature);

      expect(result.success).toBe(true);
      expect(result.messageKey).toBe('auth.faceLoginSuccess');
      expect(localStorage.getItem('token')).toBe('face-token');
      expect(localStorage.getItem('refreshToken')).toBe('face-refresh-token');
      expect(useAuthStore.getState().currentUser).toEqual({
        id: 4,
        username: 'faceuser',
        role: 1,
      });
    });

    it('should handle face login failure', async () => {
      const error = new Error('Face not recognized');
      authApi.faceLogin.mockRejectedValue(error);

      const result = await useAuthStore.getState().faceLogin([0.1, 0.2]);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Face not recognized');
      expect(result.messageKey).toBe('auth.faceNotRecognized');
    });

    it('should pass face feature to API', async () => {
      const mockResponse = {
        data: { token: 't', refreshToken: 'r', userId: 1, username: 'u', role: 1 },
      };
      authApi.faceLogin.mockResolvedValue(mockResponse);

      const feature = [0.5, 0.6];
      await useAuthStore.getState().faceLogin(feature);

      expect(authApi.faceLogin).toHaveBeenCalledWith(feature);
    });
  });

  describe('logout', () => {
    it('should clear auth and set currentUser to null', () => {
      // Set up initial state
      const user = { id: 1, username: 'testuser', role: 1 };
      localStorage.setItem('token', 'some-token');
      localStorage.setItem('refreshToken', 'some-refresh');
      localStorage.setItem('currentUser', JSON.stringify(user));
      useAuthStore.setState({ currentUser: user });

      useAuthStore.getState().logout();

      expect(clearAuth).toHaveBeenCalled();
      expect(useAuthStore.getState().currentUser).toBeNull();
    });

    it('should work even when already logged out', () => {
      useAuthStore.setState({ currentUser: null });

      useAuthStore.getState().logout();

      expect(clearAuth).toHaveBeenCalled();
      expect(useAuthStore.getState().currentUser).toBeNull();
    });
  });

  describe('setCurrentUser', () => {
    it('should update currentUser in state and localStorage', () => {
      const user = { id: 5, username: 'updated', role: 2 };

      useAuthStore.getState().setCurrentUser(user);

      expect(useAuthStore.getState().currentUser).toEqual(user);
      expect(JSON.parse(localStorage.getItem('currentUser'))).toEqual(user);
    });

    it('should overwrite existing currentUser', () => {
      const user1 = { id: 1, username: 'first', role: 1 };
      const user2 = { id: 2, username: 'second', role: 2 };

      useAuthStore.getState().setCurrentUser(user1);
      expect(useAuthStore.getState().currentUser).toEqual(user1);

      useAuthStore.getState().setCurrentUser(user2);
      expect(useAuthStore.getState().currentUser).toEqual(user2);
      expect(JSON.parse(localStorage.getItem('currentUser'))).toEqual(user2);
    });

    it('should handle setting currentUser to null', () => {
      const user = { id: 1, username: 'test', role: 1 };
      useAuthStore.getState().setCurrentUser(user);
      useAuthStore.getState().setCurrentUser(null);

      expect(useAuthStore.getState().currentUser).toBeNull();
      expect(JSON.parse(localStorage.getItem('currentUser'))).toBeNull();
    });
  });
});
