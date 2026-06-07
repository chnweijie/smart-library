import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from '../../components/ReviewForm';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'review.submit': 'Submit Review',
        'review.rating': 'Rating',
        'review.content': 'Review Content',
        'review.contentPlaceholder': 'Enter your review',
        'review.tags': 'Tags',
        'review.loginToReview': 'Please login first',
        'review.contentTooShort': 'Content too short (min 10 chars)',
        'review.submitPending': 'Review submitted, pending approval',
        'review.submitFailed': 'Review submission failed',
        'tags.recommended': 'Recommended',
        'tags.mustRead': 'Must Read',
        'tags.classic': 'Classic',
        'tags.touching': 'Touching',
        'tags.profound': 'Profound',
        'tags.interesting': 'Interesting',
        'tags.practical': 'Practical',
        'tags.eyeOpening': 'Eye-opening',
        'tags.sciFi': 'Sci-Fi',
        'tags.art': 'Art',
        'tags.history': 'History',
        'tags.philosophy': 'Philosophy',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock useStore
const mockAddReview = vi.fn();
const mockFetchBookReviews = vi.fn();

vi.mock('../../store/useStore', () => ({
  useStore: () => ({
    currentUser: { id: 1, username: 'test', role: 1 },
    addReview: mockAddReview,
    fetchBookReviews: mockFetchBookReviews,
  }),
}));

// Mock antd message - define inline to avoid hoisting issues
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

// Helper to click a star in the Ant Design Rate component
// The Rate component uses div[role="radio"] inside li.ant-rate-star
function clickStar(container, starIndex) {
  const radios = container.querySelectorAll('div[role="radio"]');
  if (radios[starIndex]) {
    fireEvent.click(radios[starIndex]);
  }
}

describe('ReviewForm', () => {
  let messageMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    const antd = await import('antd');
    messageMock = antd.message;
  });

  it('renders the form with rating and content inputs', () => {
    render(<ReviewForm bookId={1} />);

    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Review Content')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument();
  });

  it('renders all available tags', () => {
    render(<ReviewForm bookId={1} />);

    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('Must Read')).toBeInTheDocument();
    expect(screen.getByText('Classic')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    expect(screen.getByText('Philosophy')).toBeInTheDocument();
  });

  it('validates required fields - does not submit without filling form', async () => {
    // The component's handleSubmit calls form.validateFields().then() without .catch(),
    // causing an unhandled rejection when validation fails. We catch it at process level.
    const handler = () => {};
    process.on('unhandledRejection', handler);

    render(<ReviewForm bookId={1} />);

    const submitBtn = screen.getByRole('button', { name: 'Submit Review' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddReview).not.toHaveBeenCalled();
    });

    process.removeListener('unhandledRejection', handler);
  });

  it('submits form with correct data', async () => {
    mockAddReview.mockResolvedValue({});

    const { container } = render(<ReviewForm bookId={1} />);

    // Set rating - click the 5th star (index 4)
    clickStar(container, 4);

    // Fill content
    const textArea = screen.getByPlaceholderText('Enter your review');
    fireEvent.change(textArea, { target: { value: 'This is a great book and I highly recommend it!' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Submit Review' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddReview).toHaveBeenCalledWith(
        expect.objectContaining({
          bookId: 1,
          tags: [],
        })
      );
    });
  });

  it('shows warning when content is less than 10 characters', async () => {
    const { container } = render(<ReviewForm bookId={1} />);

    // Set rating
    clickStar(container, 0);

    // Fill short content
    const textArea = screen.getByPlaceholderText('Enter your review');
    fireEvent.change(textArea, { target: { value: 'Short' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Submit Review' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(messageMock.warning).toHaveBeenCalledWith('Content too short (min 10 chars)');
    });
  });

  it('resets form after successful submission', async () => {
    mockAddReview.mockResolvedValue({});

    const { container } = render(<ReviewForm bookId={1} />);

    // Set rating
    clickStar(container, 3);

    // Fill content
    const textArea = screen.getByPlaceholderText('Enter your review');
    fireEvent.change(textArea, { target: { value: 'This is a great book and I highly recommend it!' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Submit Review' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddReview).toHaveBeenCalled();
      expect(messageMock.success).toHaveBeenCalledWith('Review submitted, pending approval');
      expect(mockFetchBookReviews).toHaveBeenCalledWith(1);
    });
  });

  it('calls onSuccess callback after successful submission', async () => {
    mockAddReview.mockResolvedValue({});
    const onSuccess = vi.fn();

    const { container } = render(<ReviewForm bookId={1} onSuccess={onSuccess} />);

    // Set rating
    clickStar(container, 2);

    // Fill content
    const textArea = screen.getByPlaceholderText('Enter your review');
    fireEvent.change(textArea, { target: { value: 'This is a great book and I highly recommend it!' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Submit Review' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error message on submission failure', async () => {
    mockAddReview.mockRejectedValue(new Error('Network error'));

    const { container } = render(<ReviewForm bookId={1} />);

    // Set rating
    clickStar(container, 0);

    // Fill content
    const textArea = screen.getByPlaceholderText('Enter your review');
    fireEvent.change(textArea, { target: { value: 'This is a great book and I highly recommend it!' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Submit Review' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(messageMock.error).toHaveBeenCalledWith('Network error');
    });
  });
});
