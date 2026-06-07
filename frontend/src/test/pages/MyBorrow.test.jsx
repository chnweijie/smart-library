import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyBorrow from '../../pages/MyBorrow';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'borrow.title': 'My Borrowing',
        'borrow.currentBorrow': 'Current Borrows',
        'borrow.applyReturn': 'Apply Return',
        'borrow.cancelReturn': 'Cancel Return',
        'borrow.applyReturnSuccess': 'Return applied successfully',
        'borrow.cancelReturnSuccess': 'Return cancelled successfully',
        'borrow.operationFailed': 'Operation failed',
        'borrow.borrowDate': 'Borrow Date',
        'borrow.dueDate': 'Due Date',
        'borrow.borrowStatus.borrowing': 'Borrowing',
        'borrow.borrowStatus.pending': 'Pending Return',
        'borrow.borrowStatus.returned': 'Returned',
        'borrow.borrowStatus.rejected': 'Rejected',
        'borrow.borrowStatus.overdue': 'Overdue',
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
const mockFetchCurrentBorrows = vi.fn(() => Promise.resolve());
const mockApplyReturn = vi.fn();
const mockCancelReturn = vi.fn();

const defaultStoreValues = {
  borrows: [],
  fetchCurrentBorrows: mockFetchCurrentBorrows,
  applyReturn: mockApplyReturn,
  cancelReturn: mockCancelReturn,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
}));

const sampleBorrows = [
  {
    id: 1,
    book: { title: 'React Programming' },
    borrowDate: '2024-01-15T10:00:00Z',
    dueDate: '2024-02-15T10:00:00Z',
    status: 'BORROWING',
  },
  {
    id: 2,
    book: { title: 'Vue.js Guide' },
    borrowDate: '2024-01-10T08:00:00Z',
    dueDate: '2024-02-10T08:00:00Z',
    status: 'PENDING',
  },
  {
    id: 3,
    book: { title: 'Python Basics' },
    borrowDate: '2024-01-05T09:00:00Z',
    dueDate: '2024-02-05T09:00:00Z',
    status: 'OVERDUE',
  },
  {
    id: 4,
    book: { title: 'Java Advanced' },
    borrowDate: '2023-12-20T09:00:00Z',
    dueDate: '2024-01-20T09:00:00Z',
    status: 'RETURNED',
  },
  {
    id: 5,
    book: { title: 'C++ Primer' },
    borrowDate: '2023-12-15T09:00:00Z',
    dueDate: '2024-01-15T09:00:00Z',
    status: 'REJECTED',
  },
];

describe('MyBorrow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
  });

  describe('Initial Render', () => {
    it('renders page title', () => {
      render(<MyBorrow />);

      expect(screen.getByText('My Borrowing')).toBeInTheDocument();
    });

    it('renders current borrow card title', () => {
      render(<MyBorrow />);

      expect(screen.getByText('Current Borrows')).toBeInTheDocument();
    });

    it('calls fetchCurrentBorrows on mount', () => {
      render(<MyBorrow />);

      expect(mockFetchCurrentBorrows).toHaveBeenCalledTimes(1);
    });
  });

  describe('Borrow List Display', () => {
    it('renders borrow items with book titles', () => {
      storeOverrides = { borrows: sampleBorrows };
      render(<MyBorrow />);

      expect(screen.getByText('React Programming')).toBeInTheDocument();
      expect(screen.getByText('Vue.js Guide')).toBeInTheDocument();
      expect(screen.getByText('Python Basics')).toBeInTheDocument();
    });

    it('renders borrow date and due date for each item', () => {
      storeOverrides = { borrows: [sampleBorrows[0]] };
      render(<MyBorrow />);

      expect(screen.getByText(/Borrow Date:/)).toBeInTheDocument();
      expect(screen.getByText(/Due Date:/)).toBeInTheDocument();
    });

    it('renders status tags with correct text', () => {
      storeOverrides = { borrows: sampleBorrows };
      render(<MyBorrow />);

      expect(screen.getByText('Borrowing')).toBeInTheDocument();
      expect(screen.getByText('Pending Return')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('Returned')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('renders book emoji avatar for each item', () => {
      storeOverrides = { borrows: [sampleBorrows[0]] };
      render(<MyBorrow />);

      expect(screen.getByText('📚')).toBeInTheDocument();
    });
  });

  describe('User Interactions - Apply Return', () => {
    it('renders Apply Return button for BORROWING status items', () => {
      storeOverrides = { borrows: [sampleBorrows[0]] };
      render(<MyBorrow />);

      expect(screen.getByText('Apply Return')).toBeInTheDocument();
    });

    it('calls applyReturn and shows success message on success', async () => {
      mockApplyReturn.mockResolvedValue({});
      storeOverrides = { borrows: [sampleBorrows[0]] };
      render(<MyBorrow />);

      fireEvent.click(screen.getByText('Apply Return'));

      await waitFor(() => {
        expect(mockApplyReturn).toHaveBeenCalledWith(1);
      });

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith('Return applied successfully');
      });
    });

    it('shows error message when applyReturn fails', async () => {
      mockApplyReturn.mockRejectedValue(new Error('Network error'));
      storeOverrides = { borrows: [sampleBorrows[0]] };
      render(<MyBorrow />);

      fireEvent.click(screen.getByText('Apply Return'));

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('shows fallback error message when applyReturn fails without message', async () => {
      mockApplyReturn.mockRejectedValue(new Error());
      storeOverrides = { borrows: [sampleBorrows[0]] };
      render(<MyBorrow />);

      fireEvent.click(screen.getByText('Apply Return'));

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Operation failed');
      });
    });
  });

  describe('User Interactions - Cancel Return', () => {
    it('renders Cancel Return button for PENDING status items', () => {
      storeOverrides = { borrows: [sampleBorrows[1]] };
      render(<MyBorrow />);

      expect(screen.getByText('Cancel Return')).toBeInTheDocument();
    });

    it('calls cancelReturn and shows success message on success', async () => {
      mockCancelReturn.mockResolvedValue({});
      storeOverrides = { borrows: [sampleBorrows[1]] };
      render(<MyBorrow />);

      fireEvent.click(screen.getByText('Cancel Return'));

      await waitFor(() => {
        expect(mockCancelReturn).toHaveBeenCalledWith(2);
      });

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith('Return cancelled successfully');
      });
    });

    it('shows error message when cancelReturn fails', async () => {
      mockCancelReturn.mockRejectedValue(new Error('Cancel failed'));
      storeOverrides = { borrows: [sampleBorrows[1]] };
      render(<MyBorrow />);

      fireEvent.click(screen.getByText('Cancel Return'));

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Cancel failed');
      });
    });
  });

  describe('Button Visibility by Status', () => {
    it('does not render action buttons for RETURNED status', () => {
      storeOverrides = { borrows: [sampleBorrows[3]] };
      render(<MyBorrow />);

      expect(screen.queryByText('Apply Return')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel Return')).not.toBeInTheDocument();
    });

    it('does not render action buttons for REJECTED status', () => {
      storeOverrides = { borrows: [sampleBorrows[4]] };
      render(<MyBorrow />);

      expect(screen.queryByText('Apply Return')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel Return')).not.toBeInTheDocument();
    });

    it('does not render action buttons for OVERDUE status', () => {
      storeOverrides = { borrows: [sampleBorrows[2]] };
      render(<MyBorrow />);

      expect(screen.queryByText('Apply Return')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel Return')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty list when no borrows', () => {
      storeOverrides = { borrows: [] };
      render(<MyBorrow />);

      // Ant Design List with empty dataSource renders an empty container
      expect(screen.getByText('Current Borrows')).toBeInTheDocument();
      expect(screen.queryByText('Apply Return')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly by replacing T and truncating', () => {
      storeOverrides = {
        borrows: [{
          id: 1,
          book: { title: 'Test Book' },
          borrowDate: '2024-01-15T10:30:45Z',
          dueDate: '2024-02-15T10:30:45Z',
          status: 'BORROWING',
        }],
      };
      render(<MyBorrow />);

      expect(screen.getByText(/2024-01-15 10:30:45/)).toBeInTheDocument();
      expect(screen.getByText(/2024-02-15 10:30:45/)).toBeInTheDocument();
    });
  });
});
