import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookReview from '../../components/BookReview';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'zh' },
  }),
}));

// Mock store
const mockVoteHelpful = vi.fn();
const mockAddReviewComment = vi.fn();
const mockFetchBookReviews = vi.fn();

vi.mock('../../store/useStore', () => ({
  useStore: () => ({
    currentUser: { id: 1, username: 'testuser', role: 1 },
    voteHelpful: mockVoteHelpful,
    addReviewComment: mockAddReviewComment,
    fetchBookReviews: mockFetchBookReviews,
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

// Mock request
vi.mock('../../api/request', () => ({
  default: {
    delete: vi.fn().mockResolvedValue({}),
  },
}));

// Mock formatDateTime
vi.mock('../../utils/userDisplay', () => ({
  formatDateTime: (v) => v || '',
}));

const sampleReview = {
  id: 1,
  username: 'alice',
  nickname: 'Alice',
  content: 'Great book!',
  rating: 4,
  likeCount: 5,
  replyCount: 2,
  createdAt: '2025-01-01T10:00:00',
  bookId: 100,
  tags: ['推荐', '经典'],
  replies: [
    {
      id: 10,
      username: 'bob',
      nickname: 'Bob',
      content: 'I agree!',
      createdAt: '2025-01-02T11:00:00',
      userId: 2,
    },
    {
      id: 11,
      username: 'carol',
      nickname: 'Carol',
      content: 'Me too',
      createdAt: '2025-01-03T12:00:00',
      userId: 3,
      replyToNickname: 'Bob',
    },
  ],
};

// Helper: find the main reply button (the one next to the helpful button, not inside reply cards)
function getMainReplyButton() {
  // The main reply button is the one with CommentOutlined icon
  // It contains "review.reply (2)" text
  return screen.getAllByText(/review\.reply/).find(el =>
    el.textContent.includes('review.reply') &&
    el.closest('.ant-space-item') &&
    !el.closest('.ant-card.ant-card-small')
  );
}

// Helper: find the submit reply button (inside the reply textarea area)
function getSubmitReplyButton() {
  // The submit button is a primary button with text "review.reply" inside the reply form
  const allReplyTexts = screen.getAllByText('review.reply');
  for (const el of allReplyTexts) {
    const btn = el.closest('button');
    if (btn && btn.classList.contains('ant-btn-primary')) {
      return btn;
    }
  }
  return null;
}

describe('BookReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders review content, username, rating, and tags', () => {
    render(<BookReview review={sampleReview} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Great book!')).toBeInTheDocument();
    expect(screen.getByText('推荐')).toBeInTheDocument();
    expect(screen.getByText('经典')).toBeInTheDocument();
  });

  it('renders replies list', () => {
    render(<BookReview review={sampleReview} />);

    expect(screen.getByText('I agree!')).toBeInTheDocument();
    expect(screen.getByText('Me too')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('renders reply-to indicator', () => {
    render(<BookReview review={sampleReview} />);

    expect(screen.getByText(/回复 @Bob/)).toBeInTheDocument();
  });

  it('renders helpful button with like count', () => {
    render(<BookReview review={sampleReview} />);

    expect(screen.getByText(/review\.helpful/)).toBeInTheDocument();
    expect(screen.getByText(/\(5\)/)).toBeInTheDocument();
  });

  it('calls voteHelpful and updates like count on successful vote', async () => {
    mockVoteHelpful.mockResolvedValue('review.voteSuccess');

    render(<BookReview review={sampleReview} />);

    const helpfulBtn = screen.getByText(/review\.helpful/);
    fireEvent.click(helpfulBtn);

    await waitFor(() => {
      expect(mockVoteHelpful).toHaveBeenCalledWith(sampleReview.id);
    });

    expect(screen.getByText(/review\.helped/)).toBeInTheDocument();
    expect(screen.getByText(/\(6\)/)).toBeInTheDocument();
  });

  it('calls voteHelpful and decrements like count on un-vote', async () => {
    mockVoteHelpful.mockResolvedValue('review.voteUnvoted');

    render(<BookReview review={sampleReview} />);

    const helpfulBtn = screen.getByText(/review\.helpful/);
    fireEvent.click(helpfulBtn);

    await waitFor(() => {
      expect(mockVoteHelpful).toHaveBeenCalledWith(sampleReview.id);
    });

    expect(screen.getByText(/\(4\)/)).toBeInTheDocument();
  });

  it('shows reply textarea when reply button is clicked', () => {
    render(<BookReview review={sampleReview} />);

    const replyBtn = getMainReplyButton();
    fireEvent.click(replyBtn);

    expect(screen.getByPlaceholderText('review.replyPlaceholder')).toBeInTheDocument();
  });

  it('submits reply successfully', async () => {
    mockAddReviewComment.mockResolvedValue('review.commentSuccess');

    render(<BookReview review={sampleReview} />);

    // Open reply
    const replyBtn = getMainReplyButton();
    fireEvent.click(replyBtn);

    // Type reply
    const textarea = screen.getByPlaceholderText('review.replyPlaceholder');
    fireEvent.change(textarea, { target: { value: 'My reply' } });

    // Submit
    const submitBtn = getSubmitReplyButton();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddReviewComment).toHaveBeenCalledWith(sampleReview.id, 'My reply', null);
    });

    await waitFor(() => {
      expect(mockFetchBookReviews).toHaveBeenCalledWith(sampleReview.bookId);
    });
  });

  it('shows warning when submitting empty reply', async () => {
    const { message } = await import('antd');

    render(<BookReview review={sampleReview} />);

    // Open reply
    const replyBtn = getMainReplyButton();
    fireEvent.click(replyBtn);

    // Submit without text
    const submitBtn = getSubmitReplyButton();
    fireEvent.click(submitBtn);

    expect(message.warning).toHaveBeenCalledWith('review.contentTooShort');
    expect(mockAddReviewComment).not.toHaveBeenCalled();
  });

  it('shows cancel button and hides reply on cancel', () => {
    render(<BookReview review={sampleReview} />);

    // Open reply
    const replyBtn = getMainReplyButton();
    fireEvent.click(replyBtn);

    expect(screen.getByText('common.cancel')).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByText('common.cancel'));

    expect(screen.queryByPlaceholderText('review.replyPlaceholder')).not.toBeInTheDocument();
  });

  it('renders review without tags when tags are empty', () => {
    const reviewNoTags = { ...sampleReview, tags: [] };
    render(<BookReview review={reviewNoTags} />);

    expect(screen.queryByText('推荐')).not.toBeInTheDocument();
    expect(screen.queryByText('经典')).not.toBeInTheDocument();
  });

  it('renders review without tags when tags is undefined', () => {
    const reviewNoTags = { ...sampleReview, tags: undefined };
    render(<BookReview review={reviewNoTags} />);

    expect(screen.queryByText('推荐')).not.toBeInTheDocument();
  });

  it('renders review without replies when replies is empty', () => {
    const reviewNoReplies = { ...sampleReview, replies: [], replyCount: 0 };
    render(<BookReview review={reviewNoReplies} />);

    expect(screen.queryByText('I agree!')).not.toBeInTheDocument();
  });

  it('handles vote error gracefully', async () => {
    const { message } = await import('antd');
    mockVoteHelpful.mockRejectedValue(new Error('Vote failed'));

    render(<BookReview review={sampleReview} />);

    const helpfulBtn = screen.getByText(/review\.helpful/);
    fireEvent.click(helpfulBtn);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Vote failed');
    });
  });

  it('handles reply submission error gracefully', async () => {
    const { message } = await import('antd');
    mockAddReviewComment.mockRejectedValue(new Error('Comment failed'));

    render(<BookReview review={sampleReview} />);

    // Open reply
    const replyBtn = getMainReplyButton();
    fireEvent.click(replyBtn);

    const textarea = screen.getByPlaceholderText('review.replyPlaceholder');
    fireEvent.change(textarea, { target: { value: 'My reply' } });

    const submitBtn = getSubmitReplyButton();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Comment failed');
    });
  });

  it('clicking reply on a reply sets replyToUser', async () => {
    render(<BookReview review={sampleReview} />);

    // Find the reply-to button on Bob's reply card
    const bobReplyCard = screen.getByText('I agree!').closest('.ant-card');
    const replyLinkInBob = bobReplyCard.querySelector('button');

    fireEvent.click(replyLinkInBob);

    // Reply textarea should be open with @Bob placeholder
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/review\.reply.*@Bob/)).toBeInTheDocument();
    });
  });
});
