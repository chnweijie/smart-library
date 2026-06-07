
import React, { useEffect } from 'react';
import { Typography, Card, List, Button, Tag, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

const { Title, Text } = Typography;

const statusMap = {
  BORROWING: 'borrowing',
  PENDING: 'pending',
  RETURNED: 'returned',
  REJECTED: 'rejected',
  OVERDUE: 'overdue',
};

const statusColorMap = {
  BORROWING: 'green',
  PENDING: 'orange',
  RETURNED: 'blue',
  REJECTED: 'red',
  OVERDUE: 'red',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.replace('T', ' ').substring(0, 19);
}

export default function MyBorrow() {
  const { t } = useTranslation();
  const { borrows, fetchCurrentBorrows, applyReturn, cancelReturn } = useStore();

  useEffect(() => {
    fetchCurrentBorrows();
  }, []);

  const handleApplyReturn = async (id) => {
    try {
      await applyReturn(id);
      message.success(t('borrow.applyReturnSuccess'));
    } catch (e) {
      message.error(e.message || t('borrow.operationFailed'));
    }
  };

  const handleCancelReturn = async (id) => {
    try {
      await cancelReturn(id);
      message.success(t('borrow.cancelReturnSuccess'));
    } catch (e) {
      message.error(e.message || t('borrow.operationFailed'));
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>
      <Title level={2} style={{ marginBottom: 24 }}>{t('borrow.title')}</Title>
      <Card title={t('borrow.currentBorrow')} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <List
          dataSource={borrows}
          renderItem={(item) => {
            const displayStatus = statusMap[item.status] || item.status;
            return (
            <List.Item
              actions={
                item.status === 'BORROWING'
                  ? [<Button type="primary" onClick={() => handleApplyReturn(item.id)}>{t('borrow.applyReturn')}</Button>]
                  : item.status === 'PENDING'
                  ? [<Button onClick={() => handleCancelReturn(item.id)}>{t('borrow.cancelReturn')}</Button>]
                  : []
              }
            >
              <List.Item.Meta
                avatar={
                  item.book?.coverUrl ? (
                    <img src={item.book.coverUrl} alt="" style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <div style={{ width: 48, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 4, fontSize: 24 }}>📚</div>
                  )
                }
                title={<Text strong style={{ fontSize: 16 }}>{item.book?.title || ''}</Text>}
                description={
                  <Space orientation="vertical" size="small" style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 14 }}>{t('borrow.borrowDate')}: {formatDate(item.borrowDate)}</Text>
                    <Text style={{ fontSize: 14 }}>{t('borrow.dueDate')}: {formatDate(item.dueDate)}</Text>
                    <Tag color={statusColorMap[item.status] || 'default'} style={{ marginTop: 4 }}>
                      {t(`borrow.borrowStatus.${displayStatus}`)}
                    </Tag>
                    {item.status === 'REJECTED' && item.rejectReason && (
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        {t('borrow.rejectReason')}: {item.rejectReason}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}
