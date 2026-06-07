import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography, Rate, Tag, Space, Tabs, message, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import BookReview from './BookReview';
import ReviewForm from './ReviewForm';

const { Title, Text, Paragraph } = Typography;

export default function BookDetailModal() {
  const { t } = useTranslation();
  const {
    selectedBook,
    setSelectedBook,
    currentUser,
    borrowBook,
    reserveBook,
    reviews,
    fetchBookReviews,
    getSimilarBooks,
    fetchBooks,
    currentEmotionRecordId,
    updateEmotionBookId,
    clearEmotionRecordId,
  } = useStore();
  const [activeTab, setActiveTab] = useState('reviews');
  const [reviewSort, setReviewSort] = useState('helpful');
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (selectedBook?.id) {
      fetchBookReviews(selectedBook.id);
      setLoadingSimilar(true);
      getSimilarBooks(selectedBook.id).then(data => {
        setSimilarBooks(data);
        setLoadingSimilar(false);
      }).catch(() => {
        setSimilarBooks([]);
        setLoadingSimilar(false);
      });
    } else {
      setSimilarBooks([]);
    }
  }, [selectedBook?.id]);

  const bookReviews = reviews.filter(r => r.bookId === selectedBook?.id);

  const sortedReviews = [...bookReviews].sort((a, b) => {
    if (reviewSort === 'helpful') {
      return b.likeCount - a.likeCount;
    } else if (reviewSort === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return 0;
  });

  const handleReserve = async () => {
    if (selectedBook) {
      try {
        await reserveBook(selectedBook.id);
        message.success(t('reservation.reserveSuccess'));
        setSelectedBook(null);
      } catch (e) {
        message.error(e.message || t('reservation.reserveFailed'));
      }
    }
  };

  const handleBorrow = async () => {
    if (selectedBook) {
      try {
        await borrowBook(selectedBook.id);
        message.success(t('book.borrowSuccess'));
        if (currentEmotionRecordId) {
          updateEmotionBookId(currentEmotionRecordId, selectedBook.id);
          clearEmotionRecordId();
        }
        fetchBooks({ page: 1, size: 100 });
        setSelectedBook(null);
      } catch (e) {
        message.error(e.message || t('book.borrowFailed'));
      }
    }
  };

  const tabItems = [
    {
      key: 'reviews',
      label: `${t('book.reviews')} (${sortedReviews.length})`,
      children: (
        <>
          {currentUser && (
            <ReviewForm
              bookId={selectedBook?.id}
              onSuccess={() => setActiveTab('reviews')}
            />
          )}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>{t('book.reviews')}</Title>
            <Space>
              <Button
                type={reviewSort === 'helpful' ? 'primary' : 'default'}
                onClick={() => setReviewSort('helpful')}
              >
                {t('review.sortHelpful')}
              </Button>
              <Button
                type={reviewSort === 'newest' ? 'primary' : 'default'}
                onClick={() => setReviewSort('newest')}
              >
                {t('review.sortNewest')}
              </Button>
            </Space>
          </div>
          {sortedReviews.length > 0 ? (
            sortedReviews.map(review => (
              <BookReview key={review.id} review={review} />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>
              {t('book.noReviews')}
            </div>
          )}
        </>
      ),
    },
    ...(similarBooks.length > 0 || loadingSimilar
      ? [
          {
            key: 'similar',
            label: t('book.similar'),
            children: (
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 16 }}>
                {loadingSimilar ? (
                  <div style={{ textAlign: 'center', width: '100%', padding: 48 }}>
                    <Spin />
                  </div>
                ) : (
                  similarBooks.map(book => (
                    <div key={book.id} style={{ width: 200 }}>
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          style={{
                            height: 280,
                            width: '100%',
                            objectFit: 'cover',
                            borderRadius: 8,
                            cursor: 'pointer',
                            marginBottom: 8
                          }}
                          onClick={() => {
                            setSelectedBook(book);
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 280,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 8,
                            fontSize: 60,
                            cursor: 'pointer',
                            marginBottom: 8
                          }}
                          onClick={() => {
                            setSelectedBook(book);
                          }}
                        >
                          📚
                        </div>
                      )}
                      <Text strong ellipsis={{ rows: 2 }} style={{ fontSize: 14 }}>{book.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{book.author}</Text>
                    </div>
                  ))
                )}
              </div>
            ),
          }
        ]
      : []),
  ];

  return (
    <Modal
      title={t('book.detail')}
      open={!!selectedBook}
      onCancel={() => setSelectedBook(null)}
      width={900}
      centered
      footer={[
        <Button key="close" onClick={() => setSelectedBook(null)} style={{ borderRadius: 6 }}>
          {t('common.cancel')}
        </Button>,
        currentUser && selectedBook?.availableCount > 0 && (
          <Button key="borrow" type="primary" onClick={handleBorrow} style={{ borderRadius: 6 }}>
            {t('book.borrow')}
          </Button>
        ),
        currentUser && selectedBook?.availableCount === 0 && (
          <Button key="reserve" type="primary" onClick={handleReserve} style={{ borderRadius: 6 }}>
            {t('book.reserve')}
          </Button>
        )
      ].filter(Boolean)}
    >
      {selectedBook && (
        <>
          <div style={{ display: 'flex', gap: 32, padding: 16 }}>
            {selectedBook.coverUrl ? (
              <img
                src={selectedBook.coverUrl}
                alt={selectedBook.title}
                style={{
                  width: 220,
                  height: 300,
                  objectFit: 'cover',
                  borderRadius: 12,
                  flexShrink: 0
                }}
              />
            ) : (
              <div style={{
                width: 220,
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 12,
                fontSize: 80,
                flexShrink: 0
              }}>
                📚
              </div>
            )}
            <div style={{ flex: 1 }}>
              <Title level={3} style={{ marginBottom: 16 }}>{selectedBook.title}</Title>
              <Paragraph style={{ fontSize: 15, marginBottom: 12 }}>
                {t('book.author')}: <Text strong>{selectedBook.author}</Text>
              </Paragraph>
              {selectedBook.publishDate && (
                <Paragraph style={{ fontSize: 14, marginBottom: 8, color: '#666' }}>
                  {t('book.publishDate')}: {selectedBook.publishDate}
                </Paragraph>
              )}
              {selectedBook.location && (
                <Paragraph style={{ fontSize: 14, marginBottom: 8, color: '#666' }}>
                  {t('book.location')}: {selectedBook.location}
                </Paragraph>
              )}
              <Space style={{ marginBottom: 16 }}>
                <Rate disabled defaultValue={selectedBook.rating} style={{ fontSize: 14 }} />
                <Text type="secondary" style={{ fontSize: 14 }}>{selectedBook.rating}</Text>
              </Space>
              <Paragraph style={{ marginBottom: 16 }}>
                <Tag color="blue" style={{ marginRight: 8, padding: '4px 12px', borderRadius: 4 }}>
                  {t(`categories.${selectedBook.category?.name}`, { defaultValue: selectedBook.category?.name || '' })}
                </Tag>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {t('book.available', { count: selectedBook.availableCount })}
                </Text>
                {selectedBook.availableCount === 0 && <Tag color="red" style={{ marginLeft: 8 }}>{t('book.noStock')}</Tag>}
              </Paragraph>
              <Paragraph style={{ color: '#666', lineHeight: 1.8, fontSize: 14, marginBottom: 20 }}>
                {selectedBook.description}
              </Paragraph>
            </div>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginTop: 24 }} />
        </>
      )}
    </Modal>
  );
}
