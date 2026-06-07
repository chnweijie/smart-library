
import React, { useEffect, useState } from 'react';
import { Typography, Card, List, Button, Tag, Space, Spin, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

const { Title, Text, Paragraph } = Typography;

const STATUS_MAP = {
  PENDING: 'reserving',
  TAKEN: 'ready',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.replace('T', ' ').substring(0, 19);
}

export default function MyReservation() {
  const { t } = useTranslation();
  const { reservations, books, fetchReservations, cancelReservation, borrowBook, fetchBooks } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchReservations().finally(() => setLoading(false));
  }, [fetchReservations]);

  const mappedReservations = reservations.map((r) => {
    const statusKey = typeof r.status === 'string' ? r.status : r.status?.name || r.status;
    const bookTitle = r.bookTitle
      || r.book?.title
      || books.find((b) => b.id === r.bookId)?.title
      || `#${r.bookId}`;
    return {
      ...r,
      book: bookTitle,
      status: STATUS_MAP[statusKey] || 'reserving',
      reserveDate: formatDate(r.createdAt),
    };
  });

  const handleCancel = async (id) => {
    try {
      await cancelReservation(id);
      message.success(t('reservation.cancelSuccess'));
    } catch (e) {
      message.error(e.message || t('common.error'));
    }
  };

  const handleBorrowNow = async (item) => {
    try {
      await borrowBook(item.bookId);
      fetchReservations();
      fetchBooks({ page: 1, size: 100 });
      message.success(t('reservation.borrowNowSuccess'));
    } catch (e) {
      message.error(e.message || t('common.error'));
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>
      <Title level={2} style={{ marginBottom: 24 }}>{t('reservation.title')}</Title>
      <Card title={t('reservation.reservedBooks')} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <Spin spinning={loading}>
        <List
          locale={{ emptyText: t('common.noData') }}
          dataSource={mappedReservations}
          renderItem={(item) => (
            <List.Item
              actions={[
                item.status === 'reserving' ? <Button danger onClick={() => handleCancel(item.id)}>{t('reservation.cancelReservation')}</Button> :
                item.status === 'ready' ? <Button type="primary" onClick={() => handleBorrowNow(item)}>{t('reservation.borrowNow')}</Button> : null
              ]}
            >
              <List.Item.Meta
                avatar={<div style={{ fontSize: 36 }}>📋</div>}
                title={<Text strong style={{ fontSize: 16 }}>{item.book}</Text>}
                description={
                  <Space orientation="vertical" size="small" style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 14 }}>{t('reservation.reserveDate')}: {item.reserveDate}</Text>
                    <Tag color={item.status === 'ready' ? 'green' : item.status === 'cancelled' || item.status === 'expired' ? 'default' : 'orange'} style={{ marginTop: 4 }}>
                      {t(`reservation.status.${item.status}`)}
                    </Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        </Spin>
      </Card>

      <Card title={t('reservation.info')} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Paragraph>{t('reservation.info1')}</Paragraph>
        <Paragraph>{t('reservation.info2')}</Paragraph>
        <Paragraph>{t('reservation.info3')}</Paragraph>
        <Paragraph>{t('reservation.info4')}</Paragraph>
      </Card>
    </div>
  );
}
