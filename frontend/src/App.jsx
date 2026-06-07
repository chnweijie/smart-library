import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { Layout, Menu, Button, Typography, Avatar, Space, Badge, Dropdown, Spin, message } from 'antd';
import { GlobalOutlined, HomeOutlined, BookOutlined, HistoryOutlined, ScheduleOutlined, BellOutlined, UserOutlined, SmileOutlined, TeamOutlined, DatabaseOutlined, AuditOutlined, CommentOutlined, NotificationOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useAuthStore, useBookStore, useNotificationStore } from './store/useStore';
import AuthModal from './components/AuthModal';
import BookDetailModal from './components/BookDetailModal';
import { routeConfig, getKeyFromPath, getPathFromKey, AuthGuard, AdminGuard, ADMIN_KEYS } from './routes.jsx';

const { Header, Content, Sider, Footer } = Layout;
const { Title } = Typography;

function LazyPage({ Component }) {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Spin size="large" /></div>}>
      <Component />
    </Suspense>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentKey = getKeyFromPath(location.pathname);

  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const fetchBooks = useBookStore((s) => s.fetchBooks);
  const fetchCategories = useBookStore((s) => s.fetchCategories);
  const fetchFavorites = useBookStore((s) => s.fetchFavorites);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.notifications);
  const notifSettings = useNotificationStore((s) => s.notifSettings);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  const TYPE_MAP = { BORROW_APPROVED: 'reminder', BORROW_REJECTED: 'system', RETURN_REMINDER: 'reminder', OVERDUE_NOTICE: 'reminder', RESERVATION_READY: 'reservation', SYSTEM_ANNOUNCEMENT: 'announcement', REVIEW_REPLIED: 'system' };
  const CATEGORY_SETTING_MAP = { reminder: 'borrowDueReminder', reservation: 'reservationArrivalReminder', announcement: 'systemAnnouncements', system: 'systemAnnouncements' };

  const filteredUnreadCount = useMemo(() => {
    return notifications.filter(n => {
      if (n.isRead) return false;
      const category = TYPE_MAP[n.type] || 'system';
      const settingKey = CATEGORY_SETTING_MAP[category];
      return !settingKey || notifSettings[settingKey] !== false;
    }).length;
  }, [notifications, notifSettings]);

  const [collapsed, setCollapsed] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 2;

  useEffect(() => {
    fetchBooks({ page: 1, size: 12 });
    fetchCategories();
  }, [fetchBooks, fetchCategories, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchFavorites();
      fetchNotifications();
      fetchUnreadCount();
      // 页面重新获得焦点时刷新未读数
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          fetchUnreadCount();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }
  }, [currentUser, fetchFavorites, fetchNotifications, fetchUnreadCount]);

  const handleAuthExpired = useCallback(() => {
    useAuthStore.setState({ currentUser: null });
    message.warning(t('auth.sessionExpired'));
    navigate('/');
  }, [navigate, t]);

  useEffect(() => {
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [handleAuthExpired]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const languageMenu = {
    items: [
      { key: 'zh', label: t('common.chinese'), onClick: () => changeLanguage('zh') },
      { key: 'en', label: t('common.english'), onClick: () => changeLanguage('en') },
      { key: 'ru', label: t('common.russian'), onClick: () => changeLanguage('ru') },
    ],
  };

  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: t('nav.home') },
    { key: 'borrow', icon: <BookOutlined />, label: t('nav.borrow'), disabled: !currentUser },
    { key: 'history', icon: <HistoryOutlined />, label: t('nav.history'), disabled: !currentUser },
    { key: 'reservation', icon: <ScheduleOutlined />, label: t('nav.reservation'), disabled: !currentUser },
    { key: 'notifications', icon: <BellOutlined />, label: (
      <Space>
        <span>{t('nav.notifications')}</span>
        {filteredUnreadCount > 0 && <Badge count={filteredUnreadCount} style={{ backgroundColor: '#ff4d4f' }} />}
      </Space>
    ), disabled: !currentUser },
    { key: 'profile', icon: <UserOutlined />, label: t('nav.profile'), disabled: !currentUser },
    { key: 'emotion', icon: <SmileOutlined />, label: t('nav.emotion'), disabled: !currentUser },
    ...(isAdmin ? [
      { type: 'divider' },
      { key: 'admin-users', icon: <TeamOutlined />, label: t('nav.adminUsers') },
      { key: 'admin-books', icon: <DatabaseOutlined />, label: t('nav.adminBooks') },
      { key: 'admin-review', icon: <AuditOutlined />, label: t('nav.adminReview') },
      { key: 'admin-comments', icon: <CommentOutlined />, label: t('nav.adminComments') },
      { key: 'admin-announcements', icon: <NotificationOutlined />, label: t('nav.adminAnnouncements') },
    ] : []),
  ];

  const handleMenuClick = ({ key }) => {
    navigate(getPathFromKey(key));
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={260}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.1)',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
        >
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            {collapsed ? '📚' : `📚 ${t('app.title')}`}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentKey]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout style={{ background: '#f0f2f5' }}>
        <Header style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 20, marginRight: 16 }}
          >
            {collapsed ? '☰' : '✕'}
          </Button>

          <div style={{ marginLeft: 'auto' }}>
            <Space size="middle">
              <Dropdown menu={languageMenu} placement="bottomRight">
                <Button type="text" icon={<GlobalOutlined />} style={{ fontSize: 16 }}>
                  {i18n.language === 'zh' ? t('common.chinese') : i18n.language === 'ru' ? t('common.russian') : t('common.english')}
                </Button>
              </Dropdown>

              {currentUser ? (
                <>
                  <Avatar
                    src={currentUser.avatarUrl || undefined}
                    style={{ backgroundColor: '#1677ff' }}
                    size={40}
                  >
                    {!currentUser.avatarUrl && currentUser.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography.Text strong style={{ fontSize: 15 }}>{currentUser.username}</Typography.Text>
                  <Button onClick={() => { logout(); navigate('/'); }} style={{ borderRadius: 6 }}>
                    {t('common.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsLoginModalOpen(true)} style={{ borderRadius: 6 }}>{t('auth.login')}</Button>
                  <Button type="primary" onClick={() => setIsRegisterModalOpen(true)} style={{ borderRadius: 6 }}>{t('auth.register')}</Button>
                </>
              )}
            </Space>
          </div>
        </Header>

        <Content style={{ margin: 0, minHeight: 280 }}>
          <Routes>
            {routeConfig.map((route) => {
              const PageComponent = route.element;
              let element = <LazyPage Component={PageComponent} />;

              if (route.admin) {
                element = <AdminGuard>{element}</AdminGuard>;
              } else if (route.auth) {
                element = <AuthGuard>{element}</AuthGuard>;
              }

              return <Route key={route.key} path={route.path} element={element} />;
            })}
          </Routes>
        </Content>

        <Footer style={{ textAlign: 'center', color: '#999' }}>
          {t('app.footer')}
        </Footer>
      </Layout>

      <AuthModal open={isLoginModalOpen} mode="login" onCancel={() => setIsLoginModalOpen(false)} />
      <AuthModal open={isRegisterModalOpen} mode="register" onCancel={() => setIsRegisterModalOpen(false)} />
      <BookDetailModal />
    </Layout>
  );
}

export default App;
