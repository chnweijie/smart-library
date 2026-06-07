import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmotionAnalysis from '../../pages/EmotionAnalysis';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const map = {
        'emotion.title': 'Emotion Analysis',
        'emotion.subtitle': 'Discover books based on your mood',
        'emotion.needLogin': 'Please log in first',
        'emotion.privacyTitle': 'Privacy Protection',
        'emotion.privacyContent': 'Your facial data is processed locally and never uploaded',
        'emotion.privacyAgree': 'I Agree',
        'emotion.startDetection': 'Start Detection',
        'emotion.stopDetection': 'Stop Detection',
        'emotion.loadingModel': 'Loading Model...',
        'emotion.detecting': 'Detecting...',
        'emotion.noFaceDetected': 'No face detected',
        'emotion.emotionScores': 'Emotion Scores',
        'emotion.currentEmotion': 'Current Emotion',
        'emotion.recommendedBooks': 'Recommended Books',
        'emotion.basedOnEmotion': `Based on your ${options?.emotion ?? 'neutral'} emotion`,
        'emotion.noRecommend': 'No recommendations available',
        'emotion.happy': 'Happy',
        'emotion.sad': 'Sad',
        'emotion.angry': 'Angry',
        'emotion.fearful': 'Fearful',
        'emotion.surprised': 'Surprised',
        'emotion.disgusted': 'Disgusted',
        'emotion.neutral': 'Neutral',
        'emotion.modelLoadFailed': 'Model load failed',
        'emotion.detectionFailed': 'Detection failed',
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

// Mock @vladmandic/face-api
vi.mock('@vladmandic/face-api', () => ({
  nets: {
    tinyFaceDetector: { loadFromUri: vi.fn(() => Promise.resolve()) },
    faceLandmark68Net: { loadFromUri: vi.fn(() => Promise.resolve()) },
    faceExpressionNet: { loadFromUri: vi.fn(() => Promise.resolve()) },
  },
  detectSingleFace: vi.fn(),
  TinyFaceDetectorOptions: vi.fn(),
}));

// Mock useEmotionDetection hook
const mockLoadModels = vi.fn(() => Promise.resolve());
const mockStartDetection = vi.fn(() => Promise.resolve());
const mockStopDetection = vi.fn();

let emotionDetectionOverrides = {};

vi.mock('../../hooks/useEmotionDetection', () => ({
  default: () => ({
    videoRef: { current: null },
    isModelLoaded: false,
    isDetecting: false,
    emotion: null,
    emotionScores: null,
    error: null,
    isLoading: false,
    loadModels: mockLoadModels,
    startDetection: mockStartDetection,
    stopDetection: mockStopDetection,
    ...emotionDetectionOverrides,
  }),
}));

// Mock emotionMapping utils
vi.mock('../../utils/emotionMapping', () => ({
  getEmotionConfig: (emotion) => {
    const configs = {
      happy: { categoryNames: ['Literature', 'Art'], labelKey: 'emotion.happy', emoji: '😊', color: '#52c41a' },
      sad: { categoryNames: ['Tech', 'Philosophy'], labelKey: 'emotion.sad', emoji: '😢', color: '#1890ff' },
      angry: { categoryNames: ['Philosophy', 'Art'], labelKey: 'emotion.angry', emoji: '😠', color: '#ff4d4f' },
      fearful: { categoryNames: ['Philosophy', 'Tech'], labelKey: 'emotion.fearful', emoji: '😨', color: '#722ed1' },
      surprised: { categoryNames: ['Tech', 'History'], labelKey: 'emotion.surprised', emoji: '😮', color: '#faad14' },
      disgusted: { categoryNames: ['Art', 'Philosophy'], labelKey: 'emotion.disgusted', emoji: '😒', color: '#eb2f96' },
      neutral: { categoryNames: ['Literature', 'History'], labelKey: 'emotion.neutral', emoji: '😐', color: '#8c8c8c' },
    };
    return configs[emotion] || configs.neutral;
  },
  EMOTION_KEYS: ['happy', 'sad', 'angry', 'fearful', 'surprised', 'disgusted', 'neutral'],
  getBooksByEmotion: vi.fn((emotion, books) => {
    if (!books || books.length === 0) return [];
    return books.slice(0, 6);
  }),
}));

// Mock BookCard component
vi.mock('../../components/BookCard', () => ({
  default: ({ book }) => <div data-testid="book-card">{book.title}</div>,
}));

// Mock useStore
const mockFetchBooks = vi.fn(() => Promise.resolve());
const mockFetchCategories = vi.fn(() => Promise.resolve());
const mockFetchEmotionRecommend = vi.fn(() => Promise.resolve([]));

const defaultStoreValues = {
  currentUser: { id: 1, username: 'testuser' },
  books: [],
  categories: [],
  fetchBooks: mockFetchBooks,
  fetchCategories: mockFetchCategories,
  fetchEmotionRecommend: mockFetchEmotionRecommend,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
}));

const sampleBooks = [
  { id: 1, title: 'Happy Book 1', rating: 4.5, categoryId: 'cat1' },
  { id: 2, title: 'Happy Book 2', rating: 4.0, categoryId: 'cat1' },
  { id: 3, title: 'Sad Book 1', rating: 3.5, categoryId: 'cat2' },
];

const sampleCategories = [
  { id: 'cat1', name: 'Literature' },
  { id: 'cat2', name: 'Tech' },
];

describe('EmotionAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
    emotionDetectionOverrides = {};
  });

  describe('Login Required', () => {
    it('shows login required message when user is not logged in', () => {
      storeOverrides = { currentUser: null };
      render(<EmotionAnalysis />);

      expect(screen.getByText('Please log in first')).toBeInTheDocument();
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('does not show login required when user is logged in', () => {
      render(<EmotionAnalysis />);

      expect(screen.queryByText('Please log in first')).not.toBeInTheDocument();
    });
  });

  describe('Privacy Agreement', () => {
    it('shows privacy agreement screen when not yet agreed', () => {
      render(<EmotionAnalysis />);

      expect(screen.getByText('Privacy Protection')).toBeInTheDocument();
      expect(screen.getByText('Your facial data is processed locally and never uploaded')).toBeInTheDocument();
      expect(screen.getByText('I Agree')).toBeInTheDocument();
    });

    it('shows page title and subtitle on privacy screen', () => {
      render(<EmotionAnalysis />);

      expect(screen.getByText('Emotion Analysis')).toBeInTheDocument();
      expect(screen.getByText('Discover books based on your mood')).toBeInTheDocument();
    });

    it('transitions to main content after agreeing to privacy', async () => {
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.queryByText('Privacy Protection')).not.toBeInTheDocument();
      });

      // Should now show the main detection UI
      expect(screen.getByText('Emotion Scores')).toBeInTheDocument();
    });

    it('calls loadModels after agreeing to privacy', async () => {
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(mockLoadModels).toHaveBeenCalledTimes(1);
      });
    });

    it('calls fetchBooks and fetchCategories after agreeing when stores are empty', async () => {
      storeOverrides = { books: [], categories: [] };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(mockFetchBooks).toHaveBeenCalledTimes(1);
        expect(mockFetchCategories).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call fetchBooks when books already loaded', async () => {
      storeOverrides = { books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(mockLoadModels).toHaveBeenCalled();
      });

      expect(mockFetchBooks).not.toHaveBeenCalled();
      expect(mockFetchCategories).not.toHaveBeenCalled();
    });
  });

  describe('Main Content Display', () => {
    beforeEach(() => {
      // Skip privacy screen by pre-agreeing
    });

    it('renders page title and subtitle after privacy agreement', async () => {
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getAllByText('Emotion Analysis').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Discover books based on your mood')).toBeInTheDocument();
      });
    });

    it('renders emotion scores card', async () => {
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByText('Emotion Scores')).toBeInTheDocument();
      });
    });

    it('renders start detection button when model is loaded', async () => {
      emotionDetectionOverrides = { isModelLoaded: true };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        // "Start Detection" appears in both overlay text and button
        const startTexts = screen.getAllByText('Start Detection');
        expect(startTexts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders loading model text when model is not loaded', async () => {
      emotionDetectionOverrides = { isModelLoaded: false, isLoading: false };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByText('Loading Model...')).toBeInTheDocument();
      });
    });

    it('renders stop detection button when detecting', async () => {
      emotionDetectionOverrides = { isDetecting: true, isModelLoaded: true };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByText('Stop Detection')).toBeInTheDocument();
      });
    });

    it('shows no face detected message when not detecting and no emotion', async () => {
      emotionDetectionOverrides = { isDetecting: false, emotion: null, isModelLoaded: true };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByText('No face detected')).toBeInTheDocument();
      });
    });

    it('shows detecting message when detecting but no emotion yet', async () => {
      emotionDetectionOverrides = { isDetecting: true, emotion: null };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByText('Detecting...')).toBeInTheDocument();
      });
    });
  });

  describe('Emotion Display', () => {
    it('renders current emotion when emotion is detected', async () => {
      emotionDetectionOverrides = { emotion: 'happy', emotionScores: { happy: 0.8, neutral: 0.2 } };
      storeOverrides = { currentUser: { id: 1 }, books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        // "Happy" appears in both the emotion header (h3) and the scores bar label
        const happyTexts = screen.getAllByText('Happy');
        expect(happyTexts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders emotion scores bars when emotionScores is available', async () => {
      emotionDetectionOverrides = {
        emotion: 'happy',
        emotionScores: { happy: 0.8, sad: 0.1, neutral: 0.1 },
      };
      storeOverrides = { currentUser: { id: 1 }, books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        // Emotion labels should be rendered - "Happy" appears in header and bar
        const happyTexts = screen.getAllByText('Happy');
        expect(happyTexts.length).toBeGreaterThanOrEqual(1);
        // "Sad" and "Neutral" should appear in the bar labels
        expect(screen.getByText('Sad')).toBeInTheDocument();
        expect(screen.getByText('Neutral')).toBeInTheDocument();
      });
    });

    it('renders error tag when there is an error', async () => {
      emotionDetectionOverrides = { error: 'emotion.modelLoadFailed', isModelLoaded: false };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        // The component renders {t(error)} which translates 'emotion.modelLoadFailed' to 'Model load failed'
        expect(screen.getByText('Model load failed')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions - Detection', () => {
    it('calls startDetection when Start Detection button is clicked', async () => {
      emotionDetectionOverrides = { isModelLoaded: true };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        // Find the button (not the overlay text) by role
        const startButton = screen.getByRole('button', { name: /Start Detection/ });
        expect(startButton).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /Start Detection/ });
      fireEvent.click(startButton);

      expect(mockStartDetection).toHaveBeenCalledTimes(1);
    });

    it('calls stopDetection when Stop Detection button is clicked', async () => {
      emotionDetectionOverrides = { isDetecting: true, isModelLoaded: true };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stop Detection/ })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Stop Detection/ }));

      expect(mockStopDetection).toHaveBeenCalledTimes(1);
    });

    it('disables Start Detection button when model is not loaded', async () => {
      emotionDetectionOverrides = { isModelLoaded: false, isLoading: false };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /Start Detection/ });
        expect(startButton).toBeDisabled();
      });
    });
  });

  describe('Book Recommendations', () => {
    it('renders recommended books section when emotion is detected', async () => {
      emotionDetectionOverrides = { emotion: 'happy', emotionScores: { happy: 0.8 } };
      mockFetchEmotionRecommend.mockResolvedValue(sampleBooks);
      storeOverrides = { currentUser: { id: 1 }, books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByText('Recommended Books')).toBeInTheDocument();
      });
    });

    it('calls fetchEmotionRecommend when emotion is detected', async () => {
      emotionDetectionOverrides = { emotion: 'happy', emotionScores: { happy: 0.8 } };
      mockFetchEmotionRecommend.mockResolvedValue(sampleBooks);
      storeOverrides = { currentUser: { id: 1 }, books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(mockFetchEmotionRecommend).toHaveBeenCalledWith('happy');
      });
    });

    it('renders book cards when recommendations are available', async () => {
      emotionDetectionOverrides = { emotion: 'happy', emotionScores: { happy: 0.8 } };
      mockFetchEmotionRecommend.mockResolvedValue(sampleBooks);
      storeOverrides = { currentUser: { id: 1 }, books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByText('Happy Book 1')).toBeInTheDocument();
        expect(screen.getByText('Happy Book 2')).toBeInTheDocument();
      });
    });

    it('falls back to getBooksByEmotion when fetchEmotionRecommend returns empty', async () => {
      const { getBooksByEmotion } = await import('../../utils/emotionMapping');
      emotionDetectionOverrides = { emotion: 'happy', emotionScores: { happy: 0.8 } };
      mockFetchEmotionRecommend.mockResolvedValue([]);
      storeOverrides = { currentUser: { id: 1 }, books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(getBooksByEmotion).toHaveBeenCalledWith('happy', sampleBooks, sampleCategories);
      });
    });

    it('falls back to getBooksByEmotion when fetchEmotionRecommend fails', async () => {
      const { getBooksByEmotion } = await import('../../utils/emotionMapping');
      emotionDetectionOverrides = { emotion: 'happy', emotionScores: { happy: 0.8 } };
      mockFetchEmotionRecommend.mockRejectedValue(new Error('API error'));
      storeOverrides = { currentUser: { id: 1 }, books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(getBooksByEmotion).toHaveBeenCalledWith('happy', sampleBooks, sampleCategories);
      });
    });

    it('does not render recommended books section when no emotion', async () => {
      emotionDetectionOverrides = { emotion: null };
      storeOverrides = { currentUser: { id: 1 }, books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.queryByText('Recommended Books')).not.toBeInTheDocument();
      });
    });

    it('shows no recommendations message when no books available', async () => {
      emotionDetectionOverrides = { emotion: 'happy', emotionScores: { happy: 0.8 } };
      mockFetchEmotionRecommend.mockResolvedValue([]);
      storeOverrides = { currentUser: { id: 1 }, books: [], categories: [] };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByText('No recommendations available')).toBeInTheDocument();
      });
    });

    it('shows loading spinner while fetching recommendations', async () => {
      emotionDetectionOverrides = { emotion: 'happy', emotionScores: { happy: 0.8 } };
      mockFetchEmotionRecommend.mockReturnValue(new Promise(() => {})); // never resolves
      storeOverrides = { currentUser: { id: 1 }, books: sampleBooks, categories: sampleCategories };
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(screen.getByText('Recommended Books')).toBeInTheDocument();
      });

      // Should show a loading spinner in the recommendations card
      const spinElements = document.querySelectorAll('.ant-spin');
      expect(spinElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Video Element', () => {
    it('renders video element in the camera card', async () => {
      render(<EmotionAnalysis />);

      fireEvent.click(screen.getByText('I Agree'));

      await waitFor(() => {
        expect(document.querySelector('video')).toBeInTheDocument();
      });
    });
  });
});
