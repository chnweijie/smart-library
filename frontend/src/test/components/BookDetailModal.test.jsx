import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookDetailModal from '../../components/BookDetailModal';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const map = {
        'book.detail': 'Book Detail',
        'book.author': 'Author',
        'book.publishDate': 'Publish Date',
        'book.available': `Available: ${options?.count ?? 0}`,
        'book.noStock': 'Out of stock',
        'book.borrow': 'Borrow',
        'book.reserve': 'Reserve',
        'book.borrowSuccess': 'Borrowed successfully',
        'book.borrowFailed': 'Borrow failed',
        'book.reviews': 'Reviews',
        'book.noReviews': 'No reviews yet',
        'book.similar': 'Similar Books',
        'common.cancel': 'Cancel',
        'common.error': 'Error',
        'review.sortHelpful': 'Most Helpful',
        'review.sortNewest': 'Newest',
        'reservation.reserveSuccess': 'Reserved successfully',
        'reservation.reserveFailed': 'Reserve failed',
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
const mockSetSelectedBook = vi.fn();
const mockBorrowBook = vi.fn();
const mockReserveBook = vi.fn();
const mockFetchBookReviews = vi.fn();
const mockGetSimilarBooks = vi.fn();
const mockFetchBooks = vi.fn();

const defaultStoreValues = {
  selectedBook: null,
  setSelectedBook: mockSetSelectedBook,
  currentUser: { id: 1, username: 'testuser', role: 1 },
  borrowBook: mockBorrowBook,
  reserveBook: mockReserveBook,
  reviews: [],
  fetchBookReviews: mockFetchBookReviews,
  getSimilarBooks: mockGetSimilarBooks,
  fetchBooks: mockFetchBooks,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
}));

// Mock BookReview component
vi.mock('../../components/BookReview', () => ({
  default: ({ review }) => <div data-testid="book-review">{review.content}</div>,
}));

// Mock ReviewForm component
vi.mock('../../components/ReviewForm', () => ({
  default: ({ bookId }) => <div data-testid="review-form">ReviewForm for book {bookId}</div>,
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
  description: 'A comprehensive book about computer systems.',
  publishDate: '2023-01-15',
};

const sampleBookNoStock = {
  id: 2,
  title: 'Out of Stock Book',
  author: 'Some Author',
  rating: 3,
  category: { name: 'Science' },
  availableCount: 0,
  coverUrl: null,
  description: 'A book with no available copies.',
};

const sampleReviews = [
  { id: 1, bookId: 1, content: 'Great book!', likeCount: 10, createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, bookId: 1, content: 'Very helpful', likeCount: 5, createdAt: '2024-02-01T00:00:00Z' },
];

const sampleSimilarBooks = [
  { id: 3, title: 'Similar Book 1', author: 'Author A', coverUrl: 'https://example.com/similar1.jpg' },
  { id: 4, title: 'Similar Book 2', author: 'Author B', coverUrl: null },
];

describe('BookDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
    mockGetSimilarBooks.mockResolvedValue(sampleSimilarBooks);
  });

  describe('Modal Rendering with Book Data', () => {
    it('renders modal when selectedBook is set', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      expect(screen.getByText('Computer Systems')).toBeInTheDocument();
      expect(screen.getByText('Randal E. Bryant')).toBeInTheDocument();
    });

    it('does not render book content when selectedBook is null', () => {
      storeOverrides = { selectedBook: null };
      render(<BookDetailModal />);

      expect(screen.queryByText('Computer Systems')).not.toBeInTheDocument();
    });

    it('displays book cover image when coverUrl is provided', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      const coverImg = screen.getByAltText('Computer Systems');
      expect(coverImg).toBeInTheDocument();
      expect(coverImg.src).toBe('https://example.com/cover.jpg');
    });

    it('displays placeholder when no coverUrl', () => {
      storeOverrides = { selectedBook: sampleBookNoStock };
      render(<BookDetailModal />);

      expect(screen.getByText('📚')).toBeInTheDocument();
    });

    it('displays book description', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      expect(screen.getByText('A comprehensive book about computer systems.')).toBeInTheDocument();
    });

    it('displays publish date when available', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      expect(screen.getByText(/2023-01-15/)).toBeInTheDocument();
    });

    it('displays category tag', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      expect(screen.getByText('Computer')).toBeInTheDocument();
    });

    it('displays available count', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      expect(screen.getByText('Available: 3')).toBeInTheDocument();
    });

    it('displays out of stock tag when availableCount is 0', () => {
      storeOverrides = { selectedBook: sampleBookNoStock };
      render(<BookDetailModal />);

      expect(screen.getByText('Out of stock')).toBeInTheDocument();
    });

    it('fetches book reviews on mount', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      expect(mockFetchBookReviews).toHaveBeenCalledWith(1);
    });

    it('fetches similar books on mount', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      expect(mockGetSimilarBooks).toHaveBeenCalledWith(1);
    });
  });

  describe('Borrow Button', () => {
    it('shows borrow button when user is logged in and book is available', () => {
      storeOverrides = { selectedBook: sampleBook, currentUser: { id: 1, username: 'testuser' } };
      render(<BookDetailModal />);

      expect(screen.getByText('Borrow')).toBeInTheDocument();
    });

    it('does not show borrow button when user is not logged in', () => {
      storeOverrides = { selectedBook: sampleBook, currentUser: null };
      render(<BookDetailModal />);

      expect(screen.queryByText('Borrow')).not.toBeInTheDocument();
    });

    it('calls borrowBook and closes modal on successful borrow', async () => {
      mockBorrowBook.mockResolvedValue({});
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      const borrowButton = screen.getByText('Borrow');
      fireEvent.click(borrowButton);

      await waitFor(() => {
        expect(mockBorrowBook).toHaveBeenCalledWith(1);
        expect(mockSetSelectedBook).toHaveBeenCalledWith(null);
        expect(mockFetchBooks).toHaveBeenCalled();
      });
    });

    it('shows error on borrow failure', async () => {
      const { message } = await import('antd');
      mockBorrowBook.mockRejectedValue(new Error('Borrow failed'));
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      const borrowButton = screen.getByText('Borrow');
      fireEvent.click(borrowButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalled();
      });
    });
  });

  describe('Reserve Button', () => {
    it('shows reserve button when book is out of stock and user is logged in', () => {
      storeOverrides = { selectedBook: sampleBookNoStock, currentUser: { id: 1, username: 'testuser' } };
      render(<BookDetailModal />);

      expect(screen.getByText('Reserve')).toBeInTheDocument();
    });

    it('does not show reserve button when user is not logged in', () => {
      storeOverrides = { selectedBook: sampleBookNoStock, currentUser: null };
      render(<BookDetailModal />);

      expect(screen.queryByText('Reserve')).not.toBeInTheDocument();
    });

    it('calls reserveBook and closes modal on successful reservation', async () => {
      mockReserveBook.mockResolvedValue({});
      storeOverrides = { selectedBook: sampleBookNoStock };
      render(<BookDetailModal />);

      const reserveButton = screen.getByText('Reserve');
      fireEvent.click(reserveButton);

      await waitFor(() => {
        expect(mockReserveBook).toHaveBeenCalledWith(2);
        expect(mockSetSelectedBook).toHaveBeenCalledWith(null);
      });
    });

    it('shows error on reserve failure', async () => {
      const { message } = await import('antd');
      mockReserveBook.mockRejectedValue(new Error('Reserve failed'));
      storeOverrides = { selectedBook: sampleBookNoStock };
      render(<BookDetailModal />);

      const reserveButton = screen.getByText('Reserve');
      fireEvent.click(reserveButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalled();
      });
    });
  });

  describe('Reviews Display', () => {
    it('shows review count in tab label', () => {
      storeOverrides = { selectedBook: sampleBook, reviews: sampleReviews };
      render(<BookDetailModal />);

      expect(screen.getByText('Reviews (2)')).toBeInTheDocument();
    });

    it('shows ReviewForm when user is logged in', () => {
      storeOverrides = { selectedBook: sampleBook, currentUser: { id: 1 } };
      render(<BookDetailModal />);

      expect(screen.getByTestId('review-form')).toBeInTheDocument();
    });

    it('does not show ReviewForm when user is not logged in', () => {
      storeOverrides = { selectedBook: sampleBook, currentUser: null };
      render(<BookDetailModal />);

      expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
    });

    it('renders reviews using BookReview component', () => {
      storeOverrides = { selectedBook: sampleBook, reviews: sampleReviews };
      render(<BookDetailModal />);

      expect(screen.getByText('Great book!')).toBeInTheDocument();
      expect(screen.getByText('Very helpful')).toBeInTheDocument();
    });

    it('shows no reviews message when there are no reviews', () => {
      storeOverrides = { selectedBook: sampleBook, reviews: [] };
      render(<BookDetailModal />);

      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    });

    it('shows sort buttons for reviews', () => {
      storeOverrides = { selectedBook: sampleBook, reviews: sampleReviews };
      render(<BookDetailModal />);

      expect(screen.getByText('Most Helpful')).toBeInTheDocument();
      expect(screen.getByText('Newest')).toBeInTheDocument();
    });
  });

  describe('Similar Books Display', () => {
    it('shows similar books tab when similar books exist', async () => {
      mockGetSimilarBooks.mockResolvedValue(sampleSimilarBooks);
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      await waitFor(() => {
        expect(screen.getByText('Similar Books')).toBeInTheDocument();
      });
    });

    it('does not show similar books tab when no similar books and not loading', async () => {
      mockGetSimilarBooks.mockResolvedValue([]);
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      await waitFor(() => {
        expect(screen.queryByText('Similar Books')).not.toBeInTheDocument();
      });
    });

    it('displays similar books content when tab is clicked', async () => {
      mockGetSimilarBooks.mockResolvedValue(sampleSimilarBooks);
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      // Wait for similar books tab to appear
      await waitFor(() => {
        expect(screen.getByText('Similar Books')).toBeInTheDocument();
      });

      // Click the similar books tab to show its content
      fireEvent.click(screen.getByText('Similar Books'));

      await waitFor(() => {
        expect(screen.getByText('Similar Book 1')).toBeInTheDocument();
        expect(screen.getByText('Similar Book 2')).toBeInTheDocument();
      });
    });

    it('clicking similar book sets it as selected book', async () => {
      mockGetSimilarBooks.mockResolvedValue(sampleSimilarBooks);
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      await waitFor(() => {
        expect(screen.getByText('Similar Books')).toBeInTheDocument();
      });

      // Click the similar tab first
      fireEvent.click(screen.getByText('Similar Books'));

      await waitFor(() => {
        // The similar book image should be present
        const similarImg = screen.getByAltText('Similar Book 1');
        expect(similarImg).toBeInTheDocument();
      });

      // Click on the similar book image (which has the onClick handler)
      const similarImg = screen.getByAltText('Similar Book 1');
      fireEvent.click(similarImg);

      expect(mockSetSelectedBook).toHaveBeenCalled();
    });
  });

  describe('Modal Close', () => {
    it('calls setSelectedBook(null) when cancel is clicked', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockSetSelectedBook).toHaveBeenCalledWith(null);
    });

    it('closes modal via X button', () => {
      storeOverrides = { selectedBook: sampleBook };
      render(<BookDetailModal />);

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn =>
        btn.classList.contains('ant-modal-close') ||
        btn.getAttribute('aria-label') === 'Close'
      );

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockSetSelectedBook).toHaveBeenCalledWith(null);
      }
    });
  });
});
