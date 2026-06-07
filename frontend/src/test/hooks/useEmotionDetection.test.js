import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @vladmandic/face-api before importing the hook
vi.mock('@vladmandic/face-api', () => ({
  nets: {
    tinyFaceDetector: { loadFromUri: vi.fn(() => Promise.resolve()) },
    faceLandmark68Net: { loadFromUri: vi.fn(() => Promise.resolve()) },
    faceExpressionNet: { loadFromUri: vi.fn(() => Promise.resolve()) },
  },
  TinyFaceDetectorOptions: vi.fn(() => ({})),
  detectSingleFace: vi.fn(() => ({
    withFaceLandmarks: vi.fn(() => ({
      withFaceExpressions: vi.fn(() => Promise.resolve(null)),
    })),
  })),
}));

import useEmotionDetection from '../../hooks/useEmotionDetection';

describe('useEmotionDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useEmotionDetection());

    expect(result.current.isModelLoaded).toBe(false);
    expect(result.current.isDetecting).toBe(false);
    expect(result.current.emotion).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('should expose videoRef', () => {
    const { result } = renderHook(() => useEmotionDetection());
    expect(result.current.videoRef).toBeDefined();
    expect(result.current.videoRef.current).toBe(null);
  });

  it('should expose loadModels function', () => {
    const { result } = renderHook(() => useEmotionDetection());
    expect(typeof result.current.loadModels).toBe('function');
  });

  it('should update state when loadModels succeeds', async () => {
    const { result } = renderHook(() => useEmotionDetection());

    await act(async () => {
      await result.current.loadModels();
    });

    expect(result.current.isModelLoaded).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should set error when loadModels fails', async () => {
    const faceapi = await import('@vladmandic/face-api');
    faceapi.nets.tinyFaceDetector.loadFromUri.mockRejectedValueOnce(new Error('load failed'));

    const { result } = renderHook(() => useEmotionDetection());

    await act(async () => {
      await result.current.loadModels();
    });

    expect(result.current.isModelLoaded).toBe(false);
    expect(result.current.error).toBe('emotion.modelLoadFailed');
    expect(result.current.isLoading).toBe(false);
  });

  it('should not reload models if already loaded', async () => {
    const { result } = renderHook(() => useEmotionDetection());

    await act(async () => {
      await result.current.loadModels();
    });

    const faceapi = await import('@vladmandic/face-api');
    const callCount = faceapi.nets.tinyFaceDetector.loadFromUri.mock.calls.length;

    await act(async () => {
      await result.current.loadModels();
    });

    expect(faceapi.nets.tinyFaceDetector.loadFromUri.mock.calls.length).toBe(callCount);
  });

  it('should expose startDetection function', () => {
    const { result } = renderHook(() => useEmotionDetection());
    expect(typeof result.current.startDetection).toBe('function');
  });

  it('should expose stopDetection function', () => {
    const { result } = renderHook(() => useEmotionDetection());
    expect(typeof result.current.stopDetection).toBe('function');
  });

  it('should reset state on stopDetection', async () => {
    const { result } = renderHook(() => useEmotionDetection());

    // First load models
    await act(async () => {
      await result.current.loadModels();
    });
    expect(result.current.isModelLoaded).toBe(true);

    // Stop detection should reset detecting state and emotion
    act(() => {
      result.current.stopDetection();
    });

    expect(result.current.isDetecting).toBe(false);
    expect(result.current.emotion).toBe(null);
  });

  it('should set camera error when startDetection fails', async () => {
    // Mock getUserMedia to reject
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn(() => Promise.reject(new Error('Camera denied'))),
      },
    });

    const { result } = renderHook(() => useEmotionDetection());

    await act(async () => {
      try {
        await result.current.startDetection();
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('auth.cameraError');
    expect(result.current.isDetecting).toBe(false);

    // Restore
    if (originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    }
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useEmotionDetection());

    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();
  });
});
