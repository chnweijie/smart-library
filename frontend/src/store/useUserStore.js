import { create } from 'zustand';
import * as userApi from '../api/user';
import * as uploadApi from '../api/upload';
import { useAuthStore } from './useAuthStore';
import { notifyError } from '../utils/notify';

export const useUserStore = create((set, get) => ({
  users: [],

  fetchUsers: async (params = {}) => {
    try {
      const res = await userApi.getAllUsers({ page: 1, size: 100, ...params });
      set({ users: res.data.list || [] });
    } catch (e) {
      notifyError(e, '加载用户列表失败');
    }
  },

  toggleUserStatus: async (id) => {
    try {
      await userApi.toggleUserStatus(id);
      get().fetchUsers();
      return 'admin.updateSuccess';
    } catch (e) {
      throw e;
    }
  },

  registerFace: async (userId, faceFeature) => {
    try {
      await userApi.registerFace(faceFeature);
      return true;
    } catch (e) {
      throw e;
    }
  },

  unregisterFace: async (userId) => {
    try {
      await userApi.unregisterFace();
      return true;
    } catch (e) {
      throw e;
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      await userApi.changePassword(oldPassword, newPassword);
      return true;
    } catch (e) {
      throw e;
    }
  },

  updateUserProfile: async (data) => {
    try {
      await userApi.updateUserProfile(data);
      const res = await userApi.getUserProfile();
      const user = useAuthStore.getState().currentUser;
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      useAuthStore.setState({ currentUser: updatedUser });
      return 'admin.updateSuccess';
    } catch (e) {
      throw e;
    }
  },

  updateAvatar: async (avatarUrl) => {
    try {
      await uploadApi.updateAvatarUrl(avatarUrl);
      const res = await userApi.getUserProfile();
      const user = useAuthStore.getState().currentUser;
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      useAuthStore.setState({ currentUser: updatedUser });
      return 'upload.success';
    } catch (e) {
      throw e;
    }
  },

  reset: () => {
    set({ users: [] });
  },
}));
