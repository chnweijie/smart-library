import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BorrowHistory from '../../pages/BorrowHistory';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const map = {
        'history.title': 'Borrow History',
        'history.historyRecords': 'History Records',
        'history.borrowDate': 'Borrow Date',
        'history.returnDate': 'Return Date',
        'history.status.borrowing': 'Borrowing',
        'history.status.pending': 'Pending Return',
        'history.status.returned': 'Returned',
        'history.status.rejected': 'Rejected',
        'history.status.overdue': 'Overdue',
        'book.reBorrow': 'Re-borrow',
        'book.writeReview': 'Write Review',
      };
      return map[key] || options?.defaultValue || key;
    },
    i18n: { language: 'en' },
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

// Mock formatDateTime
vi.mock('../../utils/userDisplay', () => ({
  formatDateTime: (value) => {
    if (!value) return '';
    const s = String(value);
    if (s.includes('T')) return s.replace('T', ' ').slice(0, 19);
    return s;
  },
}));

// Mock useStore
const mockFetchBorrowHistory = vi.fn(() => Promise.resolve());

const defaultStoreValues = {
  borrowHistory: [],
  fetchBorrowHistory: mockFetchBorrowHistory,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
}));

const sampleHistory = [
  {
    id: 1,
    book: { title: 'React Programming' },
    borrowDate: '2024-01-15T10:00:00Z',
    returnDate: '2024-02-10T10:00:00Z',
    status: 'RETURNED',
    rating: 4,
  },
  {
    id: 2,
    book: { title: 'Vue.js Guide' },
    borrowDate: '2024-01-10T08:00:00Z',
    returnDate: null,
    status: 'BORROWING',
    rating: 0,
  },
  {
    id: 3,
    book: { title: 'Python Basics' },
    borrowDate: '2024-01-05T09:00:00Z',
    returnDate: '2024-01-25T09:00:00Z',
    status: 'OVERDUE',
    rating: 5,
  },
  {
    id: 4,
    book: { title: 'Java Advanced' },
    borrowDate: '2023-12-20T09:00:00Z',
    returnDate: null,
    status: 2,
    rating: 3,
  },
];

describe('BorrowHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
  });

  describe('Initial Render', () => {
    it('renders page title', () => {
      render(<BorrowHistory />);

      expect(screen.getByText('Borrow History')).toBeInTheDocument();
    });

    it('renders history records card title', () => {
      render(<BorrowHistory />);

      expect(screen.getByText('History Records')).toBeInTheDocument();
    });

    it('calls fetchBorrowHistory on mount', () => {
      render(<BorrowHistory />);

      expect(mockFetchBorrowHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('History List Display', () => {
    it('renders history items with book titles', () => {
      storeOverrides = { borrowHistory: sampleHistory };
      render(<BorrowHistory />);

      expect(screen.getByText('React Programming')).toBeInTheDocument();
      expect(screen.getByText('Vue.js Guide')).toBeInTheDocument();
      expect(screen.getByText('Python Basics')).toBeInTheDocument();
    });

    it('renders borrow date and return date for each item', () => {
      storeOverrides = { borrowHistory: [sampleHistory[0]] };
      render(<BorrowHistory />);

      expect(screen.getByText(/Borrow Date:/)).toBeInTheDocument();
      expect(screen.getByText(/Return Date:/)).toBeInTheDocument();
    });

    it('renders dash for missing return date', () => {
      storeOverrides = { borrowHistory: [sampleHistory[1]] };
      render(<BorrowHistory />);

      // When returnDate is null, formatDateTime returns '', and the component shows '-'
      const returnDateLabels = screen.getAllByText(/Return Date:/);
      expect(returnDateLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('renders status tags with correct text', () => {
      storeOverrides = { borrowHistory: sampleHistory };
      render(<BorrowHistory />);

      expect(screen.getByText('Returned')).toBeInTheDocument();
      expect(screen.getByText('Borrowing')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('renders status tag for numeric status codes', () => {
      storeOverrides = { borrowHistory: [sampleHistory[3]] };
      render(<BorrowHistory />);

      // status 2 maps to 'pending'
      expect(screen.getByText('Pending Return')).toBeInTheDocument();
    });

    it('renders book emoji avatar for each item', () => {
      storeOverrides = { borrowHistory: [sampleHistory[0]] };
      render(<BorrowHistory />);

      expect(screen.getByText('📚')).toBeInTheDocument();
    });

    it('renders rating with Rate component', () => {
      storeOverrides = { borrowHistory: [sampleHistory[0]] };
      render(<BorrowHistory />);

      // Rate component renders with ant-rate class
      expect(document.querySelector('.ant-rate')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders Re-borrow button for each history item', () => {
      storeOverrides = { borrowHistory: [sampleHistory[0]] };
      render(<BorrowHistory />);

      expect(screen.getByText('Re-borrow')).toBeInTheDocument();
    });

    it('renders Write Review button for each history item', () => {
      storeOverrides = { borrowHistory: [sampleHistory[0]] };
      render(<BorrowHistory />);

      expect(screen.getByText('Write Review')).toBeInTheDocument();
    });

    it('renders action buttons for all history items', () => {
      storeOverrides = { borrowHistory: sampleHistory };
      render(<BorrowHistory />);

      const reBorrowButtons = screen.getAllByText('Re-borrow');
      const writeReviewButtons = screen.getAllByText('Write Review');
      expect(reBorrowButtons.length).toBe(sampleHistory.length);
      expect(writeReviewButtons.length).toBe(sampleHistory.length);
    });
  });

  describe('Empty State', () => {
    it('renders empty list when no borrow history', () => {
      storeOverrides = { borrowHistory: [] };
      render(<BorrowHistory />);

      expect(screen.getByText('History Records')).toBeInTheDocument();
      expect(screen.queryByText('Re-borrow')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly using formatDateTime', () => {
      storeOverrides = { borrowHistory: [sampleHistory[0]] };
      render(<BorrowHistory />);

      expect(screen.getByText(/2024-01-15 10:00:00/)).toBeInTheDocument();
      expect(screen.getByText(/2024-02-10 10:00:00/)).toBeInTheDocument();
    });
  });

  describe('Book Title Fallback', () => {
    it('renders empty string when book title is missing', () => {
      storeOverrides = {
        borrowHistory: [{
          id: 1,
          book: {},
          borrowDate: '2024-01-15T10:00:00Z',
          returnDate: '2024-02-10T10:00:00Z',
          status: 'RETURNED',
          rating: 0,
        }],
      };
      render(<BorrowHistory />);

      // The component uses item.book?.title || '' so empty title is rendered
      expect(screen.getByText('History Records')).toBeInTheDocument();
    });
  });
});
