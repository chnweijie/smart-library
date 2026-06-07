import React, { useState } from 'react';
import { Typography, Input, Card, Empty, Pagination } from 'antd';
import { useTranslation } from 'react-i18next';
import BookCard from '../components/BookCard';
import { useStore } from '../store/useStore';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;
const PAGE_SIZE = 12;

export default function Home() {
  const { t } = useTranslation();
  const {
    books,
    totalBooks,
    categories,
    selectedCategory,
    setSelectedCategory,
    fetchBooks,
  } = useStore();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const getCategoryName = (name) => {
    return t(`categories.${name}`, { defaultValue: name });
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    fetchBooks({
      page: 1,
      size: PAGE_SIZE,
      keyword: searchText || undefined,
      categoryId: categoryId !== 'all' ? categoryId : undefined,
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
    fetchBooks({
      page: 1,
      size: PAGE_SIZE,
      keyword: value || undefined,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBooks({
      page,
      size: PAGE_SIZE,
      keyword: searchText || undefined,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
    });
  };

  const selectedCategoryName = selectedCategory !== 'all'
    ? getCategoryName(categories.find(c => c.id === selectedCategory)?.name || '')
    : '';

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ marginBottom: 4 }}>{t('home.title')}</Title>
        <Paragraph style={{ color: '#999', fontSize: 14, margin: 0 }}>
          {t('home.subtitle')}
        </Paragraph>
      </div>

      <Card
        style={{ marginBottom: 20, borderRadius: 8 }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          gap: 16,
        }}>
          <div style={{ display: 'flex', gap: 0, flex: 1, overflowX: 'auto', minWidth: 0 }}>
            <div
              onClick={() => handleCategoryChange('all')}
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.2s',
                color: selectedCategory === 'all' ? '#1677ff' : '#666',
                fontWeight: selectedCategory === 'all' ? 600 : 400,
                fontSize: 14,
                whiteSpace: 'nowrap',
              }}
            >
              {t('categories.all')}
              {selectedCategory === 'all' && (
                <div style={{
                  position: 'absolute',
                  bottom: -1,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  height: 2,
                  background: '#1677ff',
                  borderRadius: 1,
                }} />
              )}
            </div>
            {categories.map(category => (
              <div
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                style={{
                  padding: '6px 16px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'color 0.2s',
                  color: selectedCategory === category.id ? '#1677ff' : '#666',
                  fontWeight: selectedCategory === category.id ? 600 : 400,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                }}
              >
                {getCategoryName(category.name)}
                {selectedCategory === category.id && (
                  <div style={{
                    position: 'absolute',
                    bottom: -1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: 2,
                    background: '#1677ff',
                    borderRadius: 1,
                  }} />
                )}
              </div>
            ))}
          </div>
          <Search
            placeholder={t('home.search')}
            allowClear
            onSearch={handleSearch}
            onChange={e => { if (!e.target.value) handleSearch(''); }}
            style={{ width: 240, flexShrink: 0 }}
          />
        </div>

        <div style={{ padding: '4px 20px 12px', display: 'flex', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('home.totalBooks', { count: totalBooks })}
            {selectedCategory !== 'all' && ` · ${selectedCategoryName}`}
            {searchText && ` · ${t('home.searchResult', { keyword: searchText })}`}
          </Text>
        </div>
      </Card>

      {books.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={totalBooks}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      ) : (
        <Card style={{ borderRadius: 8 }}>
          <Empty
            description={
              searchText
                ? t('home.noResult', { keyword: searchText })
                : t('home.noCategory', { category: selectedCategoryName })
            }
          />
        </Card>
      )}
    </div>
  );
}
