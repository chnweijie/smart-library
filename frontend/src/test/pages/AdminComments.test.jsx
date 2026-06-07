import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminComments from '../../pages/AdminComments';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'common.id': 'ID',
        'common.noData': 'No Data',
        'admin.reviewUser': 'User',
        'admin.reviewBook': 'Book',
        'admin.bookManagement': 'Management',
        'admin.approve': 'Approve',
        'admin.reject': 'Reject',
        'admin.approved': 'Approved',
        'admin.rejected': 'Rejected',
        'admin.confirmApprove': 'Confirm approve?',
        'admin.confirmReject': 'Confirm reject?',
        'review.rating': 'Rating',
        'review.content': 'Content',
        'nav.adminComments': 'Comment Review',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock store
const mockFetchPendingReviews = vi.fn(() => Promise.resolve());
const mockApproveReview = vi.fn(() => Promise.resolve());
const mockRejectReview = vi.fn(() => Promise.resolve());

const defaultStoreValues = {
  pendingReviews: [],
  fetchPendingReviews: mockFetchPendingReviews,
  approveReview: mockApproveReview,
  rejectReview: mockRejectReview,
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

const samplePendingReviews = [
  { id: 1, userId: 10, bookId: 20, rating: 5, content: 'Excellent book!' },
  { id: 2, userId: 11, bookId: 21, rating: 3, content: 'Average read' },
  { id: 3, userId: 12, bookId: 22, rating: 1, content: 'Not recommended' },
];

describe('AdminComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
  });

  describe('Initial Render', () => {
    it('renders page title', () => {
      render(<AdminComments />);

      expect(screen.getByText('Comment Review')).toBeInTheDocument();
    });

    it('renders table with pending review data', () => {
      storeOverrides = { pendingReviews: samplePendingReviews };
      render(<AdminComments />);

      expect(screen.getByText('Excellent book!')).toBeInTheDocument();
      expect(screen.getByText('Average read')).toBeInTheDocument();
      expect(screen.getByText('Not recommended')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<AdminComments />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getAllByText('User').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Book').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders user IDs and book IDs', () => {
      storeOverrides = { pendingReviews: samplePendingReviews };
      render(<AdminComments />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('11')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('21')).toBeInTheDocument();
    });

    it('renders rating values in tags', () => {
      storeOverrides = { pendingReviews: samplePendingReviews };
      render(<AdminComments />);

      // Ratings are rendered as Tag components with the numeric value
      // "5" and "1" are unique, but "3" might appear in other cells too
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    });

    it('renders approve and reject buttons for each row', () => {
      storeOverrides = { pendingReviews: samplePendingReviews };
      render(<AdminComments />);

      const approveButtons = screen.getAllByText('Approve');
      const rejectButtons = screen.getAllByText('Reject');
      expect(approveButtons.length).toBe(3);
      expect(rejectButtons.length).toBe(3);
    });
  });

  describe('Data Loading', () => {
    it('calls fetchPendingReviews on mount', () => {
      render(<AdminComments />);

      expect(mockFetchPendingReviews).toHaveBeenCalled();
    });

    it('shows loading spinner while fetching', () => {
      mockFetchPendingReviews.mockReturnValue(new Promise(() => {}));
      render(<AdminComments />);

      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  describe('Approve Review', () => {
    it('calls approveReview and fetchPendingReviews on approve confirm', async () => {
      const { message } = await import('antd');
      mockApproveReview.mockResolvedValue({});
      storeOverrides = { pendingReviews: samplePendingReviews };
      render(<AdminComments />);

      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      // Wait for Popconfirm to appear, then click OK
      const okButton = await screen.findByText('OK');
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(mockApproveReview).toHaveBeenCalledWith(1);
        expect(mockFetchPendingReviews).toHaveBeenCalledTimes(2); // once on mount, once after approve
        expect(message.success).toHaveBeenCalledWith('Approved');
      });
    });

    it('shows error message when approve fails', async () => {
      const { message } = await import('antd');
      mockApproveReview.mockRejectedValue(new Error('Approve failed'));
      storeOverrides = { pendingReviews: samplePendingReviews };
      render(<AdminComments />);

      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      const okButton = await screen.findByText('OK');
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Approve failed');
      });
    });
  });

  describe('Reject Review', () => {
    it('calls rejectReview and fetchPendingReviews on reject confirm', async () => {
      const { message } = await import('antd');
      mockRejectReview.mockResolvedValue({});
      storeOverrides = { pendingReviews: samplePendingReviews };
      render(<AdminComments />);

      const rejectButtons = screen.getAllByText('Reject');
      fireEvent.click(rejectButtons[0]);

      const okButton = await screen.findByText('OK');
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(mockRejectReview).toHaveBeenCalledWith(1);
        expect(mockFetchPendingReviews).toHaveBeenCalledTimes(2);
        expect(message.success).toHaveBeenCalledWith('Rejected');
      });
    });

    it('shows error message when reject fails', async () => {
      const { message } = await import('antd');
      mockRejectReview.mockRejectedValue(new Error('Reject failed'));
      storeOverrides = { pendingReviews: samplePendingReviews };
      render(<AdminComments />);

      const rejectButtons = screen.getAllByText('Reject');
      fireEvent.click(rejectButtons[0]);

      const okButton = await screen.findByText('OK');
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Reject failed');
      });
    });
  });

  describe('Empty State', () => {
    it('renders empty table with no data message when no pending reviews', () => {
      storeOverrides = { pendingReviews: [] };
      render(<AdminComments />);

      expect(screen.getByText('No Data')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error with fallback message when error has no message property', async () => {
      const { message } = await import('antd');
      mockApproveReview.mockRejectedValue({});
      storeOverrides = { pendingReviews: samplePendingReviews };
      render(<AdminComments />);

      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      const okButton = await screen.findByText('OK');
      fireEvent.click(okButton);

      await waitFor(() => {
        // When error has no message, it falls back to e.message || t('common.error')
        // Since e.message is undefined for {}, it should call with the error key
        expect(message.error).toHaveBeenCalled();
      });
    });
  });
});
