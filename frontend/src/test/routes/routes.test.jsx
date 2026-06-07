import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  routeConfig,
  getKeyFromPath,
  getPathFromKey,
  ADMIN_KEYS,
  AuthGuard,
  AdminGuard,
} from '../../routes';
import { useAuthStore } from '../../store/useAuthStore';

// ─── routeConfig 测试 ────────────────────────────────────────────────
describe('routeConfig', () => {
  it('包含 12 条路由', () => {
    expect(routeConfig).toHaveLength(12);
  });

  it('每条路由都有 path、key、element', () => {
    routeConfig.forEach((route) => {
      expect(route).toHaveProperty('path');
      expect(route).toHaveProperty('key');
      expect(route).toHaveProperty('element');
      expect(route.path).toBeTruthy();
      expect(route.key).toBeTruthy();
      expect(route.element).toBeTruthy();
    });
  });

  it('auth 标志正确：需要登录的路由 auth=true', () => {
    const authRoutes = routeConfig.filter((r) => r.auth);
    const authPaths = authRoutes.map((r) => r.path);
    expect(authPaths).toContain('/borrow');
    expect(authPaths).toContain('/history');
    expect(authPaths).toContain('/reservation');
    expect(authPaths).toContain('/notifications');
    expect(authPaths).toContain('/profile');
    expect(authPaths).toContain('/emotion');
  });

  it('admin 标志正确：管理员路由 admin=true', () => {
    const adminRoutes = routeConfig.filter((r) => r.admin);
    const adminPaths = adminRoutes.map((r) => r.path);
    expect(adminPaths).toContain('/admin/users');
    expect(adminPaths).toContain('/admin/books');
    expect(adminPaths).toContain('/admin/returns');
    expect(adminPaths).toContain('/admin/comments');
    expect(adminPaths).toContain('/admin/announcements');
  });

  it('首页路由没有 auth 和 admin 标志', () => {
    const home = routeConfig.find((r) => r.path === '/');
    expect(home.auth).toBeFalsy();
    expect(home.admin).toBeFalsy();
  });
});

// ─── getKeyFromPath 测试 ─────────────────────────────────────────────
describe('getKeyFromPath', () => {
  it('已知路径返回正确的 key', () => {
    expect(getKeyFromPath('/')).toBe('home');
    expect(getKeyFromPath('/borrow')).toBe('borrow');
    expect(getKeyFromPath('/history')).toBe('history');
    expect(getKeyFromPath('/reservation')).toBe('reservation');
    expect(getKeyFromPath('/notifications')).toBe('notifications');
    expect(getKeyFromPath('/profile')).toBe('profile');
    expect(getKeyFromPath('/emotion')).toBe('emotion');
    expect(getKeyFromPath('/admin/users')).toBe('admin-users');
    expect(getKeyFromPath('/admin/books')).toBe('admin-books');
    expect(getKeyFromPath('/admin/returns')).toBe('admin-review');
    expect(getKeyFromPath('/admin/comments')).toBe('admin-comments');
    expect(getKeyFromPath('/admin/announcements')).toBe('admin-announcements');
  });

  it('未知路径返回 "home"', () => {
    expect(getKeyFromPath('/unknown')).toBe('home');
    expect(getKeyFromPath('/nonexistent/page')).toBe('home');
    expect(getKeyFromPath('')).toBe('home');
  });
});

// ─── getPathFromKey 测试 ─────────────────────────────────────────────
describe('getPathFromKey', () => {
  it('已知 key 返回正确的 path', () => {
    expect(getPathFromKey('home')).toBe('/');
    expect(getPathFromKey('borrow')).toBe('/borrow');
    expect(getPathFromKey('history')).toBe('/history');
    expect(getPathFromKey('reservation')).toBe('/reservation');
    expect(getPathFromKey('notifications')).toBe('/notifications');
    expect(getPathFromKey('profile')).toBe('/profile');
    expect(getPathFromKey('emotion')).toBe('/emotion');
    expect(getPathFromKey('admin-users')).toBe('/admin/users');
    expect(getPathFromKey('admin-books')).toBe('/admin/books');
    expect(getPathFromKey('admin-review')).toBe('/admin/returns');
    expect(getPathFromKey('admin-comments')).toBe('/admin/comments');
    expect(getPathFromKey('admin-announcements')).toBe('/admin/announcements');
  });

  it('未知 key 返回 "/"', () => {
    expect(getPathFromKey('unknown')).toBe('/');
    expect(getPathFromKey('')).toBe('/');
    expect(getPathFromKey('nonexistent')).toBe('/');
  });
});

// ─── ADMIN_KEYS 测试 ─────────────────────────────────────────────────
describe('ADMIN_KEYS', () => {
  it('包含所有管理员路由 key', () => {
    expect(ADMIN_KEYS).toContain('admin-users');
    expect(ADMIN_KEYS).toContain('admin-books');
    expect(ADMIN_KEYS).toContain('admin-review');
    expect(ADMIN_KEYS).toContain('admin-comments');
    expect(ADMIN_KEYS).toContain('admin-announcements');
  });

  it('不包含非管理员路由 key', () => {
    expect(ADMIN_KEYS).not.toContain('home');
    expect(ADMIN_KEYS).not.toContain('borrow');
    expect(ADMIN_KEYS).not.toContain('history');
    expect(ADMIN_KEYS).not.toContain('reservation');
    expect(ADMIN_KEYS).not.toContain('notifications');
    expect(ADMIN_KEYS).not.toContain('profile');
    expect(ADMIN_KEYS).not.toContain('emotion');
  });

  it('长度为 5', () => {
    expect(ADMIN_KEYS).toHaveLength(5);
  });
});

// ─── AuthGuard 测试 ──────────────────────────────────────────────────
describe('AuthGuard', () => {
  afterEach(() => {
    useAuthStore.setState({ currentUser: null });
    localStorage.removeItem('token');
  });

  it('用户已登录时渲染子组件', () => {
    useAuthStore.setState({ currentUser: { id: 1, username: 'test', role: 1 } });
    localStorage.setItem('token', 'test-token');

    render(
      <MemoryRouter initialEntries={['/borrow']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route
            path="/borrow"
            element={<AuthGuard><div>BorrowPage</div></AuthGuard>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('BorrowPage')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('用户未登录时重定向到 "/"', () => {
    useAuthStore.setState({ currentUser: null });
    localStorage.removeItem('token');

    render(
      <MemoryRouter initialEntries={['/borrow']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route
            path="/borrow"
            element={<AuthGuard><div>BorrowPage</div></AuthGuard>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('BorrowPage')).not.toBeInTheDocument();
  });
});

// ─── AdminGuard 测试 ─────────────────────────────────────────────────
describe('AdminGuard', () => {
  afterEach(() => {
    useAuthStore.setState({ currentUser: null });
    localStorage.removeItem('token');
  });

  it('管理员用户 (role=2) 渲染子组件', () => {
    useAuthStore.setState({ currentUser: { id: 1, username: 'admin', role: 2 } });
    localStorage.setItem('token', 'test-token');

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route
            path="/admin/users"
            element={<AdminGuard><div>AdminUsersPage</div></AdminGuard>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('AdminUsersPage')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('普通用户 (role=1) 重定向到 "/"', () => {
    useAuthStore.setState({ currentUser: { id: 2, username: 'user', role: 1 } });
    localStorage.setItem('token', 'test-token');

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route
            path="/admin/users"
            element={<AdminGuard><div>AdminUsersPage</div></AdminGuard>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('AdminUsersPage')).not.toBeInTheDocument();
  });

  it('未登录用户重定向到 "/"', () => {
    useAuthStore.setState({ currentUser: null });
    localStorage.removeItem('token');

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route
            path="/admin/users"
            element={<AdminGuard><div>AdminUsersPage</div></AdminGuard>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('AdminUsersPage')).not.toBeInTheDocument();
  });
});
