import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyReservation from '../../pages/MyReservation';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'reservation.title': 'My Reservations',
        'reservation.reservedBooks': 'Reserved Books',
        'reservation.cancelReservation': 'Cancel Reservation',
        'reservation.borrowNow': 'Borrow Now',
        'reservation.cancelSuccess': 'Reservation cancelled successfully',
        'reservation.borrowNowSuccess': 'Borrowed successfully',
        'reservation.reserveDate': 'Reserve Date',
        'reservation.status.reserving': 'Reserving',
        'reservation.status.ready': 'Ready to Pick Up',
        'reservation.status.cancelled': 'Cancelled',
        'reservation.status.expired': 'Expired',
        'reservation.info': 'Reservation Info',
        'reservation.info1': 'Info paragraph 1',
        'reservation.info2': 'Info paragraph 2',
        'reservation.info3': 'Info paragraph 3',
        'reservation.info4': 'Info paragraph 4',
        'common.noData': 'No data',
        'common.error': 'Error',
      };
      return map[key] || key;
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

// Mock useStore
const mockFetchReservations = vi.fn(() => Promise.resolve());
const mockCancelReservation = vi.fn();
const mockBorrowBook = vi.fn();
const mockFetchBooks = vi.fn(() => Promise.resolve());

const defaultStoreValues = {
  reservations: [],
  books: [],
  fetchReservations: mockFetchReservations,
  cancelReservation: mockCancelReservation,
  borrowBook: mockBorrowBook,
  fetchBooks: mockFetchBooks,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
}));

const sampleReservations = [
  {
    id: 1,
    bookId: 101,
    bookTitle: 'React Programming',
    status: 'PENDING',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    bookId: 102,
    bookTitle: 'Vue.js Guide',
    status: 'TAKEN',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 3,
    bookId: 103,
    bookTitle: 'Python Basics',
    status: 'CANCELLED',
    createdAt: '2024-01-05T09:00:00Z',
  },
  {
    id: 4,
    bookId: 104,
    bookTitle: 'Java Advanced',
    status: 'EXPIRED',
    createdAt: '2024-01-01T09:00:00Z',
  },
];

describe('MyReservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
  });

  describe('Initial Render', () => {
    it('renders page title', () => {
      render(<MyReservation />);

      expect(screen.getByText('My Reservations')).toBeInTheDocument();
    });

    it('renders reserved books card title', () => {
      render(<MyReservation />);

      expect(screen.getByText('Reserved Books')).toBeInTheDocument();
    });

    it('renders reservation info card', () => {
      render(<MyReservation />);

      expect(screen.getByText('Reservation Info')).toBeInTheDocument();
    });

    it('renders info paragraphs', () => {
      render(<MyReservation />);

      expect(screen.getByText('Info paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Info paragraph 2')).toBeInTheDocument();
      expect(screen.getByText('Info paragraph 3')).toBeInTheDocument();
      expect(screen.getByText('Info paragraph 4')).toBeInTheDocument();
    });

    it('calls fetchReservations on mount', () => {
      render(<MyReservation />);

      expect(mockFetchReservations).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reservation List Display', () => {
    it('renders reservation items with book titles', () => {
      storeOverrides = { reservations: sampleReservations };
      render(<MyReservation />);

      expect(screen.getByText('React Programming')).toBeInTheDocument();
      expect(screen.getByText('Vue.js Guide')).toBeInTheDocument();
      expect(screen.getByText('Python Basics')).toBeInTheDocument();
      expect(screen.getByText('Java Advanced')).toBeInTheDocument();
    });

    it('renders reserve date for each item', () => {
      storeOverrides = { reservations: [sampleReservations[0]] };
      render(<MyReservation />);

      expect(screen.getByText(/Reserve Date:/)).toBeInTheDocument();
    });

    it('renders status tags with correct text', () => {
      storeOverrides = { reservations: sampleReservations };
      render(<MyReservation />);

      expect(screen.getByText('Reserving')).toBeInTheDocument();
      expect(screen.getByText('Ready to Pick Up')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('renders emoji avatar for each item', () => {
      storeOverrides = { reservations: [sampleReservations[0]] };
      render(<MyReservation />);

      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    it('falls back to book object title when bookTitle is missing', () => {
      storeOverrides = {
        reservations: [{
          id: 1,
          bookId: 101,
          book: { title: 'Fallback Title' },
          status: 'PENDING',
          createdAt: '2024-01-15T10:00:00Z',
        }],
      };
      render(<MyReservation />);

      expect(screen.getByText('Fallback Title')).toBeInTheDocument();
    });

    it('falls back to books store lookup when bookTitle and book are missing', () => {
      storeOverrides = {
        reservations: [{
          id: 1,
          bookId: 101,
          status: 'PENDING',
          createdAt: '2024-01-15T10:00:00Z',
        }],
        books: [{ id: 101, title: 'Found in Books Store' }],
      };
      render(<MyReservation />);

      expect(screen.getByText('Found in Books Store')).toBeInTheDocument();
    });

    it('falls back to bookId hash when no title found', () => {
      storeOverrides = {
        reservations: [{
          id: 1,
          bookId: 101,
          status: 'PENDING',
          createdAt: '2024-01-15T10:00:00Z',
        }],
        books: [],
      };
      render(<MyReservation />);

      expect(screen.getByText('#101')).toBeInTheDocument();
    });
  });

  describe('User Interactions - Cancel Reservation', () => {
    it('renders Cancel Reservation button for PENDING status', () => {
      storeOverrides = { reservations: [sampleReservations[0]] };
      render(<MyReservation />);

      expect(screen.getByText('Cancel Reservation')).toBeInTheDocument();
    });

    it('calls cancelReservation and shows success message on success', async () => {
      mockCancelReservation.mockResolvedValue({});
      storeOverrides = { reservations: [sampleReservations[0]] };
      render(<MyReservation />);

      fireEvent.click(screen.getByText('Cancel Reservation'));

      await waitFor(() => {
        expect(mockCancelReservation).toHaveBeenCalledWith(1);
      });

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith('Reservation cancelled successfully');
      });
    });

    it('shows error message when cancelReservation fails', async () => {
      mockCancelReservation.mockRejectedValue(new Error('Cancel failed'));
      storeOverrides = { reservations: [sampleReservations[0]] };
      render(<MyReservation />);

      fireEvent.click(screen.getByText('Cancel Reservation'));

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Cancel failed');
      });
    });

    it('shows fallback error message when cancelReservation fails without message', async () => {
      mockCancelReservation.mockRejectedValue(new Error());
      storeOverrides = { reservations: [sampleReservations[0]] };
      render(<MyReservation />);

      fireEvent.click(screen.getByText('Cancel Reservation'));

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Error');
      });
    });
  });

  describe('User Interactions - Borrow Now', () => {
    it('renders Borrow Now button for TAKEN status', () => {
      storeOverrides = { reservations: [sampleReservations[1]] };
      render(<MyReservation />);

      expect(screen.getByText('Borrow Now')).toBeInTheDocument();
    });

    it('calls borrowBook and fetches reservations on success', async () => {
      mockBorrowBook.mockResolvedValue({});
      storeOverrides = { reservations: [sampleReservations[1]] };
      render(<MyReservation />);

      fireEvent.click(screen.getByText('Borrow Now'));

      await waitFor(() => {
        expect(mockBorrowBook).toHaveBeenCalledWith(102);
      });

      await waitFor(() => {
        expect(mockFetchReservations).toHaveBeenCalledTimes(2); // once on mount, once after borrow
      });

      expect(mockFetchBooks).toHaveBeenCalled();

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith('Borrowed successfully');
      });
    });

    it('shows error message when borrowBook fails', async () => {
      mockBorrowBook.mockRejectedValue(new Error('Borrow failed'));
      storeOverrides = { reservations: [sampleReservations[1]] };
      render(<MyReservation />);

      fireEvent.click(screen.getByText('Borrow Now'));

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Borrow failed');
      });
    });
  });

  describe('Button Visibility by Status', () => {
    it('does not render action buttons for CANCELLED status', () => {
      storeOverrides = { reservations: [sampleReservations[2]] };
      render(<MyReservation />);

      expect(screen.queryByText('Cancel Reservation')).not.toBeInTheDocument();
      expect(screen.queryByText('Borrow Now')).not.toBeInTheDocument();
    });

    it('does not render action buttons for EXPIRED status', () => {
      storeOverrides = { reservations: [sampleReservations[3]] };
      render(<MyReservation />);

      expect(screen.queryByText('Cancel Reservation')).not.toBeInTheDocument();
      expect(screen.queryByText('Borrow Now')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty list with noData text when no reservations', () => {
      storeOverrides = { reservations: [] };
      render(<MyReservation />);

      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows spin component while loading', () => {
      // Make fetchReservations return a pending promise
      mockFetchReservations.mockReturnValue(new Promise(() => {}));
      render(<MyReservation />);

      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats createdAt as reserve date correctly', () => {
      storeOverrides = { reservations: [sampleReservations[0]] };
      render(<MyReservation />);

      expect(screen.getByText(/2024-01-15 10:00:00/)).toBeInTheDocument();
    });
  });
});
