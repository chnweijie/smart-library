
import React, { useEffect } from 'react';
import { Typography, Card, List, Button, Rate, Tag, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { formatDateTime } from '../utils/userDisplay';

const { Title, Text } = Typography;

const statusMap = {
  1: 'borrowing',
  2: 'pending',
  3: 'returned',
  4: 'rejected',
  5: 'overdue',
  BORROWING: 'borrowing',
  PENDING: 'pending',
  RETURNED: 'returned',
  REJECTED: 'rejected',
  OVERDUE: 'overdue',
};

export default function BorrowHistory() {
  const { t } = useTranslation();
  const { borrowHistory, fetchBorrowHistory, borrowBook, setSelectedBook, books, fetchBooks } = useStore();

  useEffect(() => {
    fetchBorrowHistory();
  }, [fetchBorrowHistory]);

  const handleReBorrow = async (bookId) => {
    try {
      await borrowBook(bookId);
      message.success(t('book.borrowSuccess'));
      fetchBooks({ page: 1, size: 100 });
    } catch (e) {
      message.error(e.message || t('book.borrowFailed'));
    }
  };

  const handleWriteReview = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      setSelectedBook(book);
    } else {
      message.info(t('book.noReviews'));
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>
      <Title level={2} style={{ marginBottom: 24 }}>{t('history.title')}</Title>
      <Card title={t('history.historyRecords')} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <List
          dataSource={borrowHistory}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" size="small" onClick={() => handleReBorrow(item.bookId)}>{t('book.reBorrow')}</Button>,
                <Button type="link" size="small" onClick={() => handleWriteReview(item.bookId)}>{t('book.writeReview')}</Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  item.book?.coverUrl ? (
                    <img src={item.book.coverUrl} alt="" style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <div style={{ width: 48, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 4, fontSize: 24 }}>📚</div>
                  )
                }
                title={
                  <Space>
                    <Text strong style={{ fontSize: 16 }}>{item.book?.title || ''}</Text>
                    <Rate disabled defaultValue={item.rating} style={{ fontSize: 12 }} />
                  </Space>
                }
                description={
                  <Space orientation="vertical" size="small" style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 14 }}>{t('history.borrowDate')}: {formatDateTime(item.borrowDate)}</Text>
                    <Text style={{ fontSize: 14 }}>{t('history.returnDate')}: {formatDateTime(item.returnDate) || '-'}</Text>
                    <Tag color="blue" style={{ marginTop: 4 }}>
                      {t(`history.status.${statusMap[item.status] || 'returned'}`, { defaultValue: item.status })}
                    </Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
