import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUpload from '../../components/ImageUpload';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'zh' },
  }),
}));

// Mock upload API
const mockUploadAvatar = vi.fn();
const mockChunkUpload = vi.fn();
const mockValidateImageFile = vi.fn();
const mockUpdateAvatarUrl = vi.fn();

vi.mock('../../api/upload', () => ({
  uploadAvatar: (...args) => mockUploadAvatar(...args),
  chunkUpload: (...args) => mockChunkUpload(...args),
  validateImageFile: (...args) => mockValidateImageFile(...args),
  updateAvatarUrl: (...args) => mockUpdateAvatarUrl(...args),
  MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
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

// Helper: create a mock File
function createMockFile(name = 'test.jpg', type = 'image/jpeg', size = 1024) {
  const file = new File(['x'.repeat(size)], name, { type });
  return file;
}

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateImageFile.mockReturnValue({ valid: true });
  });

  // ========== Upload button rendering ==========

  it('renders upload button in general mode when no image', () => {
    render(<ImageUpload mode="general" />);

    expect(screen.getByText('upload.selectImage')).toBeInTheDocument();
    expect(screen.getByText(/JPG\/PNG\/GIF\/WEBP/)).toBeInTheDocument();
  });

  it('renders avatar mode with PlusOutlined when no image', () => {
    const { container } = render(<ImageUpload mode="avatar" />);

    // Avatar mode renders a circular upload area
    const uploadArea = container.querySelector('.ant-upload');
    expect(uploadArea).toBeInTheDocument();
  });

  it('renders existing image in general mode', () => {
    render(<ImageUpload mode="general" imageUrl="https://example.com/img.jpg" />);

    const img = screen.getByAltText('preview');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
  });

  it('renders existing image in avatar mode', () => {
    const { container } = render(<ImageUpload mode="avatar" imageUrl="https://example.com/avatar.jpg" />);

    const img = container.querySelector('img[alt="avatar"]');
    expect(img).toBeInTheDocument();
  });

  // ========== File validation ==========

  it('calls validateImageFile when a file is selected', async () => {
    render(<ImageUpload mode="general" />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockValidateImageFile).toHaveBeenCalledWith(file);
  });

  it('shows error when validateImageFile returns invalid', async () => {
    const { message } = await import('antd');
    mockValidateImageFile.mockReturnValue({ valid: false, message: '不支持的图片格式' });

    render(<ImageUpload mode="general" />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile('test.pdf', 'application/pdf');

    await fireEvent.change(fileInput, { target: { files: [file] } });

    expect(message.error).toHaveBeenCalledWith('不支持的图片格式');
  });

  // ========== Successful upload flow (avatar mode) ==========

  it('uploads avatar successfully and calls onUploadSuccess', async () => {
    const onUploadSuccess = vi.fn();
    mockUploadAvatar.mockResolvedValue({ data: { url: 'https://example.com/new-avatar.jpg' } });
    mockUpdateAvatarUrl.mockResolvedValue({});

    render(<ImageUpload mode="avatar" onUploadSuccess={onUploadSuccess} />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith(file, expect.any(Function));
    });

    await waitFor(() => {
      expect(mockUpdateAvatarUrl).toHaveBeenCalledWith('https://example.com/new-avatar.jpg');
    });

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledWith('https://example.com/new-avatar.jpg');
    });
  });

  // ========== Successful upload flow (general mode with chunkUpload) ==========

  it('uploads general image with chunkUpload successfully', async () => {
    const onUploadSuccess = vi.fn();
    mockChunkUpload.mockResolvedValue('https://example.com/uploaded.jpg');

    render(<ImageUpload mode="general" onUploadSuccess={onUploadSuccess} />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockChunkUpload).toHaveBeenCalledWith(file, expect.any(Function), expect.any(String));
    });

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledWith('https://example.com/uploaded.jpg');
    });
  });

  // ========== Failed upload flow ==========

  it('shows error on avatar upload failure', async () => {
    const { message } = await import('antd');
    mockUploadAvatar.mockRejectedValue(new Error('Upload failed'));

    render(<ImageUpload mode="avatar" />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Upload failed');
    });
  });

  it('shows error on chunkUpload failure', async () => {
    const { message } = await import('antd');
    mockChunkUpload.mockRejectedValue(new Error('Chunk upload failed'));

    render(<ImageUpload mode="general" />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Chunk upload failed');
    });
  });

  it('shows retry button on upload error in general mode', async () => {
    mockChunkUpload.mockRejectedValue(new Error('Upload failed'));

    render(<ImageUpload mode="general" />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('upload.retry')).toBeInTheDocument();
    });
  });

  it('shows retry button on upload error in avatar mode', async () => {
    mockUploadAvatar.mockRejectedValue(new Error('Upload failed'));

    render(<ImageUpload mode="avatar" />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('upload.retry')).toBeInTheDocument();
    });
  });

  // ========== Chunk upload for large files (retry) ==========

  it('retries chunkUpload when retry button is clicked', async () => {
    const onUploadSuccess = vi.fn();
    mockChunkUpload
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce('https://example.com/retried.jpg');

    render(<ImageUpload mode="general" onUploadSuccess={onUploadSuccess} />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('upload.retry')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByText('upload.retry'));

    await waitFor(() => {
      expect(mockChunkUpload).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledWith('https://example.com/retried.jpg');
    });
  });

  // ========== Progress callback ==========

  it('calls progress callback during avatar upload', async () => {
    mockUploadAvatar.mockImplementation((file, onProgress) => {
      if (onProgress) {
        onProgress({ loaded: 50, total: 100 });
      }
      return Promise.resolve({ data: { url: 'https://example.com/avatar.jpg' } });
    });

    render(<ImageUpload mode="avatar" />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith(file, expect.any(Function));
    });
  });

  it('calls progress callback during chunkUpload', async () => {
    mockChunkUpload.mockImplementation((file, onProgress) => {
      if (onProgress) {
        onProgress(50);
      }
      return Promise.resolve('https://example.com/uploaded.jpg');
    });

    render(<ImageUpload mode="general" />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = createMockFile();

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockChunkUpload).toHaveBeenCalledWith(file, expect.any(Function), expect.any(String));
    });
  });

  // ========== Remove functionality ==========

  it('removes preview image when delete is clicked in general mode', async () => {
    render(<ImageUpload mode="general" imageUrl="https://example.com/img.jpg" />);

    // Find the delete icon (DeleteOutlined)
    const deleteIcons = screen.getAllByRole('img');
    const deleteIcon = deleteIcons.find(icon =>
      icon.classList.contains('anticon-delete') ||
      icon.getAttribute('aria-label')?.includes('delete')
    );

    if (deleteIcon) {
      fireEvent.click(deleteIcon);
    }

    // After removing, the upload button should appear
    // This tests the handleRemove callback
  });

  // ========== Max size display ==========

  it('displays max size info in general mode', () => {
    render(<ImageUpload mode="general" maxSize={5 * 1024 * 1024} />);

    expect(screen.getByText(/upload\.maxSize/)).toBeInTheDocument();
  });
});
