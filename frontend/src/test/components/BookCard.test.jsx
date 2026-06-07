import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookCard from '../../components/BookCard';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (!key) return '';
      const map = {
        'book.favorited': 'Favorited',
        'book.favorite': 'Favorite',
        'book.loginToFavorite': 'Please login first',
        'book.available': `Available: ${options?.count ?? 0}`,
        'book.noStock': 'Out of stock',
        'book.favoriteFailed': 'Favorite failed',
        'book.favoriteSuccess': 'Favorited',
        'book.unfavoriteSuccess': 'Unfavorited',
        'auth.loginToFavorite': 'Please login to favorite',
        'common.operationFailed': 'Operation failed',
      };
      if (key.startsWith('categories.')) {
        return options?.defaultValue || key.replace('categories.', '');
      }
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock useStore
const mockToggleFavorite = vi.fn();
const mockSetSelectedBook = vi.fn();

vi.mock('../../store/useStore', () => ({
  useStore: () => ({
    currentUser: { id: 1, username: 'test', role: 1 },
    favorites: [],
    toggleFavorite: mockToggleFavorite,
    setSelectedBook: mockSetSelectedBook,
  }),
}));

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
  };
});

const sampleBook = {
  id: 1,
  title: 'Computer Systems',
  author: 'Randal E. Bryant',
  rating: 4.5,
  category: { name: 'Computer' },
  availableCount: 3,
  coverUrl: 'https://example.com/cover.jpg',
};

const bookNoCover = {
  id: 2,
  title: 'Test Book',
  author: 'Test Author',
  rating: 3,
  category: null,
  availableCount: 0,
  coverUrl: null,
};

describe('BookCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders book information correctly (title, author, category, rating)', () => {
    render(<BookCard book={sampleBook} />);

    expect(screen.getByText('Computer Systems')).toBeInTheDocument();
    expect(screen.getByText('Randal E. Bryant')).toBeInTheDocument();
    expect(screen.getByText('Computer')).toBeInTheDocument();
    expect(screen.getByText('Available: 3')).toBeInTheDocument();
  });

  it('shows default placeholder when no cover URL', () => {
    render(<BookCard book={bookNoCover} />);

    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  it('shows out of stock tag when availableCount is 0', () => {
    render(<BookCard book={bookNoCover} />);

    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('handles missing category gracefully', () => {
    render(<BookCard book={bookNoCover} />);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
  });

  it('clicking the card triggers setSelectedBook', () => {
    render(<BookCard book={sampleBook} />);

    const card = screen.getByText('Computer Systems').closest('.ant-card');
    fireEvent.click(card);

    expect(mockSetSelectedBook).toHaveBeenCalledWith(sampleBook);
  });

  it('clicking favorite button triggers toggleFavorite', async () => {
    mockToggleFavorite.mockResolvedValue({ success: true, messageKey: 'book.favoriteSuccess' });

    render(<BookCard book={sampleBook} />);

    const favButton = screen.getByText('Favorite');
    fireEvent.click(favButton);

    expect(mockToggleFavorite).toHaveBeenCalledWith(sampleBook.id);
  });
});
