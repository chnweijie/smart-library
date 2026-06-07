
import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Card, List, Button, Tag, Space, Badge, Tabs, message, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { formatDateTime } from '../utils/userDisplay';

const { Title, Text } = Typography;

const TYPE_MAP = {
  BORROW_APPROVED: 'reminder',
  BORROW_REJECTED: 'system',
  RETURN_REMINDER: 'reminder',
  OVERDUE_NOTICE: 'reminder',
  RESERVATION_READY: 'reservation',
  SYSTEM_ANNOUNCEMENT: 'announcement',
  REVIEW_REPLIED: 'system',
};

const CATEGORY_SETTING_MAP = {
  reminder: 'borrowDueReminder',
  reservation: 'reservationArrivalReminder',
  announcement: 'systemAnnouncements',
  system: 'systemAnnouncements',
};

export default function Notifications() {
  const { t } = useTranslation();
  const { notifications, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, notifSettings } = useStore();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchNotifications(), fetchUnreadCount()]).finally(() => setLoading(false));
  }, [fetchNotifications, fetchUnreadCount]);

  const mappedNotifications = useMemo(() =>
    notifications
      .map(n => ({
        ...n,
        read: n.isRead,
        category: TYPE_MAP[n.type] || 'system',
        time: n.createdAt,
      }))
      .filter(n => {
        const settingKey = CATEGORY_SETTING_MAP[n.category];
        return !settingKey || notifSettings[settingKey] !== false;
      })
      .sort((a, b) => {
        // 公告按优先级排序（1=高 > 2=中 > 3=低），其他类型保持原序
        if (a.category === 'announcement' && b.category === 'announcement') {
          return (a.priority || 3) - (b.priority || 3);
        }
        return 0;
      }),
    [notifications, notifSettings]
  );

  const filteredNotifications = activeTab === 'all'
    ? mappedNotifications
    : mappedNotifications.filter(n => n.category === activeTab);

  const unreadCount = mappedNotifications.filter(n => !n.read).length;

  const tabItems = [
    { key: 'all', label: t('notification.all') },
    { key: 'reminder', label: (
      <span>
        {t('notification.reminder')}
        {mappedNotifications.filter(n => n.category === 'reminder' && !n.read).length > 0 && (
          <Badge 
            count={mappedNotifications.filter(n => n.category === 'reminder' && !n.read).length}
            style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }}
          />
        )}
      </span>
    )},
    { key: 'system', label: (
      <span>
        {t('notification.system')}
        {mappedNotifications.filter(n => n.category === 'system' && !n.read).length > 0 && (
          <Badge 
            count={mappedNotifications.filter(n => n.category === 'system' && !n.read).length}
            style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }}
          />
        )}
      </span>
    )},
    { key: 'reservation', label: (
      <span>
        {t('notification.reservationNotif')}
        {mappedNotifications.filter(n => n.category === 'reservation' && !n.read).length > 0 && (
          <Badge 
            count={mappedNotifications.filter(n => n.category === 'reservation' && !n.read).length}
            style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }}
          />
        )}
      </span>
    )},
    { key: 'announcement', label: (
      <span>
        {t('notification.announcement')}
        {mappedNotifications.filter(n => n.category === 'announcement' && !n.read).length > 0 && (
          <Badge 
            count={mappedNotifications.filter(n => n.category === 'announcement' && !n.read).length}
            style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }}
          />
        )}
      </span>
    )},
  ];

  const getAvatarContent = (category, priority) => {
    if (category === 'announcement' && priority === 1) return '🔴';
    if (category === 'announcement' && priority === 2) return '🟠';
    switch (category) {
      case 'reminder': return '⏰';
      case 'reservation': return '📋';
      case 'announcement': return '📢';
      default: return '🔔';
    }
  };

  const getAvatarBg = (category, priority) => {
    if (category === 'announcement' && priority === 1) return '#fff1f0';
    if (category === 'announcement' && priority === 2) return '#fff7e6';
    switch (category) {
      case 'reminder': return '#fff7e6';
      case 'reservation': return '#f6ffed';
      case 'announcement': return '#e6f7ff';
      default: return '#f0f0f0';
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 0 }}>
          {t('notification.title')}
          {unreadCount > 0 && (
            <Tag color="red" style={{ marginLeft: 12, fontSize: 14 }}>
              {t('notification.unread', { count: unreadCount })}
            </Tag>
          )}
        </Title>
        <Space>
          {unreadCount > 0 && (
            <Button onClick={async () => {
              try {
                await markAllAsRead();
                message.success(t('notification.markAllReadSuccess'));
              } catch (e) {
                message.error(e.message || t('common.error'));
              }
            }}>
              {t('notification.markAllRead')}
            </Button>
          )}
        </Space>
      </div>

      <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Spin spinning={loading}>
      {filteredNotifications.length > 0 ? (
        <List
          dataSource={filteredNotifications}
          renderItem={(item) => (
            <List.Item
              style={{ 
                background: item.read ? '#fff' : '#f0f7ff',
                borderRadius: 8,
                marginBottom: 12,
                padding: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              actions={[!item.read && (
                <Button type="link" onClick={async () => {
                  try {
                    await markAsRead(item.id);
                  } catch (e) {
                    message.error(e.message || t('common.error'));
                  }
                }}>
                  {t('notification.markRead')}
                </Button>
              )]}
              onClick={async () => {
                if (!item.read) {
                  try {
                    await markAsRead(item.id);
                  } catch (e) {
                    message.error(e.message || t('common.error'));
                  }
                }
              }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: getAvatarBg(item.category, item.priority),
                    fontSize: 24
                  }}>
                    {getAvatarContent(item.category, item.priority)}
                  </div>
                }
                title={
                  <Space>
                    <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                    {item.category === 'announcement' && item.priority === 1 && (
                      <Tag color="red">{t('notification.urgent')}</Tag>
                    )}
                    {!item.read && <Tag color="red">{t('notification.newMessage')}</Tag>}
                  </Space>
                }
                description={
                  <Space orientation="vertical" size="small" style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 14 }}>{item.content}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(item.time)}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Card style={{ borderRadius: 8, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
          <Text type="secondary" style={{ fontSize: 16 }}>{t('notification.empty')}</Text>
        </Card>
      )}
      </Spin>
    </div>
  );
}
