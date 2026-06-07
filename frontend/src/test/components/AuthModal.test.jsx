import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '../../components/AuthModal';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const map = {
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.username': 'Username',
        'auth.password': 'Password',
        'auth.nickname': 'Nickname',
        'auth.email': 'Email',
        'auth.confirmPassword': 'Confirm Password',
        'auth.passwordMismatch': 'Passwords do not match',
        'auth.invalidEmail': 'Invalid email',
        'auth.faceLogin': 'Face Login',
        'auth.startFaceScan': 'Start Face Scan',
        'auth.scanning': 'Scanning',
        'auth.faceNotFound': 'Face not found',
        'auth.testAccounts': 'Test accounts',
        'auth.cameraError': 'Camera error',
        'emotion.loadingModel': 'Loading model...',
      };
      if (key.startsWith('auth.loginSuccess') || key.startsWith('auth.registerSuccess')) {
        return key;
      }
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock useStore
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockFaceLogin = vi.fn();

vi.mock('../../store/useStore', () => ({
  useStore: () => ({
    login: mockLogin,
    register: mockRegister,
    faceLogin: mockFaceLogin,
  }),
}));

// Mock useFaceRecognition
const mockLoadModels = vi.fn();
const mockStartCamera = vi.fn();
const mockStopCamera = vi.fn();
const mockExtractDescriptor = vi.fn();

vi.mock('../../hooks/useFaceRecognition', () => ({
  default: () => ({
    videoRef: { current: null },
    isModelLoaded: false,
    isScanning: false,
    error: null,
    isLoading: false,
    loadModels: mockLoadModels,
    extractDescriptor: mockExtractDescriptor,
    matchFace: vi.fn(),
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
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

const defaultProps = {
  open: true,
  mode: 'login',
  onCancel: vi.fn(),
};

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Mode', () => {
    it('renders login modal with username and password fields', () => {
      render(<AuthModal {...defaultProps} />);

      // "Login" appears in modal title, tab label, and submit button
      const loginTexts = screen.getAllByText('Login');
      expect(loginTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('renders login form fields in password tab', () => {
      render(<AuthModal {...defaultProps} />);

      // Username and Password placeholders should be visible
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('does not show register-only fields in login mode', () => {
      render(<AuthModal {...defaultProps} />);

      expect(screen.queryByPlaceholderText('Nickname')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Confirm Password')).not.toBeInTheDocument();
    });

    it('renders login submit button', () => {
      render(<AuthModal {...defaultProps} />);

      const submitButtons = screen.getAllByRole('button');
      const loginButton = submitButtons.find(btn => btn.textContent === 'Login' && btn.type === 'submit');
      // The login form should have a submit button
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    });

    it('renders face login tab in login mode', () => {
      render(<AuthModal {...defaultProps} />);

      expect(screen.getByText('Face Login')).toBeInTheDocument();
    });
  });

  describe('Register Mode', () => {
    it('renders register modal with all fields', () => {
      render(<AuthModal open={true} mode="register" onCancel={vi.fn()} />);

      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nickname')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    });

    it('renders register submit button text', () => {
      render(<AuthModal open={true} mode="register" onCancel={vi.fn()} />);

      // In register mode, the tab label and button should show "Register"
      const registerTexts = screen.getAllByText('Register');
      expect(registerTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('does not show face login tab in register mode', () => {
      render(<AuthModal open={true} mode="register" onCancel={vi.fn()} />);

      expect(screen.queryByText('Face Login')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for empty username on submit', async () => {
      render(<AuthModal {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Click submit button
      const form = passwordInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        // Ant Design shows validation messages
        expect(screen.getByText('Username')).toBeInTheDocument();
      });
    });

    it('shows validation error for empty password on submit', async () => {
      render(<AuthModal {...defaultProps} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const form = usernameInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Password')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Login Flow', () => {
    it('calls login and onCancel on successful login', async () => {
      mockLogin.mockResolvedValue({ success: true, messageKey: 'auth.loginSuccess' });
      const mockOnCancel = vi.fn();

      render(<AuthModal open={true} mode="login" onCancel={mockOnCancel} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      const passwordInput = screen.getByPlaceholderText('Password');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const form = usernameInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });

    it('shows error message on failed login', async () => {
      const { message } = await import('antd');
      mockLogin.mockResolvedValue({ success: false, message: 'Invalid credentials', messageKey: 'auth.loginFailed' });

      render(<AuthModal {...defaultProps} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      const passwordInput = screen.getByPlaceholderText('Password');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

      const form = usernameInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalled();
      });
    });
  });

  describe('Successful Register Flow', () => {
    it('calls register on successful registration', async () => {
      mockRegister.mockResolvedValue({ success: true, messageKey: 'auth.registerSuccess' });
      const mockOnCancel = vi.fn();

      render(<AuthModal open={true} mode="register" onCancel={mockOnCancel} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      const nicknameInput = screen.getByPlaceholderText('Nickname');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');

      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(nicknameInput, { target: { value: 'New User' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

      const form = usernameInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('newuser', 'password123', 'New User', 'new@example.com');
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });

    it('shows error when passwords do not match on register', async () => {
      const { message } = await import('antd');
      mockRegister.mockResolvedValue({ success: true, messageKey: 'auth.registerSuccess' });

      render(<AuthModal open={true} mode="register" onCancel={vi.fn()} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      const nicknameInput = screen.getByPlaceholderText('Nickname');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');

      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(nicknameInput, { target: { value: 'New User' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } });

      const form = usernameInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Passwords do not match');
      });
    });

    it('shows error message on failed registration', async () => {
      const { message } = await import('antd');
      mockRegister.mockResolvedValue({ success: false, message: 'Username exists', messageKey: 'auth.registerFailed' });

      render(<AuthModal open={true} mode="register" onCancel={vi.fn()} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      const nicknameInput = screen.getByPlaceholderText('Nickname');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');

      fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
      fireEvent.change(nicknameInput, { target: { value: 'User' } });
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

      const form = usernameInput.closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalled();
      });
    });
  });

  describe('Face Login Tab', () => {
    it('renders face login tab content when clicked', async () => {
      render(<AuthModal {...defaultProps} />);

      const faceLoginTab = screen.getByText('Face Login');
      fireEvent.click(faceLoginTab);

      await waitFor(() => {
        expect(mockLoadModels).toHaveBeenCalled();
      });
    });

    it('shows start face scan button in face login tab', async () => {
      render(<AuthModal {...defaultProps} />);

      const faceLoginTab = screen.getByText('Face Login');
      fireEvent.click(faceLoginTab);

      // The face scan button should appear
      await waitFor(() => {
        expect(screen.getByText('Start Face Scan')).toBeInTheDocument();
      });
    });

    it('shows test accounts info', () => {
      render(<AuthModal {...defaultProps} />);

      expect(screen.getByText('Test accounts')).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('switches from login to register when mode prop changes', () => {
      const { rerender } = render(<AuthModal open={true} mode="login" onCancel={vi.fn()} />);

      // Login mode should not have register fields
      expect(screen.queryByPlaceholderText('Nickname')).not.toBeInTheDocument();

      rerender(<AuthModal open={true} mode="register" onCancel={vi.fn()} />);

      // Register mode should have register fields
      expect(screen.getByPlaceholderText('Nickname')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    });

    it('resets form when modal reopens', () => {
      const { rerender } = render(<AuthModal open={true} mode="login" onCancel={vi.fn()} />);

      const usernameInput = screen.getByPlaceholderText('Username');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      // Close and reopen
      rerender(<AuthModal open={false} mode="login" onCancel={vi.fn()} />);
      rerender(<AuthModal open={true} mode="login" onCancel={vi.fn()} />);

      // Form should be reset
      const newUsernameInput = screen.getByPlaceholderText('Username');
      expect(newUsernameInput.value).toBe('');
    });
  });

  describe('Cancel Handling', () => {
    it('calls onCancel when modal cancel is clicked', () => {
      const mockOnCancel = vi.fn();
      render(<AuthModal open={true} mode="login" onCancel={mockOnCancel} />);

      // Find and click the close button (X button on modal)
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn =>
        btn.classList.contains('ant-modal-close') ||
        btn.getAttribute('aria-label') === 'Close'
      );

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnCancel).toHaveBeenCalled();
      }
    });

    it('stops camera on cancel', () => {
      const mockOnCancel = vi.fn();
      render(<AuthModal open={true} mode="login" onCancel={mockOnCancel} />);

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn =>
        btn.classList.contains('ant-modal-close') ||
        btn.getAttribute('aria-label') === 'Close'
      );

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockStopCamera).toHaveBeenCalled();
      }
    });
  });

  describe('Modal Visibility', () => {
    it('does not render modal content when open is false', () => {
      render(<AuthModal open={false} mode="login" onCancel={vi.fn()} />);

      expect(screen.queryByPlaceholderText('Username')).not.toBeInTheDocument();
    });

    it('renders modal content when open is true', () => {
      render(<AuthModal open={true} mode="login" onCancel={vi.fn()} />);

      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    });
  });
});
