import React from 'react';
import { Card, Button, Rate, Tag, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

const { Text } = Typography;

export default function BookCard({ book }) {
  const { t } = useTranslation();
  const { currentUser, favorites, toggleFavorite, setSelectedBook } = useStore();
  const isFavorited = favorites.includes(book.id);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      message.warning(t('book.loginToFavorite'));
      return;
    }
    const result = await toggleFavorite(book.id);
    if (result.success) {
      message.success(t(result.messageKey));
    } else {
      message.warning(t(result.messageKey));
    }
  };

  const coverElement = book.coverUrl ? (
    <img
      src={book.coverUrl}
      alt={book.title}
      style={{ width: '100%', height: 300, objectFit: 'cover' }}
    />
  ) : (
    <div style={{
      height: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontSize: 60
    }}>
      📚
    </div>
  );

  return (
    <Card
      hoverable
      style={{ width: 260 }}
      cover={coverElement}
      onClick={() => setSelectedBook(book)}
      actions={[
        <Button
          type={isFavorited ? 'primary' : 'default'}
          onClick={handleFavorite}
        >
          {isFavorited ? t('book.favorited') : t('book.favorite')}
        </Button>
      ]}
    >
      <Card.Meta
        title={<Text strong style={{ fontSize: 16 }}>{book.title}</Text>}
        description={
          <div style={{ marginTop: 8 }}>
            <Text ellipsis style={{ color: '#666', marginBottom: 8, display: 'block' }}>
              {book.author}
            </Text>
            <Rate disabled defaultValue={book.rating} style={{ fontSize: 12, marginBottom: 8 }} />
            <Tag color="blue" style={{ marginBottom: 4, display: 'inline-block' }}>
              {t(`categories.${book.category?.name}`, { defaultValue: book.category?.name || '' })}
            </Tag>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 13 }}>
              {t('book.available', { count: book.availableCount })}
              {book.availableCount === 0 && <Tag color="red" style={{ marginLeft: 8 }}>{t('book.noStock')}</Tag>}
            </Text>
          </div>
        }
      />
    </Card>
  );
}
