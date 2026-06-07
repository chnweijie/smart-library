import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBookStore } from '../../store/useBookStore';

// Mock APIs
vi.mock('../../api/books', () => ({
  getBooks: vi.fn(),
  getBookDetail: vi.fn(),
  createBook: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
  getSimilarBooks: vi.fn(),
}));

vi.mock('../../api/category', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

vi.mock('../../api/favorite', () => ({
  getFavorites: vi.fn(),
  toggleFavorite: vi.fn(),
  checkFavorite: vi.fn(),
}));

vi.mock('../../utils/notify', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

import * as bookApi from '../../api/books';
import * as categoryApi from '../../api/category';
import * as favoriteApi from '../../api/favorite';

describe('useBookStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useBookStore.setState({
      books: [],
      totalBooks: 0,
      bookPage: 1,
      bookSize: 20,
      selectedBook: null,
      selectedCategory: 'all',
      categories: [],
      favorites: [],
      favoriteBooks: [],
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useBookStore.getState();
      expect(state.books).toEqual([]);
      expect(state.totalBooks).toBe(0);
      expect(state.bookPage).toBe(1);
      expect(state.bookSize).toBe(20);
      expect(state.selectedBook).toBeNull();
      expect(state.selectedCategory).toBe('all');
      expect(state.categories).toEqual([]);
      expect(state.favorites).toEqual([]);
      expect(state.favoriteBooks).toEqual([]);
    });
  });

  describe('fetchBooks', () => {
    it('should fetch books and update state', async () => {
      const mockBooks = [
        { id: 1, title: 'Book 1' },
        { id: 2, title: 'Book 2' },
      ];
      bookApi.getBooks.mockResolvedValue({
        data: { list: mockBooks, total: 2, page: 1 },
      });

      await useBookStore.getState().fetchBooks();

      const state = useBookStore.getState();
      expect(state.books).toEqual(mockBooks);
      expect(state.totalBooks).toBe(2);
      expect(state.bookPage).toBe(1);
    });

    it('should pass correct params to API', async () => {
      bookApi.getBooks.mockResolvedValue({ data: { list: [], total: 0 } });

      await useBookStore.getState().fetchBooks({ page: 2, size: 10, keyword: 'test', categoryId: 5 });

      expect(bookApi.getBooks).toHaveBeenCalledWith({
        page: 2,
        size: 10,
        keyword: 'test',
        categoryId: 5,
      });
    });

    it('should use default page and size when not provided', async () => {
      bookApi.getBooks.mockResolvedValue({ data: { list: [], total: 0 } });

      await useBookStore.getState().fetchBooks({});

      expect(bookApi.getBooks).toHaveBeenCalledWith({
        page: 1,
        size: 20,
        keyword: undefined,
        categoryId: undefined,
      });
    });

    it('should handle empty response data', async () => {
      bookApi.getBooks.mockResolvedValue({ data: {} });

      await useBookStore.getState().fetchBooks();

      const state = useBookStore.getState();
      expect(state.books).toEqual([]);
      expect(state.totalBooks).toBe(0);
    });

    it('should update favoriteBooks when favorites exist', async () => {
      const mockBooks = [
        { id: 1, title: 'Book 1' },
        { id: 2, title: 'Book 2' },
      ];
      bookApi.getBooks.mockResolvedValue({ data: { list: mockBooks, total: 2 } });
      useBookStore.setState({ favorites: [1] });

      await useBookStore.getState().fetchBooks();

      expect(useBookStore.getState().favoriteBooks).toEqual([{ id: 1, title: 'Book 1' }]);
    });

    it('should handle fetch error gracefully', async () => {
      const { notifyError } = await import('../../utils/notify');
      bookApi.getBooks.mockRejectedValue(new Error('Network error'));

      await useBookStore.getState().fetchBooks();

      expect(notifyError).toHaveBeenCalled();
    });
  });

  describe('setSelectedBook', () => {
    it('should set selectedBook', () => {
      const book = { id: 1, title: 'Test Book' };
      useBookStore.getState().setSelectedBook(book);

      expect(useBookStore.getState().selectedBook).toEqual(book);
    });

    it('should set selectedBook to null', () => {
      useBookStore.setState({ selectedBook: { id: 1 } });
      useBookStore.getState().setSelectedBook(null);

      expect(useBookStore.getState().selectedBook).toBeNull();
    });
  });

  describe('fetchBookDetail', () => {
    it('should fetch and set selectedBook', async () => {
      const mockBook = { id: 1, title: 'Detail Book', author: 'Author' };
      bookApi.getBookDetail.mockResolvedValue({ data: mockBook });

      const result = await useBookStore.getState().fetchBookDetail(1);

      expect(useBookStore.getState().selectedBook).toEqual(mockBook);
      expect(result).toEqual(mockBook);
    });

    it('should return null on error', async () => {
      bookApi.getBookDetail.mockRejectedValue(new Error('Not found'));

      const result = await useBookStore.getState().fetchBookDetail(999);

      expect(result).toBeNull();
    });
  });

  describe('addBook', () => {
    it('should add a book and refresh the list', async () => {
      bookApi.createBook.mockResolvedValue({});
      bookApi.getBooks.mockResolvedValue({ data: { list: [], total: 0 } });

      const result = await useBookStore.getState().addBook({ title: 'New Book' });

      expect(bookApi.createBook).toHaveBeenCalledWith({ title: 'New Book' });
      expect(result).toBe('admin.addSuccess');
      expect(bookApi.getBooks).toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      const error = new Error('Create failed');
      bookApi.createBook.mockRejectedValue(error);

      await expect(useBookStore.getState().addBook({ title: 'Bad' })).rejects.toThrow('Create failed');
    });
  });

  describe('updateBook', () => {
    it('should update a book and refresh the list', async () => {
      bookApi.updateBook.mockResolvedValue({});
      bookApi.getBooks.mockResolvedValue({ data: { list: [], total: 0 } });

      const result = await useBookStore.getState().updateBook(1, { title: 'Updated' });

      expect(bookApi.updateBook).toHaveBeenCalledWith(1, { title: 'Updated' });
      expect(result).toBe('admin.updateSuccess');
    });

    it('should throw on error', async () => {
      bookApi.updateBook.mockRejectedValue(new Error('Update failed'));

      await expect(useBookStore.getState().updateBook(1, {})).rejects.toThrow('Update failed');
    });
  });

  describe('deleteBook', () => {
    it('should delete a book and refresh the list', async () => {
      bookApi.deleteBook.mockResolvedValue({});
      bookApi.getBooks.mockResolvedValue({ data: { list: [], total: 0 } });

      const result = await useBookStore.getState().deleteBook(1);

      expect(bookApi.deleteBook).toHaveBeenCalledWith(1);
      expect(result).toBe('admin.deleteSuccess');
    });

    it('should throw on error', async () => {
      bookApi.deleteBook.mockRejectedValue(new Error('Delete failed'));

      await expect(useBookStore.getState().deleteBook(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('setSelectedCategory', () => {
    it('should set selected category', () => {
      useBookStore.getState().setSelectedCategory('fiction');
      expect(useBookStore.getState().selectedCategory).toBe('fiction');
    });

    it('should reset to all', () => {
      useBookStore.setState({ selectedCategory: 'fiction' });
      useBookStore.getState().setSelectedCategory('all');
      expect(useBookStore.getState().selectedCategory).toBe('all');
    });
  });

  describe('fetchCategories', () => {
    it('should fetch and set categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Fiction' },
        { id: 2, name: 'Science' },
      ];
      categoryApi.getCategories.mockResolvedValue({ data: mockCategories });

      await useBookStore.getState().fetchCategories();

      expect(useBookStore.getState().categories).toEqual(mockCategories);
    });

    it('should handle empty response', async () => {
      categoryApi.getCategories.mockResolvedValue({ data: null });

      await useBookStore.getState().fetchCategories();

      expect(useBookStore.getState().categories).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      const { notifyError } = await import('../../utils/notify');
      categoryApi.getCategories.mockRejectedValue(new Error('Network error'));

      await useBookStore.getState().fetchCategories();

      expect(notifyError).toHaveBeenCalled();
    });
  });

  describe('addCategory', () => {
    it('should add a category and refresh the list', async () => {
      categoryApi.createCategory.mockResolvedValue({});
      categoryApi.getCategories.mockResolvedValue({ data: [] });

      const result = await useBookStore.getState().addCategory({ name: 'New Cat' });

      expect(categoryApi.createCategory).toHaveBeenCalledWith({ name: 'New Cat' });
      expect(result).toBe('admin.addSuccess');
    });

    it('should throw on error', async () => {
      categoryApi.createCategory.mockRejectedValue(new Error('Duplicate'));

      await expect(useBookStore.getState().addCategory({ name: 'Dup' })).rejects.toThrow('Duplicate');
    });
  });

  describe('updateCategory', () => {
    it('should update a category and refresh', async () => {
      categoryApi.updateCategory.mockResolvedValue({});
      categoryApi.getCategories.mockResolvedValue({ data: [] });

      const result = await useBookStore.getState().updateCategory(1, { name: 'Updated' });

      expect(result).toBe('admin.updateSuccess');
    });

    it('should throw on error', async () => {
      categoryApi.updateCategory.mockRejectedValue(new Error('Fail'));

      await expect(useBookStore.getState().updateCategory(1, {})).rejects.toThrow('Fail');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category and refresh', async () => {
      categoryApi.deleteCategory.mockResolvedValue({});
      categoryApi.getCategories.mockResolvedValue({ data: [] });

      const result = await useBookStore.getState().deleteCategory(1);

      expect(result).toBe('admin.deleteSuccess');
    });

    it('should throw on error', async () => {
      categoryApi.deleteCategory.mockRejectedValue(new Error('Fail'));

      await expect(useBookStore.getState().deleteCategory(1)).rejects.toThrow('Fail');
    });
  });

  describe('fetchFavorites', () => {
    it('should fetch favorites and update state', async () => {
      const mockBooks = [
        { id: 1, title: 'Book 1' },
        { id: 2, title: 'Book 2' },
      ];
      useBookStore.setState({ books: mockBooks });

      const favList = [
        { bookId: 1, book: { id: 1 } },
        { bookId: 2, book: { id: 2 } },
      ];
      favoriteApi.getFavorites.mockResolvedValue({ data: { list: favList } });

      await useBookStore.getState().fetchFavorites();

      const state = useBookStore.getState();
      expect(state.favorites).toEqual([1, 2]);
      expect(state.favoriteBooks).toEqual(mockBooks);
    });

    it('should handle favorites with bookId only (no book object)', async () => {
      useBookStore.setState({ books: [{ id: 1, title: 'Book 1' }] });
      favoriteApi.getFavorites.mockResolvedValue({ data: { list: [{ bookId: 1 }] } });

      await useBookStore.getState().fetchFavorites();

      expect(useBookStore.getState().favorites).toEqual([1]);
      expect(useBookStore.getState().favoriteBooks).toEqual([{ id: 1, title: 'Book 1' }]);
    });

    it('should handle empty favorites', async () => {
      favoriteApi.getFavorites.mockResolvedValue({ data: { list: [] } });

      await useBookStore.getState().fetchFavorites();

      expect(useBookStore.getState().favorites).toEqual([]);
      expect(useBookStore.getState().favoriteBooks).toEqual([]);
    });

    it('should handle error gracefully', async () => {
      favoriteApi.getFavorites.mockRejectedValue(new Error('Network error'));

      await useBookStore.getState().fetchFavorites();

      // Should not throw, state remains unchanged
      expect(useBookStore.getState().favorites).toEqual([]);
    });
  });

  describe('toggleFavorite', () => {
    it('should add to favorites when toggled on', async () => {
      const mockBook = { id: 1, title: 'Book 1' };
      useBookStore.setState({ books: [mockBook], favorites: [], favoriteBooks: [] });
      favoriteApi.toggleFavorite.mockResolvedValue({ data: true });

      const result = await useBookStore.getState().toggleFavorite(1);

      expect(result).toEqual({ success: true, messageKey: 'book.favoriteSuccess' });
      expect(useBookStore.getState().favorites).toContain(1);
      expect(useBookStore.getState().favoriteBooks).toContainEqual(mockBook);
    });

    it('should remove from favorites when toggled off', async () => {
      const mockBook = { id: 1, title: 'Book 1' };
      useBookStore.setState({
        books: [mockBook],
        favorites: [1],
        favoriteBooks: [mockBook],
      });
      favoriteApi.toggleFavorite.mockResolvedValue({ data: false });

      const result = await useBookStore.getState().toggleFavorite(1);

      expect(result).toEqual({ success: true, messageKey: 'book.unfavoriteSuccess' });
      expect(useBookStore.getState().favorites).not.toContain(1);
      expect(useBookStore.getState().favoriteBooks).not.toContainEqual(mockBook);
    });

    it('should return auth error on 401 error', async () => {
      favoriteApi.toggleFavorite.mockRejectedValue(new Error('401 Unauthorized'));

      const result = await useBookStore.getState().toggleFavorite(1);

      expect(result.success).toBe(false);
      expect(result.messageKey).toBe('auth.loginToFavorite');
    });

    it('should return generic error on non-auth failure', async () => {
      favoriteApi.toggleFavorite.mockRejectedValue(new Error('Network error'));

      const result = await useBookStore.getState().toggleFavorite(1);

      expect(result.success).toBe(false);
      expect(result.messageKey).toBe('common.operationFailed');
    });
  });

  describe('checkFavorite', () => {
    it('should return true when book is favorited', async () => {
      favoriteApi.checkFavorite.mockResolvedValue({ data: true });

      const result = await useBookStore.getState().checkFavorite(1);

      expect(result).toBe(true);
    });

    it('should return false when book is not favorited', async () => {
      favoriteApi.checkFavorite.mockResolvedValue({ data: false });

      const result = await useBookStore.getState().checkFavorite(1);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      favoriteApi.checkFavorite.mockRejectedValue(new Error('Error'));

      const result = await useBookStore.getState().checkFavorite(1);

      expect(result).toBe(false);
    });
  });

  describe('getSimilarBooks', () => {
    it('should return similar books', async () => {
      const mockSimilar = [{ id: 2, title: 'Similar Book' }];
      bookApi.getSimilarBooks.mockResolvedValue({ data: mockSimilar });

      const result = await useBookStore.getState().getSimilarBooks(1);

      expect(result).toEqual(mockSimilar);
    });

    it('should return empty array on error', async () => {
      bookApi.getSimilarBooks.mockRejectedValue(new Error('Error'));

      const result = await useBookStore.getState().getSimilarBooks(1);

      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      bookApi.getSimilarBooks.mockResolvedValue({ data: null });

      const result = await useBookStore.getState().getSimilarBooks(1);

      expect(result).toEqual([]);
    });
  });
});
