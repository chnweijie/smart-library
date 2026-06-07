import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = '/models';
const MATCH_THRESHOLD = 0.4;

export default function useFaceRecognition() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadModels = useCallback(async () => {
    if (isModelLoaded || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setIsModelLoaded(true);
    } catch {
      setError('emotion.modelLoadFailed');
    } finally {
      setIsLoading(false);
    }
  }, [isModelLoaded, isLoading]);

  const extractDescriptor = async () => {
    if (!videoRef.current || videoRef.current.paused) return null;
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      return detection ? Array.from(detection.descriptor) : null;
    } catch {
      return null;
    }
  };

  const registerFace = useCallback(async (count = 3) => {
    const descriptors = [];
    for (let i = 0; i < count; i++) {
      const descriptor = await extractDescriptor();
      if (descriptor) descriptors.push(descriptor);
      await new Promise(r => setTimeout(r, 500));
    }
    if (descriptors.length === 0) return null;
    const avg = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      avg[i] = descriptors.reduce((sum, d) => sum + d[i], 0) / descriptors.length;
    }
    return Array.from(avg);
  }, []);

  const matchFace = useCallback((descriptor, registeredFaces) => {
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) return null;
    if (!registeredFaces?.length) return null;
    const inputDescriptor = new Float32Array(descriptor);
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const registered of registeredFaces) {
      if (!registered.faceDescriptor) continue;
      const stored = Array.isArray(registered.faceDescriptor) ? registered.faceDescriptor : null;
      if (!stored || stored.length !== 128) continue;
      const storedDescriptor = new Float32Array(stored);
      const distance = faceapi.euclideanDistance(inputDescriptor, storedDescriptor);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = { ...registered, distance };
      }
    }

    return bestDistance < MATCH_THRESHOLD ? bestMatch : null;
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
    } catch {
      setError('auth.cameraError');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return {
    videoRef,
    isModelLoaded,
    isScanning,
    error,
    isLoading,
    loadModels,
    extractDescriptor,
    registerFace,
    matchFace,
    startCamera,
    stopCamera,
  };
}
