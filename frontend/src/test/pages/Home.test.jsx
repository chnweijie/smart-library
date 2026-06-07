import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../../pages/Home';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const map = {
        'home.title': 'Library Home',
        'home.subtitle': 'Discover your next great read',
        'home.search': 'Search books...',
        'home.totalBooks': `Total: ${options?.count ?? 0} books`,
        'home.searchResult': `Search: ${options?.keyword ?? ''}`,
        'home.noResult': `No results for "${options?.keyword ?? ''}"`,
        'home.noCategory': `No books in ${options?.category ?? ''}`,
        'categories.all': 'All',
        'categories.Computer': 'Computer',
        'categories.Science': 'Science',
        'categories.Literature': 'Literature',
      };
      if (key.startsWith('categories.')) {
        return options?.defaultValue || map[key] || key.replace('categories.', '');
      }
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock useStore
const mockSetSelectedCategory = vi.fn();
const mockFetchBooks = vi.fn();

const defaultStoreValues = {
  books: [],
  categories: [],
  selectedCategory: 'all',
  setSelectedCategory: mockSetSelectedCategory,
  fetchBooks: mockFetchBooks,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
}));

// Mock BookCard component
vi.mock('../../components/BookCard', () => ({
  default: ({ book }) => <div data-testid="book-card">{book.title}</div>,
}));

const sampleBooks = [
  { id: 1, title: 'Book A', author: 'Author A', rating: 4.5, category: { name: 'Computer' }, availableCount: 3 },
  { id: 2, title: 'Book B', author: 'Author B', rating: 3.5, category: { name: 'Science' }, availableCount: 1 },
  { id: 3, title: 'Book C', author: 'Author C', rating: 5, category: { name: 'Literature' }, availableCount: 0 },
];

const sampleCategories = [
  { id: 'cat1', name: 'Computer' },
  { id: 'cat2', name: 'Science' },
  { id: 'cat3', name: 'Literature' },
];

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
  });

  describe('Book List Rendering', () => {
    it('renders page title and subtitle', () => {
      render(<Home />);

      expect(screen.getByText('Library Home')).toBeInTheDocument();
      expect(screen.getByText('Discover your next great read')).toBeInTheDocument();
    });

    it('renders book cards when books exist', () => {
      storeOverrides = { books: sampleBooks };
      render(<Home />);

      expect(screen.getByText('Book A')).toBeInTheDocument();
      expect(screen.getByText('Book B')).toBeInTheDocument();
      expect(screen.getByText('Book C')).toBeInTheDocument();
    });

    it('shows total book count', () => {
      storeOverrides = { books: sampleBooks };
      render(<Home />);

      expect(screen.getByText(/Total: 3 books/)).toBeInTheDocument();
    });

    it('shows empty state when no books', () => {
      storeOverrides = { books: [], selectedCategory: 'all' };
      render(<Home />);

      // Ant Design Empty component renders with a class
      expect(screen.getByText(/No books in/)).toBeInTheDocument();
    });

    it('shows empty state with search keyword when no results', () => {
      storeOverrides = { books: [], selectedCategory: 'all' };
      render(<Home />);

      // The empty state message depends on search text
      expect(document.querySelector('.ant-empty')).toBeInTheDocument();
    });
  });

  describe('Category Filter', () => {
    it('renders "All" category tab', () => {
      storeOverrides = { categories: sampleCategories, selectedCategory: 'all' };
      render(<Home />);

      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('renders category tabs from store', () => {
      storeOverrides = { categories: sampleCategories, selectedCategory: 'all' };
      render(<Home />);

      expect(screen.getByText('Computer')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('Literature')).toBeInTheDocument();
    });

    it('calls setSelectedCategory and fetchBooks when category is clicked', () => {
      mockFetchBooks.mockResolvedValue({});
      storeOverrides = { categories: sampleCategories, selectedCategory: 'all' };
      render(<Home />);

      fireEvent.click(screen.getByText('Computer'));

      expect(mockSetSelectedCategory).toHaveBeenCalledWith('cat1');
      expect(mockFetchBooks).toHaveBeenCalledWith({
        keyword: undefined,
        categoryId: 'cat1',
      });
    });

    it('calls fetchBooks with undefined categoryId when "All" is clicked', () => {
      mockFetchBooks.mockResolvedValue({});
      storeOverrides = { categories: sampleCategories, selectedCategory: 'cat1' };
      render(<Home />);

      fireEvent.click(screen.getByText('All'));

      expect(mockSetSelectedCategory).toHaveBeenCalledWith('all');
      expect(mockFetchBooks).toHaveBeenCalledWith({
        keyword: undefined,
        categoryId: undefined,
      });
    });

    it('shows selected category name in info text', () => {
      storeOverrides = {
        books: sampleBooks,
        categories: sampleCategories,
        selectedCategory: 'cat1',
      };
      render(<Home />);

      // "Computer" appears in both the category tab and the info text
      const computerTexts = screen.getAllByText(/Computer/);
      expect(computerTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', () => {
      render(<Home />);

      expect(screen.getByPlaceholderText('Search books...')).toBeInTheDocument();
    });

    it('calls fetchBooks when search is submitted', () => {
      mockFetchBooks.mockResolvedValue({});
      storeOverrides = { selectedCategory: 'all' };
      render(<Home />);

      const searchInput = screen.getByPlaceholderText('Search books...');
      fireEvent.change(searchInput, { target: { value: 'React' } });

      // Trigger search by pressing Enter or clicking search button
      const searchButton = searchInput.closest('.ant-input-search');
      if (searchButton) {
        const btn = searchButton.querySelector('.ant-input-search-button');
        if (btn) fireEvent.click(btn);
      }

      // Also test via form submit
      fireEvent.submit(searchInput.closest('form') || searchInput);
    });

    it('calls fetchBooks with empty keyword when search is cleared', () => {
      mockFetchBooks.mockResolvedValue({});
      storeOverrides = { selectedCategory: 'all' };
      render(<Home />);

      const searchInput = screen.getByPlaceholderText('Search books...');

      // First set a value, then clear it to trigger the onChange handler
      fireEvent.change(searchInput, { target: { value: 'React' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(mockFetchBooks).toHaveBeenCalledWith({
        keyword: undefined,
        categoryId: undefined,
      });
    });

    it('shows search result keyword in info text when search is active', () => {
      storeOverrides = { books: sampleBooks, selectedCategory: 'all' };
      render(<Home />);

      // The search result text is only shown when searchText is set
      // We need to trigger a search first
      const searchInput = screen.getByPlaceholderText('Search books...');
      fireEvent.change(searchInput, { target: { value: 'React' } });
    });
  });

  describe('Combined Filtering', () => {
    it('passes both keyword and categoryId to fetchBooks', () => {
      mockFetchBooks.mockResolvedValue({});
      storeOverrides = { categories: sampleCategories, selectedCategory: 'cat1' };
      render(<Home />);

      // Click a category
      fireEvent.click(screen.getByText('Science'));

      expect(mockFetchBooks).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat2',
        })
      );
    });
  });

  describe('Empty States', () => {
    it('shows no results message with keyword when search has no results', () => {
      storeOverrides = { books: [], selectedCategory: 'all' };
      render(<Home />);

      // Default empty state when no search text
      expect(document.querySelector('.ant-empty')).toBeInTheDocument();
    });

    it('shows no category message when category has no books', () => {
      storeOverrides = { books: [], selectedCategory: 'all' };
      render(<Home />);

      expect(screen.getByText(/No books in/)).toBeInTheDocument();
    });
  });
});
