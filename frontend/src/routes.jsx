import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

const Home = React.lazy(() => import('./pages/Home'));
const MyBorrow = React.lazy(() => import('./pages/MyBorrow'));
const BorrowHistory = React.lazy(() => import('./pages/BorrowHistory'));
const MyReservation = React.lazy(() => import('./pages/MyReservation'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Profile = React.lazy(() => import('./pages/Profile'));
const EmotionAnalysis = React.lazy(() => import('./pages/EmotionAnalysis'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminBooks = React.lazy(() => import('./pages/AdminBooks'));
const AdminReview = React.lazy(() => import('./pages/AdminReview'));
const AdminComments = React.lazy(() => import('./pages/AdminComments'));
const AdminAnnouncements = React.lazy(() => import('./pages/AdminAnnouncements'));

function AuthGuard({ children }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const token = localStorage.getItem('token');
  if (!currentUser || !token) return <Navigate to="/" replace />;
  return children;
}

function AdminGuard({ children }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const token = localStorage.getItem('token');
  if (!currentUser || !token) return <Navigate to="/" replace />;
  if (currentUser.role !== 2) return <Navigate to="/" replace />;
  return children;
}

export const routeConfig = [
  { path: '/', key: 'home', element: Home },
  { path: '/borrow', key: 'borrow', element: MyBorrow, auth: true },
  { path: '/history', key: 'history', element: BorrowHistory, auth: true },
  { path: '/reservation', key: 'reservation', element: MyReservation, auth: true },
  { path: '/notifications', key: 'notifications', element: Notifications, auth: true },
  { path: '/profile', key: 'profile', element: Profile, auth: true },
  { path: '/emotion', key: 'emotion', element: EmotionAnalysis, auth: true },
  { path: '/admin/users', key: 'admin-users', element: AdminUsers, admin: true },
  { path: '/admin/books', key: 'admin-books', element: AdminBooks, admin: true },
  { path: '/admin/returns', key: 'admin-review', element: AdminReview, admin: true },
  { path: '/admin/comments', key: 'admin-comments', element: AdminComments, admin: true },
  { path: '/admin/announcements', key: 'admin-announcements', element: AdminAnnouncements, admin: true },
];

export function getKeyFromPath(pathname) {
  const route = routeConfig.find((r) => r.path === pathname);
  return route ? route.key : 'home';
}

export function getPathFromKey(key) {
  const route = routeConfig.find((r) => r.key === key);
  return route ? route.path : '/';
}

export const ADMIN_KEYS = routeConfig.filter((r) => r.admin).map((r) => r.key);

export { AuthGuard, AdminGuard };
