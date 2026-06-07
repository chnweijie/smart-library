import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminReview from '../../pages/AdminReview';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'common.id': 'ID',
        'common.error': 'Error',
        'common.confirm': 'Confirm',
        'common.cancel': 'Cancel',
        'admin.reviewUser': 'User',
        'admin.reviewBook': 'Book',
        'admin.applyTime': 'Apply Time',
        'admin.reviewManagement': 'Review Management',
        'admin.approve': 'Approve',
        'admin.reject': 'Reject',
        'admin.approved': 'Approved',
        'admin.rejected': 'Rejected',
        'admin.processed': 'Processed',
        'admin.confirmApprove': 'Confirm approve?',
        'admin.confirmReject': 'Confirm reject?',
        'admin.status.pending': 'Pending',
        'admin.status.approved': 'Approved',
        'admin.status.rejected': 'Rejected',
        'profile.accountStatus': 'Status',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock store
const mockFetchReviewRequests = vi.fn(() => Promise.resolve());
const mockApproveReturn = vi.fn(() => Promise.resolve());
const mockRejectReturn = vi.fn(() => Promise.resolve());
const mockFetchBooks = vi.fn(() => Promise.resolve());

const defaultStoreValues = {
  reviewRequests: [],
  fetchReviewRequests: mockFetchReviewRequests,
  approveReturn: mockApproveReturn,
  rejectReturn: mockRejectReturn,
  fetchBooks: mockFetchBooks,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
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

const sampleReviewRequests = [
  {
    id: 1,
    user: { username: 'alice' },
    book: { title: 'React Guide' },
    createdAt: '2024-01-15T10:30:00Z',
    status: 'PENDING',
  },
  {
    id: 2,
    user: { username: 'bob' },
    book: { title: 'Vue Handbook' },
    createdAt: '2024-01-14T08:00:00Z',
    status: 'APPROVED',
  },
  {
    id: 3,
    user: 'charlie',
    book: 'Python Basics',
    createdAt: '2024-01-13T12:00:00Z',
    status: 'REJECTED',
  },
];

describe('AdminReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
  });

  describe('Initial Render', () => {
    it('renders page title in heading', () => {
      render(<AdminReview />);

      // "Review Management" appears in h2 and also in the action column header
      const h2 = document.querySelector('h2');
      expect(h2).toBeInTheDocument();
      expect(h2.textContent).toBe('Review Management');
    });

    it('renders table with review request data', () => {
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
      expect(screen.getByText('charlie')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<AdminReview />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      // "User", "Book", "Status" may appear in multiple places
      expect(screen.getAllByText('User').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Book').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Apply Time')).toBeInTheDocument();
      expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
    });

    it('renders status tags with correct labels', () => {
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
      // "Approved" appears as both a status tag and an action button text
      expect(screen.getAllByText('Approved').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Rejected').length).toBeGreaterThanOrEqual(1);
    });

    it('renders book titles from nested object', () => {
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      expect(screen.getByText('React Guide')).toBeInTheDocument();
      expect(screen.getByText('Vue Handbook')).toBeInTheDocument();
      expect(screen.getByText('Python Basics')).toBeInTheDocument();
    });

    it('renders formatted dates', () => {
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      // formatDate replaces T with space and truncates to 19 chars
      expect(screen.getByText('2024-01-15 10:30:00')).toBeInTheDocument();
      expect(screen.getByText('2024-01-14 08:00:00')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('calls fetchReviewRequests on mount', () => {
      render(<AdminReview />);

      expect(mockFetchReviewRequests).toHaveBeenCalled();
    });

    it('shows loading spinner while fetching', () => {
      mockFetchReviewRequests.mockReturnValue(new Promise(() => {}));
      render(<AdminReview />);

      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  describe('Approve Return', () => {
    it('renders approve button for pending requests', () => {
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      const approveButtons = screen.getAllByText('Approve');
      expect(approveButtons.length).toBe(1); // Only one pending request
    });

    it('calls approveReturn and fetchBooks on approve confirm', async () => {
      const { message } = await import('antd');
      mockApproveReturn.mockResolvedValue({});
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      // Popconfirm uses okText={t('common.confirm')} which maps to "Confirm"
      const confirmButton = await screen.findByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockApproveReturn).toHaveBeenCalledWith(1);
        expect(mockFetchBooks).toHaveBeenCalled();
        expect(message.success).toHaveBeenCalledWith('Approved');
      });
    });

    it('shows error message when approve fails', async () => {
      const { message } = await import('antd');
      mockApproveReturn.mockRejectedValue(new Error('Approve failed'));
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      const confirmButton = await screen.findByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Approve failed');
      });
    });
  });

  describe('Reject Return', () => {
    it('renders reject button for pending requests', () => {
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      const rejectButtons = screen.getAllByText('Reject');
      expect(rejectButtons.length).toBe(1); // Only one pending request
    });

    it('calls rejectReturn on reject confirm', async () => {
      const { message } = await import('antd');
      mockRejectReturn.mockResolvedValue({});
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      const rejectButtons = screen.getAllByText('Reject');
      fireEvent.click(rejectButtons[0]);

      const confirmButton = await screen.findByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockRejectReturn).toHaveBeenCalledWith(1);
        expect(message.success).toHaveBeenCalledWith('Rejected');
      });
    });

    it('shows error message when reject fails', async () => {
      const { message } = await import('antd');
      mockRejectReturn.mockRejectedValue(new Error('Reject failed'));
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      const rejectButtons = screen.getAllByText('Reject');
      fireEvent.click(rejectButtons[0]);

      const confirmButton = await screen.findByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Reject failed');
      });
    });
  });

  describe('Processed Requests', () => {
    it('shows "Processed" text for non-pending requests', () => {
      storeOverrides = { reviewRequests: sampleReviewRequests };
      render(<AdminReview />);

      // Two processed requests (approved and rejected)
      const processedTexts = screen.getAllByText('Processed');
      expect(processedTexts.length).toBe(2);
    });
  });

  describe('Empty State', () => {
    it('renders empty table when no review requests', () => {
      storeOverrides = { reviewRequests: [] };
      render(<AdminReview />);

      expect(document.querySelector('.ant-empty')).toBeInTheDocument();
    });
  });
});
