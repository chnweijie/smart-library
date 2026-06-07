import { validateImageFile, ALLOWED_EXTENSIONS, MAX_SIZE, CHUNK_SIZE, chunkUpload } from '../../api/upload';

// Mock the internal API calls for chunkUpload tests
vi.mock('../../api/request', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// We need to mock the individual API functions that chunkUpload calls
// Since they are in the same module, we need to use vi.mock on the module itself
// and re-import. Instead, we'll mock request and let the real functions use it.

describe('upload API', () => {
  describe('validateImageFile', () => {
    function makeFile(name, type, size) {
      return { name, type, size };
    }

    it('有效的 jpg 文件通过校验', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('有效的 png 文件通过校验', () => {
      const file = makeFile('image.png', 'image/png', 2048);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('有效的 gif 文件通过校验', () => {
      const file = makeFile('anim.gif', 'image/gif', 3072);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('有效的 webp 文件通过校验', () => {
      const file = makeFile('pic.webp', 'image/webp', 4096);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('有效的 jpeg 文件通过校验', () => {
      const file = makeFile('photo.jpeg', 'image/jpeg', 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('不支持的扩展名返回校验失败', () => {
      const file = makeFile('doc.pdf', 'application/pdf', 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('不支持的图片格式');
    });

    it('bmp 扩展名返回校验失败', () => {
      const file = makeFile('image.bmp', 'image/bmp', 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('不支持的图片格式');
    });

    it('文件超过5MB返回校验失败', () => {
      const file = makeFile('big.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('不能超过');
    });

    it('文件恰好5MB通过校验', () => {
      const file = makeFile('exact.jpg', 'image/jpeg', 5 * 1024 * 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('null 文件返回校验失败', () => {
      const result = validateImageFile(null);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请选择文件');
    });

    it('undefined 文件返回校验失败', () => {
      const result = validateImageFile(undefined);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请选择文件');
    });

    it('非图片 MIME 类型返回校验失败', () => {
      const file = makeFile('photo.jpg', 'application/pdf', 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请选择图片文件');
    });

    it('MIME 类型为空时校验失败', () => {
      const file = makeFile('photo.jpg', '', 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('请选择图片文件');
    });

    it('扩展名大写也能通过校验', () => {
      const file = makeFile('photo.JPG', 'image/jpeg', 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('导出常量', () => {
    it('ALLOWED_EXTENSIONS 包含 jpg, jpeg, png, gif, webp', () => {
      expect(ALLOWED_EXTENSIONS).toEqual(['jpg', 'jpeg', 'png', 'gif', 'webp']);
    });

    it('MAX_SIZE 为 5MB', () => {
      expect(MAX_SIZE).toBe(5 * 1024 * 1024);
    });

    it('CHUNK_SIZE 为 1MB', () => {
      expect(CHUNK_SIZE).toBe(1024 * 1024);
    });
  });

  describe('chunkUpload', () => {
    let request;

    beforeEach(async () => {
      request = (await import('../../api/request')).default;
      vi.clearAllMocks();
    });

    // Helper: create a mock file with slice support
    function createMockFile(size, name = 'test.jpg') {
      const chunks = [];
      return {
        name,
        size,
        slice: (start, end) => {
          const blob = { size: Math.min(end, size) - start, name };
          chunks.push(blob);
          return blob;
        },
      };
    }

    it('uploads a small file (1 chunk) successfully', async () => {
      // File smaller than CHUNK_SIZE → 1 chunk
      const file = createMockFile(512 * 1024); // 512KB
      const fileId = 'test-file-id';

      request.get.mockResolvedValue({ data: { uploadedChunks: [] } });
      request.post.mockImplementation((url) => {
        if (url.includes('/chunk')) return Promise.resolve({});
        if (url.includes('/merge')) return Promise.resolve({ data: { url: 'https://example.com/uploaded.jpg' } });
        return Promise.resolve({});
      });

      const onProgress = vi.fn();
      const result = await chunkUpload(file, onProgress, fileId);

      expect(result).toBe('https://example.com/uploaded.jpg');
      expect(request.get).toHaveBeenCalledWith('/files/upload/chunk-check', { params: { fileId } });
      expect(request.post).toHaveBeenCalledWith('/files/upload/chunk', expect.any(FormData), expect.any(Object));
      expect(request.post).toHaveBeenCalledWith('/files/upload/merge', null, { params: { fileId } });
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('uploads a large file (multiple chunks) successfully', async () => {
      // File larger than CHUNK_SIZE → multiple chunks
      const file = createMockFile(2.5 * 1024 * 1024); // 2.5MB → 3 chunks
      const fileId = 'test-large-file-id';

      request.get.mockResolvedValue({ data: { uploadedChunks: [] } });
      request.post.mockImplementation((url) => {
        if (url.includes('/chunk')) return Promise.resolve({});
        if (url.includes('/merge')) return Promise.resolve({ data: { url: 'https://example.com/large.jpg' } });
        return Promise.resolve({});
      });

      const onProgress = vi.fn();
      const result = await chunkUpload(file, onProgress, fileId);

      expect(result).toBe('https://example.com/large.jpg');
      // Should have called uploadChunk 3 times (for 3 chunks)
      const chunkCalls = request.post.mock.calls.filter(call => call[0].includes('/chunk'));
      expect(chunkCalls.length).toBe(3);
      // Progress should have been called for each chunk
      expect(onProgress).toHaveBeenCalledTimes(3);
      // Last progress should be 100
      expect(onProgress).toHaveBeenLastCalledWith(100);
    });

    it('resumes upload by skipping already uploaded chunks', async () => {
      const file = createMockFile(3 * 1024 * 1024); // 3MB → 3 chunks
      const fileId = 'test-resume-id';

      // Chunk 0 already uploaded
      request.get.mockResolvedValue({ data: { uploadedChunks: [0] } });
      request.post.mockImplementation((url) => {
        if (url.includes('/chunk')) return Promise.resolve({});
        if (url.includes('/merge')) return Promise.resolve({ data: { url: 'https://example.com/resumed.jpg' } });
        return Promise.resolve({});
      });

      const onProgress = vi.fn();
      const result = await chunkUpload(file, onProgress, fileId);

      expect(result).toBe('https://example.com/resumed.jpg');
      // Should only upload chunks 1 and 2 (skip chunk 0)
      const chunkCalls = request.post.mock.calls.filter(call => call[0].includes('/chunk'));
      expect(chunkCalls.length).toBe(2);
    });

    it('retries on chunk upload failure and eventually succeeds', async () => {
      const file = createMockFile(512 * 1024); // 1 chunk
      const fileId = 'test-retry-id';

      request.get.mockResolvedValue({ data: { uploadedChunks: [] } });

      let chunkAttempt = 0;
      request.post.mockImplementation((url) => {
        if (url.includes('/chunk')) {
          chunkAttempt++;
          if (chunkAttempt <= 2) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({});
        }
        if (url.includes('/merge')) return Promise.resolve({ data: { url: 'https://example.com/retried.jpg' } });
        return Promise.resolve({});
      });

      // Mock setTimeout to speed up retry delay
      vi.useFakeTimers();

      const onProgress = vi.fn();
      const uploadPromise = chunkUpload(file, onProgress, fileId);

      // Advance timers for retry delays
      await vi.advanceTimersByTimeAsync(3000);

      const result = await uploadPromise;

      expect(result).toBe('https://example.com/retried.jpg');
      // Should have attempted 3 times (2 failures + 1 success)
      const chunkCalls = request.post.mock.calls.filter(call => call[0].includes('/chunk'));
      expect(chunkCalls.length).toBe(3);

      vi.useRealTimers();
    });

    it('throws error when all retries are exhausted', async () => {
      const file = createMockFile(512 * 1024); // 1 chunk
      const fileId = 'test-fail-id';

      request.get.mockResolvedValue({ data: { uploadedChunks: [] } });
      request.post.mockImplementation((url) => {
        if (url.includes('/chunk')) {
          return Promise.reject(new Error('Persistent failure'));
        }
        return Promise.resolve({});
      });

      vi.useFakeTimers();

      const onProgress = vi.fn();
      // Start the upload - it will fail after 3 retries
      // Add .catch() immediately to prevent unhandled rejection
      const uploadPromise = chunkUpload(file, onProgress, fileId);
      uploadPromise.catch(() => {}); // Prevent unhandled rejection

      // Advance timers for all retry delays (3 retries × 1 second each)
      await vi.advanceTimersByTimeAsync(5000);

      // Now await the promise and expect it to reject
      let thrownError;
      try {
        await uploadPromise;
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.message).toBe('分片 0 上传失败: Persistent failure');

      // Should have attempted 3 times
      const chunkCalls = request.post.mock.calls.filter(call => call[0].includes('/chunk'));
      expect(chunkCalls.length).toBe(3);

      // Merge should NOT have been called
      const mergeCalls = request.post.mock.calls.filter(call => call[0].includes('/merge'));
      expect(mergeCalls.length).toBe(0);

      vi.useRealTimers();
    });

    it('generates fileId when not provided (indirectly through chunkUpload)', async () => {
      const file = createMockFile(512 * 1024);

      request.get.mockResolvedValue({ data: { uploadedChunks: [] } });
      request.post.mockImplementation((url) => {
        if (url.includes('/chunk')) return Promise.resolve({});
        if (url.includes('/merge')) return Promise.resolve({ data: { url: 'https://example.com/auto-id.jpg' } });
        return Promise.resolve({});
      });

      const result = await chunkUpload(file, vi.fn());

      expect(result).toBe('https://example.com/auto-id.jpg');
      // checkChunks should have been called with a generated fileId
      expect(request.get).toHaveBeenCalledWith('/files/upload/chunk-check', expect.objectContaining({
        params: expect.objectContaining({
          fileId: expect.any(String),
        }),
      }));
      // The generated fileId should contain the file size
      const calledFileId = request.get.mock.calls[0][1].params.fileId;
      expect(calledFileId).toContain(String(file.size));
    });

    it('handles checkChunks failure gracefully (starts from scratch)', async () => {
      const file = createMockFile(512 * 1024);
      const fileId = 'test-check-fail-id';

      // checkChunks fails → treat as no uploaded chunks
      request.get.mockRejectedValue(new Error('Check failed'));
      request.post.mockImplementation((url) => {
        if (url.includes('/chunk')) return Promise.resolve({});
        if (url.includes('/merge')) return Promise.resolve({ data: { url: 'https://example.com/from-scratch.jpg' } });
        return Promise.resolve({});
      });

      const result = await chunkUpload(file, vi.fn(), fileId);

      expect(result).toBe('https://example.com/from-scratch.jpg');
      // Should still upload the chunk
      const chunkCalls = request.post.mock.calls.filter(call => call[0].includes('/chunk'));
      expect(chunkCalls.length).toBe(1);
    });

    it('calls onProgress for each chunk and skipped chunk', async () => {
      const file = createMockFile(2 * 1024 * 1024); // 2MB → 2 chunks
      const fileId = 'test-progress-id';

      // Chunk 0 already uploaded, chunk 1 needs upload
      request.get.mockResolvedValue({ data: { uploadedChunks: [0] } });
      request.post.mockImplementation((url) => {
        if (url.includes('/chunk')) return Promise.resolve({});
        if (url.includes('/merge')) return Promise.resolve({ data: { url: 'https://example.com/progress.jpg' } });
        return Promise.resolve({});
      });

      const onProgress = vi.fn();
      await chunkUpload(file, onProgress, fileId);

      // Progress for chunk 0 (skipped) and chunk 1 (uploaded)
      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(1, 50); // (0+1)/2 * 100 = 50
      expect(onProgress).toHaveBeenNthCalledWith(2, 100); // (1+1)/2 * 100 = 100
    });
  });
});
