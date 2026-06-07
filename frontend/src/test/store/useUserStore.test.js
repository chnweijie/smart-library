import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';

// Mock user API
vi.mock('../../api/user', () => ({
  getAllUsers: vi.fn(),
  toggleUserStatus: vi.fn(),
  registerFace: vi.fn(),
  unregisterFace: vi.fn(),
  changePassword: vi.fn(),
  updateUserProfile: vi.fn(),
  getUserProfile: vi.fn(),
}));

// Mock upload API
vi.mock('../../api/upload', () => ({
  updateAvatarUrl: vi.fn(),
}));

import * as userApi from '../../api/user';
import * as uploadApi from '../../api/upload';

describe('useUserStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useUserStore.setState({ users: [] });
    useAuthStore.setState({ currentUser: null });
  });

  describe('initial state', () => {
    it('should have empty users array', () => {
      expect(useUserStore.getState().users).toEqual([]);
    });
  });

  describe('fetchUsers', () => {
    it('should fetch and set users', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', role: 1 },
        { id: 2, username: 'admin', role: 2 },
      ];
      userApi.getAllUsers.mockResolvedValue({ data: { list: mockUsers } });

      await useUserStore.getState().fetchUsers();

      expect(useUserStore.getState().users).toEqual(mockUsers);
      expect(userApi.getAllUsers).toHaveBeenCalledWith({ page: 1, size: 100 });
    });

    it('should pass custom params', async () => {
      userApi.getAllUsers.mockResolvedValue({ data: { list: [] } });

      await useUserStore.getState().fetchUsers({ keyword: 'test' });

      expect(userApi.getAllUsers).toHaveBeenCalledWith({ page: 1, size: 100, keyword: 'test' });
    });

    it('should handle empty response', async () => {
      userApi.getAllUsers.mockResolvedValue({ data: {} });

      await useUserStore.getState().fetchUsers();

      expect(useUserStore.getState().users).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      userApi.getAllUsers.mockRejectedValue(new Error('Network error'));

      await useUserStore.getState().fetchUsers();

      expect(useUserStore.getState().users).toEqual([]);
    });
  });

  describe('toggleUserStatus', () => {
    it('should toggle user status and refresh users', async () => {
      userApi.toggleUserStatus.mockResolvedValue({});
      userApi.getAllUsers.mockResolvedValue({ data: { list: [] } });

      const result = await useUserStore.getState().toggleUserStatus(1);

      expect(userApi.toggleUserStatus).toHaveBeenCalledWith(1);
      expect(result).toBe('admin.updateSuccess');
      expect(userApi.getAllUsers).toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      userApi.toggleUserStatus.mockRejectedValue(new Error('Fail'));

      await expect(useUserStore.getState().toggleUserStatus(1)).rejects.toThrow('Fail');
    });
  });

  describe('registerFace', () => {
    it('should register face successfully', async () => {
      userApi.registerFace.mockResolvedValue({});

      const result = await useUserStore.getState().registerFace(1, [0.1, 0.2, 0.3]);

      expect(userApi.registerFace).toHaveBeenCalledWith([0.1, 0.2, 0.3]);
      expect(result).toBe(true);
    });

    it('should throw on error', async () => {
      userApi.registerFace.mockRejectedValue(new Error('Face registration failed'));

      await expect(useUserStore.getState().registerFace(1, [0.1])).rejects.toThrow('Face registration failed');
    });
  });

  describe('unregisterFace', () => {
    it('should unregister face successfully', async () => {
      userApi.unregisterFace.mockResolvedValue({});

      const result = await useUserStore.getState().unregisterFace(1);

      expect(userApi.unregisterFace).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw on error', async () => {
      userApi.unregisterFace.mockRejectedValue(new Error('Fail'));

      await expect(useUserStore.getState().unregisterFace(1)).rejects.toThrow('Fail');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      userApi.changePassword.mockResolvedValue({});

      const result = await useUserStore.getState().changePassword('oldPass', 'newPass');

      expect(userApi.changePassword).toHaveBeenCalledWith('oldPass', 'newPass');
      expect(result).toBe(true);
    });

    it('should throw on error', async () => {
      userApi.changePassword.mockRejectedValue(new Error('Wrong old password'));

      await expect(useUserStore.getState().changePassword('wrong', 'new')).rejects.toThrow('Wrong old password');
    });
  });

  describe('updateUserProfile', () => {
    it('should update profile and sync with authStore', async () => {
      const currentUser = { id: 1, username: 'testuser', role: 1 };
      useAuthStore.setState({ currentUser });
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      const profileData = { nickname: 'New Nick' };
      const updatedProfile = { id: 1, username: 'testuser', role: 1, nickname: 'New Nick', avatar: 'url' };

      userApi.updateUserProfile.mockResolvedValue({});
      userApi.getUserProfile.mockResolvedValue({ data: updatedProfile });

      const result = await useUserStore.getState().updateUserProfile(profileData);

      expect(userApi.updateUserProfile).toHaveBeenCalledWith(profileData);
      expect(userApi.getUserProfile).toHaveBeenCalled();
      expect(result).toBe('admin.updateSuccess');

      // Check authStore sync
      const authUser = useAuthStore.getState().currentUser;
      expect(authUser.nickname).toBe('New Nick');
      expect(authUser.avatar).toBe('url');

      // Check localStorage sync
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      expect(storedUser.nickname).toBe('New Nick');
      expect(storedUser.avatar).toBe('url');
    });

    it('should merge profile data with existing currentUser', async () => {
      const currentUser = { id: 1, username: 'testuser', role: 1, email: 'old@test.com' };
      useAuthStore.setState({ currentUser });

      userApi.updateUserProfile.mockResolvedValue({});
      userApi.getUserProfile.mockResolvedValue({
        data: { email: 'new@test.com' },
      });

      await useUserStore.getState().updateUserProfile({ email: 'new@test.com' });

      const authUser = useAuthStore.getState().currentUser;
      expect(authUser.id).toBe(1);
      expect(authUser.username).toBe('testuser');
      expect(authUser.email).toBe('new@test.com');
    });

    it('should throw on error', async () => {
      userApi.updateUserProfile.mockRejectedValue(new Error('Update failed'));

      await expect(useUserStore.getState().updateUserProfile({})).rejects.toThrow('Update failed');
    });

    it('should throw when getUserProfile fails after successful update', async () => {
      userApi.updateUserProfile.mockResolvedValue({});
      userApi.getUserProfile.mockRejectedValue(new Error('Profile fetch failed'));

      await expect(useUserStore.getState().updateUserProfile({})).rejects.toThrow('Profile fetch failed');
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar and sync with authStore', async () => {
      const currentUser = { id: 1, username: 'testuser', role: 1 };
      useAuthStore.setState({ currentUser });
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      const avatarUrl = 'http://example.com/avatar.jpg';
      const updatedProfile = { id: 1, username: 'testuser', role: 1, avatar: avatarUrl };

      uploadApi.updateAvatarUrl.mockResolvedValue({});
      userApi.getUserProfile.mockResolvedValue({ data: updatedProfile });

      const result = await useUserStore.getState().updateAvatar(avatarUrl);

      expect(uploadApi.updateAvatarUrl).toHaveBeenCalledWith(avatarUrl);
      expect(userApi.getUserProfile).toHaveBeenCalled();
      expect(result).toBe('upload.success');

      // Check authStore sync
      expect(useAuthStore.getState().currentUser.avatar).toBe(avatarUrl);

      // Check localStorage sync
      expect(JSON.parse(localStorage.getItem('currentUser')).avatar).toBe(avatarUrl);
    });

    it('should throw on error', async () => {
      uploadApi.updateAvatarUrl.mockRejectedValue(new Error('Upload failed'));

      await expect(useUserStore.getState().updateAvatar('url')).rejects.toThrow('Upload failed');
    });

    it('should throw when getUserProfile fails after successful avatar update', async () => {
      uploadApi.updateAvatarUrl.mockResolvedValue({});
      userApi.getUserProfile.mockRejectedValue(new Error('Profile fetch failed'));

      await expect(useUserStore.getState().updateAvatar('url')).rejects.toThrow('Profile fetch failed');
    });
  });
});
