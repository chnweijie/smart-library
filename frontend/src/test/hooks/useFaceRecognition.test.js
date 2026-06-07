import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock @vladmandic/face-api before importing the hook
vi.mock('@vladmandic/face-api', () => ({
  nets: {
    tinyFaceDetector: { loadFromUri: vi.fn(() => Promise.resolve()) },
    faceLandmark68Net: { loadFromUri: vi.fn(() => Promise.resolve()) },
    faceRecognitionNet: { loadFromUri: vi.fn(() => Promise.resolve()) },
  },
  TinyFaceDetectorOptions: vi.fn(() => ({})),
  detectSingleFace: vi.fn(() => ({
    withFaceLandmarks: vi.fn(() => ({
      withFaceDescriptor: vi.fn(() => Promise.resolve(null)),
    })),
  })),
  euclideanDistance: vi.fn(() => 0.5),
}));

import useFaceRecognition from '../../hooks/useFaceRecognition';

describe('useFaceRecognition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useFaceRecognition());

    expect(result.current.isModelLoaded).toBe(false);
    expect(result.current.isScanning).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('should expose videoRef', () => {
    const { result } = renderHook(() => useFaceRecognition());
    expect(result.current.videoRef).toBeDefined();
    expect(result.current.videoRef.current).toBe(null);
  });

  it('should expose loadModels function', () => {
    const { result } = renderHook(() => useFaceRecognition());
    expect(typeof result.current.loadModels).toBe('function');
  });

  it('should update state when loadModels succeeds', async () => {
    const { result } = renderHook(() => useFaceRecognition());

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

    const { result } = renderHook(() => useFaceRecognition());

    await act(async () => {
      await result.current.loadModels();
    });

    expect(result.current.isModelLoaded).toBe(false);
    expect(result.current.error).toBe('emotion.modelLoadFailed');
    expect(result.current.isLoading).toBe(false);
  });

  it('should not reload models if already loaded', async () => {
    const { result } = renderHook(() => useFaceRecognition());

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

  it('should expose extractDescriptor function', () => {
    const { result } = renderHook(() => useFaceRecognition());
    expect(typeof result.current.extractDescriptor).toBe('function');
  });

  it('should return null from extractDescriptor when no video', async () => {
    const { result } = renderHook(() => useFaceRecognition());

    const descriptor = await result.current.extractDescriptor();
    expect(descriptor).toBe(null);
  });

  it('should expose registerFace function', () => {
    const { result } = renderHook(() => useFaceRecognition());
    expect(typeof result.current.registerFace).toBe('function');
  });

  it('should return null from registerFace when no video', async () => {
    const { result } = renderHook(() => useFaceRecognition());

    const face = await result.current.registerFace();
    expect(face).toBe(null);
  });

  it('should expose matchFace function', () => {
    const { result } = renderHook(() => useFaceRecognition());
    expect(typeof result.current.matchFace).toBe('function');
  });

  it('should return null from matchFace when no descriptor', () => {
    const { result } = renderHook(() => useFaceRecognition());
    const match = result.current.matchFace(null, []);
    expect(match).toBe(null);
  });

  it('should return null from matchFace when no registered faces', () => {
    const { result } = renderHook(() => useFaceRecognition());
    const descriptor = new Array(128).fill(0.1);
    const match = result.current.matchFace(descriptor, []);
    expect(match).toBe(null);
  });

  it('should find a match when distance is below threshold', async () => {
    const faceapi = await import('@vladmandic/face-api');
    faceapi.euclideanDistance.mockReturnValue(0.4);

    const { result } = renderHook(() => useFaceRecognition());
    const descriptor = new Array(128).fill(0.1);
    const registeredFaces = [
      { id: 1, faceDescriptor: new Array(128).fill(0.1), username: 'user1' },
    ];

    const match = result.current.matchFace(descriptor, registeredFaces);
    expect(match).not.toBe(null);
    expect(match.id).toBe(1);
    expect(match.distance).toBe(0.4);
  });

  it('should return null when distance is above threshold', async () => {
    const faceapi = await import('@vladmandic/face-api');
    faceapi.euclideanDistance.mockReturnValue(0.8);

    const { result } = renderHook(() => useFaceRecognition());
    const descriptor = new Array(128).fill(0.1);
    const registeredFaces = [
      { id: 1, faceDescriptor: new Array(128).fill(0.5), username: 'user1' },
    ];

    const match = result.current.matchFace(descriptor, registeredFaces);
    expect(match).toBe(null);
  });

  it('should expose startCamera function', () => {
    const { result } = renderHook(() => useFaceRecognition());
    expect(typeof result.current.startCamera).toBe('function');
  });

  it('should expose stopCamera function', () => {
    const { result } = renderHook(() => useFaceRecognition());
    expect(typeof result.current.stopCamera).toBe('function');
  });

  it('should reset state on stopCamera', () => {
    const { result } = renderHook(() => useFaceRecognition());

    act(() => {
      result.current.stopCamera();
    });

    expect(result.current.isScanning).toBe(false);
  });

  it('should set camera error when startCamera fails', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn(() => Promise.reject(new Error('Camera denied'))),
      },
    });

    const { result } = renderHook(() => useFaceRecognition());

    await act(async () => {
      try {
        await result.current.startCamera();
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe('auth.cameraError');
    expect(result.current.isScanning).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useFaceRecognition());
    expect(() => unmount()).not.toThrow();
  });
});
