import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = '/models';
const DETECTION_INTERVAL = 300;
const SMOOTH_WINDOW = 5;
const MAX_CONSECUTIVE_ERRORS = 10;
const ANALYSIS_DURATION = 5000;

export default function useEmotionDetection() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const emotionHistoryRef = useRef([]);
  const consecutiveErrorsRef = useRef(0);
  const progressTimerRef = useRef(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [emotionScores, setEmotionScores] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const loadModels = useCallback(async () => {
    if (isModelLoaded || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setIsModelLoaded(true);
    } catch (err) {
      setError('emotion.modelLoadFailed');
    } finally {
      setIsLoading(false);
    }
  }, [isModelLoaded, isLoading]);

  const getSmoothedEmotion = (currentEmotion) => {
    emotionHistoryRef.current.push(currentEmotion);
    if (emotionHistoryRef.current.length > SMOOTH_WINDOW) {
      emotionHistoryRef.current.shift();
    }
    const counts = {};
    emotionHistoryRef.current.forEach(e => {
      counts[e] = (counts[e] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const detectEmotion = async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
    try {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detection) {
        consecutiveErrorsRef.current = 0;
        const expressions = detection.expressions;
        const sorted = Object.entries(expressions)
          .sort((a, b) => b[1] - a[1]);
        const smoothed = getSmoothedEmotion(sorted[0][0]);
        setEmotion(smoothed);
        setEmotionScores(expressions);
      }
    } catch {
      consecutiveErrorsRef.current++;
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        setError('emotion.detectionFailed');
        return;
      }
    }
  };

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsDetecting(false);
    setAnalysisProgress(0);
  }, []);

  const startDetection = useCallback(async () => {
    if (streamRef.current) return;
    setAnalysisComplete(false);
    setEmotion(null);
    setEmotionScores(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsDetecting(true);
      emotionHistoryRef.current = [];
      consecutiveErrorsRef.current = 0;

      const startTime = Date.now();
      progressTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(Math.round((elapsed / ANALYSIS_DURATION) * 100), 100);
        setAnalysisProgress(progress);
      }, 100);

      const loop = async () => {
        await detectEmotion();
        timerRef.current = setTimeout(loop, DETECTION_INTERVAL);
      };
      loop();

      autoStopTimerRef.current = setTimeout(() => {
        stopStream();
        setAnalysisComplete(true);
      }, ANALYSIS_DURATION);
    } catch {
      setError('auth.cameraError');
    }
  }, [stopStream]);

  const stopDetection = useCallback(() => {
    stopStream();
    setAnalysisComplete(true);
  }, [stopStream]);

  const resetAnalysis = useCallback(() => {
    setEmotion(null);
    setEmotionScores(null);
    setAnalysisComplete(false);
    setAnalysisProgress(0);
    emotionHistoryRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    isModelLoaded,
    isDetecting,
    emotion,
    emotionScores,
    error,
    isLoading,
    analysisProgress,
    analysisComplete,
    loadModels,
    startDetection,
    stopDetection,
    resetAnalysis,
  };
}
