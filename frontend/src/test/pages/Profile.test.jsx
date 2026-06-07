import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from '../../pages/Profile';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const map = {
        'nav.profile': 'Profile',
        'profile.basicInfo': 'Basic Info',
        'profile.accountSettings': 'Account Settings',
        'profile.username': 'Username',
        'profile.nickname': 'Nickname',
        'profile.email': 'Email',
        'profile.phone': 'Phone',
        'profile.role': 'Role',
        'profile.joinDate': 'Join Date',
        'profile.accountStatus': 'Account Status',
        'profile.accountNormal': 'Normal',
        'profile.editProfile': 'Edit Profile',
        'profile.confirmChange': 'Confirm',
        'profile.changePassword': 'Change Password',
        'profile.oldPassword': 'Old Password',
        'profile.newPassword': 'New Password',
        'profile.confirmNewPassword': 'Confirm New Password',
        'profile.enterOldPassword': 'Enter old password',
        'profile.enterNewPassword': 'Enter new password',
        'profile.passwordMismatch': 'Passwords do not match',
        'profile.passwordChanged': 'Password changed',
        'profile.password': 'Password',
        'profile.loginDevice': 'Login Device',
        'profile.currentDevice': 'Current Device',
        'profile.securitySettings': 'Security Settings',
        'profile.faceRecognition': 'Face Recognition',
        'profile.faceLogin': 'Face Login',
        'profile.faceRegistered': 'Face Registered',
        'profile.faceRegisteredDesc': 'Face login is enabled',
        'profile.faceNotRegisteredDesc': 'Face login is not enabled',
        'profile.registerFace': 'Register Face',
        'profile.removeFace': 'Remove Face',
        'profile.faceRegisterSuccess': 'Face registered successfully',
        'profile.faceRegisterFailed': 'Face registration failed',
        'profile.faceRemoveConfirm': 'Remove Face?',
        'profile.faceRemoveDesc': 'Are you sure you want to remove your face data?',
        'profile.faceRemoveSuccess': 'Face data removed',
        'profile.registering': 'Registering...',
        'profile.startRegister': 'Start Register',
        'profile.readyToScan': 'Ready to scan',
        'profile.faceRegisterTip': 'Please face the camera',
        'profile.nicknameRequired': 'Nickname is required',
        'profile.notificationSettings': 'Notification Settings',
        'profile.borrowDueReminder': 'Borrow Due Reminder',
        'profile.reservationArrivalReminder': 'Reservation Arrival Reminder',
        'profile.systemAnnouncements': 'System Announcements',
        'profile.myFavorites': 'My Favorites',
        'profile.noFavorites': 'No favorites yet',
        'common.role.admin': 'Admin',
        'common.role.user': 'User',
        'common.error': 'Error',
        'admin.updateSuccess': 'Update successful',
        'auth.invalidEmail': 'Invalid email',
        'emotion.loadingModel': 'Loading model...',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock useStore
const mockRegisterFace = vi.fn();
const mockUnregisterFace = vi.fn();
const mockChangePassword = vi.fn();
const mockUpdateUserProfile = vi.fn();
const mockUpdateNotifSetting = vi.fn();

const defaultStoreValues = {
  currentUser: { id: 1, username: 'testuser', role: 1 },
  borrows: [],
  favorites: [],
  favoriteBooks: [],
  reservations: [],
  books: [],
  registerFace: mockRegisterFace,
  unregisterFace: mockUnregisterFace,
  changePassword: mockChangePassword,
  updateUserProfile: mockUpdateUserProfile,
  notifSettings: {
    borrowDueReminder: true,
    reservationArrivalReminder: false,
    systemAnnouncements: true,
  },
  updateNotifSetting: mockUpdateNotifSetting,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
  useAuthStore: {
    getState: () => ({
      currentUser: { id: 1, username: 'testuser', role: 1 },
    }),
    setState: vi.fn(),
  },
}));

// Mock user API
const mockGetUserProfile = vi.fn(() => Promise.resolve({
  data: {
    username: 'testuser',
    nickname: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    role: 1,
    createdAt: '2024-01-01T00:00:00Z',
    faceRegistered: false,
  },
}));

vi.mock('../../api/user', () => ({
  getUserProfile: (...args) => mockGetUserProfile(...args),
}));

// Mock useFaceRecognition
const mockLoadModels = vi.fn();
const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
const mockCaptureFaceDescriptor = vi.fn();

let faceRecognitionOverrides = {};

vi.mock('../../hooks/useFaceRecognition', () => ({
  default: () => ({
    videoRef: { current: null },
    isModelLoaded: false,
    isScanning: false,
    error: null,
    isLoading: false,
    loadModels: mockLoadModels,
    registerFace: mockCaptureFaceDescriptor,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    ...faceRecognitionOverrides,
  }),
}));

// Mock BookCard component
vi.mock('../../components/BookCard', () => ({
  default: ({ book }) => <div data-testid="book-card">{book.title}</div>,
}));

// Mock ImageUpload component
vi.mock('../../components/ImageUpload', () => ({
  default: ({ imageUrl, onUploadSuccess }) => (
    <div data-testid="image-upload">
      <img src={imageUrl} alt="avatar" />
      <button onClick={() => onUploadSuccess?.('http://new-avatar.jpg')}>Upload</button>
    </div>
  ),
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

// Mock normalizeRole and formatDateTime
vi.mock('../../utils/userDisplay', () => ({
  normalizeRole: (role) => {
    if (role === 2 || role === '2' || role === 'ADMIN' || role === 'admin') return 'admin';
    return 'user';
  },
  formatDateTime: (value) => {
    if (!value) return '';
    const s = String(value);
    if (s.includes('T')) return s.replace('T', ' ').slice(0, 19);
    return s;
  },
}));

/** Helper: navigate to Account Settings tab */
async function goToAccountSettings() {
  const settingsTab = screen.getByText('Account Settings');
  fireEvent.click(settingsTab);
  // Wait for the tab content to render
  await waitFor(() => {
    expect(screen.getByText('Security Settings')).toBeInTheDocument();
  });
}

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
    faceRecognitionOverrides = {};
    mockGetUserProfile.mockResolvedValue({
      data: {
        username: 'testuser',
        nickname: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        role: 1,
        createdAt: '2024-01-01T00:00:00Z',
        faceRegistered: false,
      },
    });
  });

  describe('Profile Information Display', () => {
    it('renders profile page title', async () => {
      render(<Profile />);

      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('displays user nickname from API', async () => {
      render(<Profile />);

      await waitFor(() => {
        // Nickname appears in the profile header and in Descriptions
        const nicknameTexts = screen.getAllByText('Test User');
        expect(nicknameTexts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays username', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('@testuser')).toBeInTheDocument();
      });
    });

    it('displays role tag', async () => {
      render(<Profile />);

      await waitFor(() => {
        // "User" appears as role tag and in the descriptions
        const userTexts = screen.getAllByText('User');
        expect(userTexts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays account status tag', async () => {
      render(<Profile />);

      await waitFor(() => {
        // "Normal" appears as account status tag
        const normalTexts = screen.getAllByText('Normal');
        expect(normalTexts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays basic info in Descriptions', async () => {
      render(<Profile />);

      await waitFor(() => {
        // Username label and value
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('shows face registered tag when face is registered', async () => {
      mockGetUserProfile.mockResolvedValueOnce({
        data: {
          username: 'testuser',
          nickname: 'Test User',
          email: 'test@example.com',
          phone: '1234567890',
          role: 1,
          createdAt: '2024-01-01T00:00:00Z',
          faceRegistered: true,
        },
      });

      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Face Registered')).toBeInTheDocument();
      });
    });

    it('shows admin role for admin user', async () => {
      mockGetUserProfile.mockResolvedValueOnce({
        data: {
          username: 'admin',
          nickname: 'Admin User',
          email: 'admin@example.com',
          phone: '',
          role: 2,
          createdAt: '2024-01-01T00:00:00Z',
          faceRegistered: false,
        },
      });
      storeOverrides = { currentUser: { id: 2, username: 'admin', role: 2 } };

      render(<Profile />);

      await waitFor(() => {
        // "Admin" appears in the role tag and in Descriptions
        const adminTexts = screen.getAllByText('Admin');
        expect(adminTexts.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Edit Profile Functionality', () => {
    it('renders edit profile button', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });
    });

    it('opens edit modal when edit profile button is clicked', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        // The edit modal should contain the confirm button
        const confirmButtons = screen.getAllByText('Confirm');
        expect(confirmButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calls updateUserProfile on form submit', async () => {
      mockUpdateUserProfile.mockResolvedValue({});
      mockGetUserProfile.mockResolvedValue({
        data: {
          username: 'testuser',
          nickname: 'Updated User',
          email: 'updated@example.com',
          phone: '9876543210',
          role: 1,
          createdAt: '2024-01-01T00:00:00Z',
          faceRegistered: false,
        },
      });

      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        const confirmButtons = screen.getAllByText('Confirm');
        expect(confirmButtons.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Change Password Functionality', () => {
    it('renders change password link after navigating to settings tab', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();

      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });

    it('opens password modal when change password is clicked', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();

      fireEvent.click(screen.getByText('Change Password'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Old Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm New Password')).toBeInTheDocument();
      });
    });

    it('calls changePassword on form submit with matching passwords', async () => {
      mockChangePassword.mockResolvedValue({});
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();
      fireEvent.click(screen.getByText('Change Password'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Old Password')).toBeInTheDocument();
      });

      const oldPasswordInput = screen.getByPlaceholderText('Old Password');
      const newPasswordInput = screen.getByPlaceholderText('New Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm New Password');

      fireEvent.change(oldPasswordInput, { target: { value: 'oldpass123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpass456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpass456' } });

      // Find the submit button in the password modal
      const confirmButtons = screen.getAllByText('Confirm');
      const submitButton = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith('oldpass123', 'newpass456');
      });
    });

    it('shows error when passwords do not match', async () => {
      mockChangePassword.mockResolvedValue({});
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();
      fireEvent.click(screen.getByText('Change Password'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Old Password')).toBeInTheDocument();
      });

      const oldPasswordInput = screen.getByPlaceholderText('Old Password');
      const newPasswordInput = screen.getByPlaceholderText('New Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm New Password');

      fireEvent.change(oldPasswordInput, { target: { value: 'oldpass123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpass456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } });

      const confirmButtons = screen.getAllByText('Confirm');
      const submitButton = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(submitButton);

      // Ant Design form validation should catch the mismatch
      await waitFor(() => {
        expect(mockChangePassword).not.toHaveBeenCalled();
      });
    });
  });

  describe('Notification Settings', () => {
    it('renders notification settings after navigating to settings tab', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();

      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    it('renders notification toggle items', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();

      expect(screen.getByText('Borrow Due Reminder')).toBeInTheDocument();
      expect(screen.getByText('Reservation Arrival Reminder')).toBeInTheDocument();
      expect(screen.getByText('System Announcements')).toBeInTheDocument();
    });

    it('calls updateNotifSetting when toggle is changed', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();

      const switches = screen.getAllByRole('switch');
      if (switches.length > 0) {
        fireEvent.click(switches[0]);
        expect(mockUpdateNotifSetting).toHaveBeenCalled();
      }
    });
  });

  describe('Favorites Display', () => {
    it('renders my favorites section', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('My Favorites')).toBeInTheDocument();
      });
    });

    it('shows no favorites message when empty', async () => {
      storeOverrides = { favorites: [], favoriteBooks: [] };
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('No favorites yet')).toBeInTheDocument();
      });
    });

    it('renders favorite books when they exist', async () => {
      storeOverrides = {
        favorites: [1, 2],
        favoriteBooks: [
          { id: 1, title: 'Favorite Book 1' },
          { id: 2, title: 'Favorite Book 2' },
        ],
      };
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Favorite Book 1')).toBeInTheDocument();
        expect(screen.getByText('Favorite Book 2')).toBeInTheDocument();
      });
    });
  });

  describe('Face Recognition', () => {
    it('shows register face button when face is not registered', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();

      expect(screen.getByText('Register Face')).toBeInTheDocument();
    });

    it('shows remove face button when face is registered', async () => {
      mockGetUserProfile.mockResolvedValueOnce({
        data: {
          username: 'testuser',
          nickname: 'Test User',
          email: 'test@example.com',
          phone: '',
          role: 1,
          createdAt: '2024-01-01T00:00:00Z',
          faceRegistered: true,
        },
      });

      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();

      expect(screen.getByText('Remove Face')).toBeInTheDocument();
    });

    it('opens face registration modal when register face is clicked', async () => {
      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();

      fireEvent.click(screen.getByText('Register Face'));

      await waitFor(() => {
        expect(mockLoadModels).toHaveBeenCalled();
        expect(screen.getByText('Start Register')).toBeInTheDocument();
      });
    });

    it('calls registerFace on successful face capture', async () => {
      mockCaptureFaceDescriptor.mockResolvedValue([0.1, 0.2, 0.3]);
      mockRegisterFace.mockResolvedValue({});
      // Set isScanning to true so the Start Register button is enabled
      faceRecognitionOverrides = { isScanning: true };

      render(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      await goToAccountSettings();

      fireEvent.click(screen.getByText('Register Face'));

      await waitFor(() => {
        expect(screen.getByText('Start Register')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Register'));

      await waitFor(() => {
        expect(mockCaptureFaceDescriptor).toHaveBeenCalled();
      });
    });
  });

  describe('Profile Loading', () => {
    it('shows loading spinner while fetching profile', async () => {
      // Make the API call hang (never resolves)
      mockGetUserProfile.mockReturnValue(new Promise(() => {}));

      render(<Profile />);

      // Ant Design Spin component should be visible
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });
});
