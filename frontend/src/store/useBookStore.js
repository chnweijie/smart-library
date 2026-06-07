import { create } from 'zustand';
import * as bookApi from '../api/books';
import * as categoryApi from '../api/category';
import * as favoriteApi from '../api/favorite';
import { notifyError } from '../utils/notify';

export const useBookStore = create((set, get) => ({
  books: [],
  totalBooks: 0,
  bookPage: 1,
  bookSize: 20,
  selectedBook: null,
  selectedCategory: 'all',
  categories: [],
  favorites: [],
  favoriteBooks: [],

  fetchBooks: async (params = {}) => {
    try {
      const res = await bookApi.getBooks({ page: params.page || 1, size: params.size || 20, keyword: params.keyword, categoryId: params.categoryId });
      const books = res.data.list || [];
      set({ books, totalBooks: res.data.total || 0, bookPage: res.data.page || 1 });
      const favoriteBookIds = get().favorites;
      if (favoriteBookIds.length > 0) {
        set({ favoriteBooks: favoriteBookIds.map(id => books.find(b => b.id === id)).filter(Boolean) });
      }
    } catch (e) {
      notifyError(e, '加载图书失败');
    }
  },

  setSelectedBook: (book) => set({ selectedBook: book }),

  fetchBookDetail: async (id) => {
    try {
      const res = await bookApi.getBookDetail(id);
      set({ selectedBook: res.data });
      return res.data;
    } catch (e) {
      notifyError(e, '加载图书详情失败');
      return null;
    }
  },

  addBook: async (data) => {
    try {
      await bookApi.createBook(data);
      get().fetchBooks({ page: 1, size: 100 });
      return 'admin.addSuccess';
    } catch (e) {
      throw e;
    }
  },

  updateBook: async (id, data) => {
    try {
      await bookApi.updateBook(id, data);
      get().fetchBooks({ page: 1, size: 100 });
      return 'admin.updateSuccess';
    } catch (e) {
      throw e;
    }
  },

  deleteBook: async (id) => {
    try {
      await bookApi.deleteBook(id);
      get().fetchBooks({ page: 1, size: 100 });
      return 'admin.deleteSuccess';
    } catch (e) {
      throw e;
    }
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  fetchCategories: async () => {
    try {
      const res = await categoryApi.getCategories();
      set({ categories: res.data || [] });
    } catch (e) {
      notifyError(e, '加载分类失败');
    }
  },

  addCategory: async (data) => {
    try {
      await categoryApi.createCategory(data);
      get().fetchCategories();
      return 'admin.addSuccess';
    } catch (e) {
      throw e;
    }
  },

  updateCategory: async (id, data) => {
    try {
      await categoryApi.updateCategory(id, data);
      get().fetchCategories();
      return 'admin.updateSuccess';
    } catch (e) {
      throw e;
    }
  },

  deleteCategory: async (id) => {
    try {
      await categoryApi.deleteCategory(id);
      get().fetchCategories();
      return 'admin.deleteSuccess';
    } catch (e) {
      throw e;
    }
  },

  fetchFavorites: async () => {
    try {
      const res = await favoriteApi.getFavorites({ page: 1, size: 100 });
      const favList = res.data.list || [];
      const bookIds = favList.map(f => f.bookId || f.book?.id).filter(Boolean);
      const allBooks = get().books;
      const books = bookIds.map(id => allBooks.find(b => b.id === id)).filter(Boolean);
      set({ favorites: bookIds, favoriteBooks: books });
    } catch (e) {
      notifyError(e, '加载收藏失败');
    }
  },

  toggleFavorite: async (bookId) => {
    try {
      const res = await favoriteApi.toggleFavorite(bookId);
      const isFavorited = res.data;
      set((state) => {
        const newFavorites = isFavorited
          ? [...state.favorites, bookId]
          : state.favorites.filter((id) => id !== bookId);
        const newFavoriteBooks = isFavorited
          ? [...state.favoriteBooks, state.books.find(b => b.id === bookId)].filter(Boolean)
          : state.favoriteBooks.filter((b) => b.id !== bookId);
        return { favorites: newFavorites, favoriteBooks: newFavoriteBooks };
      });
      return { success: true, messageKey: isFavorited ? 'book.favoriteSuccess' : 'book.unfavoriteSuccess' };
    } catch (e) {
      const isAuthError = e.message && (e.message.includes('401') || e.message.includes('登录'));
      return { success: false, messageKey: isAuthError ? 'auth.loginToFavorite' : 'common.operationFailed', message: e.message };
    }
  },

  checkFavorite: async (bookId) => {
    try {
      const res = await favoriteApi.checkFavorite(bookId);
      return res.data;
    } catch {
      return false;
    }
  },

  getSimilarBooks: async (bookId) => {
    try {
      const res = await bookApi.getSimilarBooks(bookId);
      return res.data || [];
    } catch (e) {
      return [];
    }
  },

  reset: () => {
    set({ books: [], totalBooks: 0, bookPage: 1, selectedBook: null, selectedCategory: 'all', categories: [], favorites: [], favoriteBooks: [] });
  },
}));
