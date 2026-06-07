import { create } from 'zustand';
import * as authApi from '../api/auth';
import * as userApi from '../api/user';
import { clearAuth } from '../api/request';

function getStoredUser() {
  try {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return null;
    const user = JSON.parse(stored);
    if (!user || typeof user !== 'object' || !user.id) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return null;
    }
    return user;
  } catch {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return null;
  }
}

export const useAuthStore = create((set) => ({
  currentUser: getStoredUser(),

  login: async (username, password) => {
    try {
      const res = await authApi.login(username, password);
      const { token, refreshToken, userId, username: uname, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      let user = { id: userId, username: uname, role };
      try {
        const profileRes = await userApi.getUserProfile();
        user = { ...user, ...profileRes.data };
      } catch {}
      localStorage.setItem('currentUser', JSON.stringify(user));
      set({ currentUser: user });
      return { success: true, messageKey: role === 2 ? 'auth.adminLoginSuccess' : 'auth.loginSuccess' };
    } catch (e) {
      return { success: false, message: e.message, messageKey: 'auth.loginFailed' };
    }
  },

  register: async (username, password, nickname, email) => {
    try {
      const res = await authApi.register({ username, password, nickname, email });
      const { token, refreshToken, userId, username: uname, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      let user = { id: userId, username: uname, role };
      try {
        const profileRes = await userApi.getUserProfile();
        user = { ...user, ...profileRes.data };
      } catch {}
      localStorage.setItem('currentUser', JSON.stringify(user));
      set({ currentUser: user });
      return { success: true, messageKey: 'auth.registerSuccess' };
    } catch (e) {
      return { success: false, message: e.message, messageKey: 'auth.usernameExists' };
    }
  },

  faceLogin: async (faceFeature, faceFeatures) => {
    try {
      const res = await authApi.faceLogin(faceFeature, faceFeatures);
      const { token, refreshToken, userId, username, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      let user = { id: userId, username, role };
      try {
        const profileRes = await userApi.getUserProfile();
        user = { ...user, ...profileRes.data };
      } catch {}
      localStorage.setItem('currentUser', JSON.stringify(user));
      set({ currentUser: user });
      return { success: true, messageKey: 'auth.faceLoginSuccess' };
    } catch (e) {
      return { success: false, message: e.message, messageKey: 'auth.faceNotRecognized' };
    }
  },

  logout: () => {
    clearAuth();
    set({ currentUser: null });
  },

  reset: () => {
    clearAuth();
    set({ currentUser: null });
  },

  setCurrentUser: (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    set({ currentUser: user });
  },
}));
