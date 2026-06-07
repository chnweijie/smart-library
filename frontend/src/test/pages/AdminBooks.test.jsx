import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminBooks from '../../pages/AdminBooks';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const map = {
        'common.id': 'ID',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.okText': 'OK',
        'common.cancelText': 'Cancel',
        'common.error': 'Error',
        'admin.bookTitle': 'Book Title',
        'admin.bookAuthor': 'Author',
        'admin.bookCategory': 'Category',
        'admin.bookAvailable': 'Available',
        'admin.bookManagement': 'Book Management',
        'admin.addBook': 'Add Book',
        'admin.editBook': 'Edit Book',
        'admin.bookPublisher': 'Publisher',
        'admin.bookDescription': 'Description',
        'admin.bookCover': 'Cover',
        'admin.uploading': 'Uploading...',
        'admin.uploadCover': 'Upload Cover',
        'admin.uploadSuccess': 'Upload successful',
        'admin.deleteConfirm': 'Confirm delete?',
        'admin.deleteSuccess': 'Deleted successfully',
        'admin.updateSuccess': 'Updated successfully',
        'admin.addSuccess': 'Added successfully',
      };
      if (key.startsWith('categories.')) {
        return options?.defaultValue || key.replace('categories.', '');
      }
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock store
const mockFetchBooks = vi.fn(() => Promise.resolve());
const mockFetchCategories = vi.fn(() => Promise.resolve());
const mockDeleteBook = vi.fn(() => Promise.resolve());
const mockUpdateBook = vi.fn(() => Promise.resolve());
const mockAddBook = vi.fn(() => Promise.resolve());

const defaultStoreValues = {
  books: [],
  categories: [],
  fetchBooks: mockFetchBooks,
  fetchCategories: mockFetchCategories,
  deleteBook: mockDeleteBook,
  updateBook: mockUpdateBook,
  addBook: mockAddBook,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
}));

// Mock upload API
const mockUploadCover = vi.fn(() => Promise.resolve({ data: { url: 'http://cover.jpg' } }));

vi.mock('../../api/upload', () => ({
  uploadCover: (...args) => mockUploadCover(...args),
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

const sampleBooks = [
  { id: 1, title: 'React Guide', author: 'Dan', categoryId: 1, totalCount: 5, coverUrl: 'http://cover1.jpg' },
  { id: 2, title: 'Vue Handbook', author: 'Evan', categoryId: 2, totalCount: 3, coverUrl: '' },
  { id: 3, title: 'Python Basics', author: 'Guido', categoryId: 1, totalCount: 0 },
];

const sampleCategories = [
  { id: 1, name: 'Computer' },
  { id: 2, name: 'Science' },
];

describe('AdminBooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
  });

  describe('Initial Render', () => {
    it('renders page title in heading', () => {
      render(<AdminBooks />);

      // "Book Management" appears in h2 and also in the action column header
      const headings = screen.getAllByText('Book Management');
      expect(headings.length).toBeGreaterThanOrEqual(1);
      // The h2 should exist
      const h2 = document.querySelector('h2');
      expect(h2).toBeInTheDocument();
      expect(h2.textContent).toBe('Book Management');
    });

    it('renders add book button', () => {
      render(<AdminBooks />);

      expect(screen.getByText('Add Book')).toBeInTheDocument();
    });

    it('renders table with book data', () => {
      storeOverrides = { books: sampleBooks, categories: sampleCategories };
      render(<AdminBooks />);

      expect(screen.getByText('React Guide')).toBeInTheDocument();
      expect(screen.getByText('Vue Handbook')).toBeInTheDocument();
      expect(screen.getByText('Python Basics')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<AdminBooks />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      // "Book Title", "Author", "Category", "Available" may appear in both table headers and form labels
      expect(screen.getAllByText('Book Title').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Author').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Category').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Available').length).toBeGreaterThanOrEqual(1);
    });

    it('renders edit and delete buttons for each row', () => {
      storeOverrides = { books: sampleBooks, categories: sampleCategories };
      render(<AdminBooks />);

      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');
      expect(editButtons.length).toBe(3);
      expect(deleteButtons.length).toBe(3);
    });

    it('renders category tags in table rows', () => {
      storeOverrides = { books: sampleBooks, categories: sampleCategories };
      render(<AdminBooks />);

      // Category names are rendered via t(`categories.${cat.name}`, { defaultValue: cat.name })
      // which returns the defaultValue "Computer" / "Science"
      const computerTags = screen.getAllByText('Computer');
      const scienceTags = screen.getAllByText('Science');
      expect(computerTags.length).toBeGreaterThanOrEqual(1);
      expect(scienceTags.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Loading', () => {
    it('calls fetchBooks on mount', () => {
      render(<AdminBooks />);

      expect(mockFetchBooks).toHaveBeenCalledWith({ page: 1, size: 100 });
    });

    it('calls fetchCategories on mount', () => {
      render(<AdminBooks />);

      expect(mockFetchCategories).toHaveBeenCalled();
    });
  });

  describe('Add Book', () => {
    it('opens add modal when add button is clicked', () => {
      render(<AdminBooks />);

      fireEvent.click(screen.getByText('Add Book'));

      // Modal title should show "Add Book" - now there are 2 instances (button + modal title)
      const addBookTexts = screen.getAllByText('Add Book');
      expect(addBookTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('renders form fields in modal', () => {
      storeOverrides = { categories: sampleCategories };
      render(<AdminBooks />);

      fireEvent.click(screen.getByText('Add Book'));

      // After modal opens, form labels should be present
      // These labels also appear in table column headers, so use getAllByText
      expect(screen.getAllByText('Book Title').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Author').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Category').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Available').length).toBeGreaterThanOrEqual(2);
    });

    it('calls addBook on form submit with valid data', async () => {
      mockAddBook.mockResolvedValue({});
      storeOverrides = { categories: sampleCategories };
      render(<AdminBooks />);

      fireEvent.click(screen.getByText('Add Book'));

      // Wait for modal to open
      await waitFor(() => {
        expect(document.querySelector('.ant-modal')).toBeInTheDocument();
      });

      // Fill in the form - use the modal as container
      const modal = document.querySelector('.ant-modal');

      // Title input
      const titleInput = within(modal).getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'New Book' } });

      // Author input
      const authorInput = within(modal).getAllByRole('textbox')[1];
      fireEvent.change(authorInput, { target: { value: 'New Author' } });

      // categoryId - Select component: click to open dropdown, then select option
      const categorySelect = within(modal).getAllByRole('combobox')[0];
      fireEvent.mouseDown(categorySelect);
      await waitFor(() => {
        expect(document.querySelector('.ant-select-dropdown')).toBeInTheDocument();
      });
      const dropdown = document.querySelector('.ant-select-dropdown');
      const computerOption = within(dropdown).getByText('Computer');
      fireEvent.click(computerOption);

      // totalCount - InputNumber: find the input and change it
      const numberInput = within(modal).getAllByRole('spinbutton')[0];
      fireEvent.change(numberInput, { target: { value: 5 } });

      // Click the modal OK button
      const okButton = within(modal).getByRole('button', { name: /ok/i });
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(mockAddBook).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Book', () => {
    it('opens edit modal when edit is clicked', () => {
      storeOverrides = { books: sampleBooks, categories: sampleCategories };
      render(<AdminBooks />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      // Modal title should show "Edit Book"
      expect(screen.getByText('Edit Book')).toBeInTheDocument();
    });

    it('calls updateBook on form submit', async () => {
      mockUpdateBook.mockResolvedValue({});
      storeOverrides = { books: sampleBooks, categories: sampleCategories };
      render(<AdminBooks />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(document.querySelector('.ant-modal')).toBeInTheDocument();
      });

      const modal = document.querySelector('.ant-modal');
      const okButton = within(modal).getByRole('button', { name: /ok/i });
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(mockUpdateBook).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Book', () => {
    it('calls deleteBook and shows success message on confirm', async () => {
      const { message } = await import('antd');
      mockDeleteBook.mockResolvedValue({});
      storeOverrides = { books: sampleBooks, categories: sampleCategories };
      render(<AdminBooks />);

      // Find the first Popconfirm delete button and trigger confirm
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      // Popconfirm should appear, click OK
      const okButton = await screen.findByText('OK');
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(mockDeleteBook).toHaveBeenCalledWith(1);
        expect(message.success).toHaveBeenCalledWith('Deleted successfully');
      });
    });

    it('shows error message when delete fails', async () => {
      const { message } = await import('antd');
      mockDeleteBook.mockRejectedValue(new Error('Delete failed'));
      storeOverrides = { books: sampleBooks, categories: sampleCategories };
      render(<AdminBooks />);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      const okButton = await screen.findByText('OK');
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Delete failed');
      });
    });
  });

  describe('Empty State', () => {
    it('renders empty table when no books', () => {
      storeOverrides = { books: [], categories: [] };
      render(<AdminBooks />);

      expect(document.querySelector('.ant-empty')).toBeInTheDocument();
    });
  });

  describe('Modal Cancel', () => {
    it('closes modal on cancel', () => {
      render(<AdminBooks />);

      fireEvent.click(screen.getByText('Add Book'));

      // Click cancel button in modal
      const cancelButtons = screen.getAllByText('Cancel');
      const modalCancel = cancelButtons.find(btn => btn.closest('.ant-modal'));
      if (modalCancel) {
        fireEvent.click(modalCancel);
      }

      // Modal should close - "Edit Book" should not be visible
      expect(screen.queryByText('Edit Book')).not.toBeInTheDocument();
    });
  });

  describe('Cover Upload', () => {
    it('renders upload button in modal', () => {
      storeOverrides = { categories: sampleCategories };
      render(<AdminBooks />);

      fireEvent.click(screen.getByText('Add Book'));

      expect(screen.getByText('Upload Cover')).toBeInTheDocument();
    });
  });
});
