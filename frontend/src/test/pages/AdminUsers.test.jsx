import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminUsers from '../../pages/AdminUsers';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'common.id': 'ID',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.error': 'Error',
        'common.disable': 'Disable',
        'common.enable': 'Enable',
        'common.role.admin': 'Admin',
        'common.role.user': 'User',
        'common.status.normal': 'Normal',
        'common.status.disabled': 'Disabled',
        'auth.username': 'Username',
        'auth.password': 'Password',
        'profile.nickname': 'Nickname',
        'profile.email': 'Email',
        'profile.phone': 'Phone',
        'profile.role': 'Role',
        'profile.accountStatus': 'Status',
        'profile.newPassword': 'New Password',
        'admin.userManagement': 'User Management',
        'admin.addUser': 'Add User',
        'admin.editUser': 'Edit User',
        'admin.deleteConfirm': 'Confirm delete?',
        'admin.deleteSuccess': 'Deleted successfully',
        'admin.updateSuccess': 'Updated successfully',
        'admin.addSuccess': 'Added successfully',
        'admin.userDisabled': 'User disabled',
        'admin.userEnabled': 'User enabled',
        'admin.passwordOptional': 'Optional',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock store
const mockFetchUsers = vi.fn(() => Promise.resolve());
const mockToggleUserStatus = vi.fn(() => Promise.resolve());

const defaultStoreValues = {
  users: [],
  fetchUsers: mockFetchUsers,
  toggleUserStatus: mockToggleUserStatus,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
}));

// Mock user API
const mockCreateUser = vi.fn(() => Promise.resolve({}));
const mockUpdateUser = vi.fn(() => Promise.resolve({}));
const mockDeleteUser = vi.fn(() => Promise.resolve({}));

vi.mock('../../api/user', () => ({
  createUser: (...args) => mockCreateUser(...args),
  updateUser: (...args) => mockUpdateUser(...args),
  deleteUser: (...args) => mockDeleteUser(...args),
}));

// Mock normalizeRole and normalizeStatus
vi.mock('../../utils/userDisplay', () => ({
  normalizeRole: (role) => {
    if (role === 2 || role === '2' || role === 'ADMIN' || role === 'admin') return 'admin';
    return 'user';
  },
  normalizeStatus: (status) => {
    if (status === 1 || status === '1' || status === 'NORMAL' || status === 'normal') return 'normal';
    return 'disabled';
  },
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

const sampleUsers = [
  { id: 1, username: 'alice', nickname: 'Alice', email: 'alice@test.com', phone: '111', role: 1, status: 1 },
  { id: 2, username: 'bob', nickname: 'Bob', email: 'bob@test.com', phone: '222', role: 2, status: 1 },
  { id: 3, username: 'charlie', nickname: 'Charlie', email: 'charlie@test.com', phone: '333', role: 1, status: 0 },
];

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
  });

  describe('Initial Render', () => {
    it('renders page title in heading', () => {
      render(<AdminUsers />);

      // "User Management" appears in h2 and also in the action column header
      const h2 = document.querySelector('h2');
      expect(h2).toBeInTheDocument();
      expect(h2.textContent).toBe('User Management');
    });

    it('renders add user button', () => {
      render(<AdminUsers />);

      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    it('renders table with user data', () => {
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
      expect(screen.getByText('charlie')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<AdminUsers />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      // "Username", "Nickname", "Email", "Role", "Status" appear in both table headers and form labels
      expect(screen.getAllByText('Username').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Nickname').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Email').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Role').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
    });

    it('renders role tags for users', () => {
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      // Alice is user role, Bob is admin role
      const userTags = screen.getAllByText('User');
      const adminTags = screen.getAllByText('Admin');
      expect(userTags.length).toBeGreaterThanOrEqual(1);
      expect(adminTags.length).toBeGreaterThanOrEqual(1);
    });

    it('renders status tags for users', () => {
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const normalTags = screen.getAllByText('Normal');
      const disabledTags = screen.getAllByText('Disabled');
      expect(normalTags.length).toBeGreaterThanOrEqual(1);
      expect(disabledTags.length).toBeGreaterThanOrEqual(1);
    });

    it('renders action buttons for each row', () => {
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');
      expect(editButtons.length).toBe(3);
      expect(deleteButtons.length).toBe(3);
    });

    it('renders disable button for normal users and enable for disabled', () => {
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      // alice and bob are normal -> show "Disable"
      // charlie is disabled -> show "Enable"
      const disableButtons = screen.getAllByText('Disable');
      const enableButtons = screen.getAllByText('Enable');
      expect(disableButtons.length).toBe(2);
      expect(enableButtons.length).toBe(1);
    });
  });

  describe('Data Loading', () => {
    it('calls fetchUsers on mount', () => {
      render(<AdminUsers />);

      expect(mockFetchUsers).toHaveBeenCalled();
    });

    it('shows loading spinner while fetching', () => {
      mockFetchUsers.mockReturnValue(new Promise(() => {}));
      render(<AdminUsers />);

      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  describe('Add User', () => {
    it('opens add modal when add button is clicked', () => {
      render(<AdminUsers />);

      fireEvent.click(screen.getByText('Add User'));

      // Modal title should show "Add User" - now there are 2 instances
      const addUserTexts = screen.getAllByText('Add User');
      expect(addUserTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('renders form fields in add modal', () => {
      render(<AdminUsers />);

      fireEvent.click(screen.getByText('Add User'));

      // After modal opens, form labels should be present
      // "Username" appears in table header and form label
      expect(screen.getAllByText('Username').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getAllByText('Nickname').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Email').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Role').length).toBeGreaterThanOrEqual(2);
    });

    it('calls createUser on form submit with valid data', async () => {
      mockCreateUser.mockResolvedValue({});
      render(<AdminUsers />);

      fireEvent.click(screen.getByText('Add User'));

      await waitFor(() => {
        expect(document.querySelector('.ant-modal')).toBeInTheDocument();
      });

      const modal = document.querySelector('.ant-modal');

      // Fill in required fields
      const textInputs = within(modal).getAllByRole('textbox');
      // username input
      fireEvent.change(textInputs[0], { target: { value: 'newuser' } });

      // password input (it's a password type, not a textbox role)
      const passwordInput = modal.querySelector('input[type="password"]');
      if (passwordInput) {
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      }

      // nickname input
      fireEvent.change(textInputs[1], { target: { value: 'New User' } });

      // Click OK button in modal
      const okButton = within(modal).getByRole('button', { name: /ok/i });
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalled();
      });
    });
  });

  describe('Edit User', () => {
    it('opens edit modal with pre-filled data when edit is clicked', () => {
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    it('shows new password field in edit modal', () => {
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('New Password')).toBeInTheDocument();
    });

    it('calls updateUser on form submit', async () => {
      const { message } = await import('antd');
      mockUpdateUser.mockResolvedValue({});
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(document.querySelector('.ant-modal')).toBeInTheDocument();
      });

      const modal = document.querySelector('.ant-modal');
      const okButton = within(modal).getByRole('button', { name: /ok/i });
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
      });
    });
  });

  describe('Delete User', () => {
    it('calls deleteUser and shows success message on confirm', async () => {
      const { message } = await import('antd');
      mockDeleteUser.mockResolvedValue({});
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      const okButton = await screen.findByText('OK');
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(mockDeleteUser).toHaveBeenCalledWith(1);
        expect(message.success).toHaveBeenCalledWith('Deleted successfully');
      });
    });

    it('shows error message when delete fails', async () => {
      const { message } = await import('antd');
      mockDeleteUser.mockRejectedValue(new Error('Delete failed'));
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      const okButton = await screen.findByText('OK');
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Delete failed');
      });
    });
  });

  describe('Toggle User Status', () => {
    it('calls toggleUserStatus when disable button is clicked', async () => {
      const { message } = await import('antd');
      mockToggleUserStatus.mockResolvedValue({});
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const disableButtons = screen.getAllByText('Disable');
      fireEvent.click(disableButtons[0]);

      await waitFor(() => {
        expect(mockToggleUserStatus).toHaveBeenCalledWith(1);
        expect(message.success).toHaveBeenCalledWith('User disabled');
      });
    });

    it('calls toggleUserStatus when enable button is clicked', async () => {
      const { message } = await import('antd');
      mockToggleUserStatus.mockResolvedValue({});
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const enableButtons = screen.getAllByText('Enable');
      fireEvent.click(enableButtons[0]);

      await waitFor(() => {
        expect(mockToggleUserStatus).toHaveBeenCalledWith(3);
        expect(message.success).toHaveBeenCalledWith('User enabled');
      });
    });

    it('shows error message when toggle fails', async () => {
      const { message } = await import('antd');
      mockToggleUserStatus.mockRejectedValue(new Error('Toggle failed'));
      storeOverrides = { users: sampleUsers };
      render(<AdminUsers />);

      const disableButtons = screen.getAllByText('Disable');
      fireEvent.click(disableButtons[0]);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Toggle failed');
      });
    });
  });

  describe('Empty State', () => {
    it('renders empty table when no users', () => {
      storeOverrides = { users: [] };
      render(<AdminUsers />);

      expect(document.querySelector('.ant-empty')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows form validation error when required fields are missing', async () => {
      const { message } = await import('antd');
      render(<AdminUsers />);

      fireEvent.click(screen.getByText('Add User'));

      await waitFor(() => {
        expect(document.querySelector('.ant-modal')).toBeInTheDocument();
      });

      const modal = document.querySelector('.ant-modal');
      const okButton = within(modal).getByRole('button', { name: /ok/i });
      fireEvent.click(okButton);

      // Form validation should show error, not call createUser
      await waitFor(() => {
        expect(mockCreateUser).not.toHaveBeenCalled();
      });
    });
  });
});
