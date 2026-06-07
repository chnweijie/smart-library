import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Typography, Card, Button, Space, Progress, Tag, Spin, message } from 'antd';
import { CameraOutlined, StopOutlined, SafetyCertificateOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import useEmotionDetection from '../hooks/useEmotionDetection';
import { getEmotionConfig, EMOTION_KEYS, getBooksByEmotion } from '../utils/emotionMapping';
import BookCard from '../components/BookCard';

const { Title, Text, Paragraph } = Typography;

export default function EmotionAnalysis() {
  const { t } = useTranslation();
  const { currentUser, books, categories, fetchBooks, fetchCategories, fetchEmotionRecommend, recordEmotion, setCurrentEmotionRecordId, clearEmotionRecordId } = useStore();
  const {
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
  } = useEmotionDetection();

  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [loadingRecommend, setLoadingRecommend] = useState(false);
  const [emotionRecorded, setEmotionRecorded] = useState(false);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (privacyAgreed) {
      loadModels();
      if (books.length === 0) fetchBooks({ page: 1, size: 100 });
      if (categories.length === 0) fetchCategories();
    }
  }, [privacyAgreed, loadModels, books.length, categories.length, fetchBooks, fetchCategories]);

  useEffect(() => {
    if (analysisComplete && emotion && !recordedRef.current) {
      recordedRef.current = true;
      const confidence = emotionScores ? Math.round((emotionScores[emotion] || 0) * 100) / 100 : 0.5;
      recordEmotion({ emotion, confidence })
        .then((record) => {
          if (record) {
            setEmotionRecorded(true);
            setCurrentEmotionRecordId(record.id);
          }
        })
        .catch(() => {});

      setLoadingRecommend(true);
      fetchEmotionRecommend(emotion)
        .then((data) => {
          if (data && data.length > 0) {
            setRecommendedBooks(data);
          } else {
            setRecommendedBooks(getBooksByEmotion(emotion, books, categories));
          }
        })
        .catch(() => {
          setRecommendedBooks(getBooksByEmotion(emotion, books, categories));
        })
        .finally(() => setLoadingRecommend(false));
    }
  }, [analysisComplete, emotion, emotionScores, books, categories, fetchEmotionRecommend, recordEmotion]);

  const handleStartDetection = () => {
    setEmotionRecorded(false);
    setRecommendedBooks([]);
    recordedRef.current = false;
    clearEmotionRecordId();
    startDetection();
  };

  const handleReset = () => {
    resetAnalysis();
    setEmotionRecorded(false);
    setRecommendedBooks([]);
    recordedRef.current = false;
    clearEmotionRecordId();
  };

  const emotionConfig = useMemo(() => emotion ? getEmotionConfig(emotion) : null, [emotion]);

  const emotionBarData = useMemo(() => {
    if (!emotionScores) return [];
    return EMOTION_KEYS.map(key => ({
      key,
      config: getEmotionConfig(key),
      value: Math.round((emotionScores[key] || 0) * 100),
    })).sort((a, b) => b.value - a.value);
  }, [emotionScores]);

  if (!currentUser) {
    return (
      <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100%' }}>
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <Title level={3}>{t('emotion.needLogin')}</Title>
        </Card>
      </div>
    );
  }

  if (showPrivacy && !privacyAgreed) {
    return (
      <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100%' }}>
        <Title level={2} style={{ marginBottom: 24 }}>{t('emotion.title')}</Title>
        <Paragraph style={{ color: '#999', fontSize: 14, marginBottom: 24 }}>
          {t('emotion.subtitle')}
        </Paragraph>
        <Card style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
          <Title level={4}>{t('emotion.privacyTitle')}</Title>
          <Paragraph style={{ color: '#666', lineHeight: 1.8, marginBottom: 24 }}>
            {t('emotion.privacyContent')}
          </Paragraph>
          <Button type="primary" size="large" onClick={() => { setPrivacyAgreed(true); setShowPrivacy(false); }}>
            {t('emotion.privacyAgree')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100%' }}>
      <Title level={2} style={{ marginBottom: 24 }}>{t('emotion.title')}</Title>
      <Paragraph style={{ color: '#999', fontSize: 14, marginBottom: 24 }}>
        {t('emotion.subtitle')}
      </Paragraph>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <Card style={{ borderRadius: 8 }}>
          <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden', aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              muted
              playsInline
            />
            {!isDetecting && !isLoading && !analysisComplete && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)', flexDirection: 'column', gap: 16
              }}>
                <CameraOutlined style={{ fontSize: 48, color: '#fff' }} />
                <Text style={{ color: '#fff', fontSize: 16 }}>
                  {isModelLoaded ? t('emotion.startDetection') : t('emotion.loadingModel')}
                </Text>
              </div>
            )}
            {isLoading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)', flexDirection: 'column', gap: 16
              }}>
                <Spin size="large" />
                <Text style={{ color: '#fff' }}>{t('emotion.loadingModel')}</Text>
              </div>
            )}
            {isDetecting && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.7)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Spin size="small" />
                  <Text style={{ color: '#fff', fontSize: 13 }}>{t('emotion.analyzing')}</Text>
                </div>
                <Progress
                  percent={analysisProgress}
                  showInfo={false}
                  strokeColor="#52c41a"
                  trailColor="rgba(255,255,255,0.2)"
                  size="small"
                />
              </div>
            )}
            {analysisComplete && emotionConfig && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)', flexDirection: 'column', gap: 8
              }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Text style={{ color: '#fff', fontSize: 18 }}>{t('emotion.analysisComplete')}</Text>
                <div style={{ fontSize: 40 }}>{emotionConfig.emoji}</div>
                <Text style={{ color: emotionConfig.color, fontSize: 16, fontWeight: 600 }}>
                  {t(emotionConfig.labelKey)}
                </Text>
              </div>
            )}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
            {!isDetecting && !analysisComplete && (
              <Button
                type="primary"
                size="large"
                icon={<CameraOutlined />}
                onClick={handleStartDetection}
                disabled={!isModelLoaded || isLoading}
                loading={isLoading}
              >
                {t('emotion.startDetection')}
              </Button>
            )}
            {isDetecting && (
              <Button
                danger
                size="large"
                icon={<StopOutlined />}
                onClick={stopDetection}
              >
                {t('emotion.stopDetection')}
              </Button>
            )}
            {analysisComplete && (
              <Button
                type="primary"
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                {t('emotion.reAnalyze')}
              </Button>
            )}
          </div>
          {error && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Tag color="red">{t(error)}</Tag>
            </div>
          )}
        </Card>

        <Card style={{ borderRadius: 8 }}>
          <Title level={4} style={{ marginBottom: 24 }}>{t('emotion.emotionScores')}</Title>

          {emotionConfig && analysisComplete && (
            <div style={{
              textAlign: 'center', padding: '20px 0', marginBottom: 24,
              background: `linear-gradient(135deg, ${emotionConfig.color}22, ${emotionConfig.color}11)`,
              borderRadius: 12
            }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>{emotionConfig.emoji}</div>
              <Title level={3} style={{ color: emotionConfig.color, margin: 0 }}>
                {t(emotionConfig.labelKey)}
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>{t('emotion.currentEmotion')}</Text>
              {emotionRecorded && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="green" icon={<CheckCircleOutlined />}>{t('emotion.recorded')}</Tag>
                </div>
              )}
            </div>
          )}

          {!emotion && isDetecting && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
              <div style={{ marginTop: 12 }}><Text type="secondary">{t('emotion.detecting')}</Text></div>
            </div>
          )}

          {!emotion && !isDetecting && !analysisComplete && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎥</div>
              <Text type="secondary">{t('emotion.noFaceDetected')}</Text>
            </div>
          )}

          {emotionBarData.length > 0 && (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {emotionBarData.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{item.config.emoji}</span>
                  <Text style={{ width: 60, fontSize: 13 }}>{t(item.config.labelKey)}</Text>
                  <Progress
                    percent={item.value}
                    showInfo={false}
                    strokeColor={item.config.color}
                    style={{ flex: 1, marginBottom: 0 }}
                    size="small"
                  />
                  <Text style={{ width: 40, textAlign: 'right', fontSize: 13, color: item.config.color }}>
                    {item.value}%
                  </Text>
                </div>
              ))}
            </Space>
          )}
        </Card>
      </div>

      {analysisComplete && emotion && (
        <Card style={{ borderRadius: 8 }}>
          <Title level={4} style={{ marginBottom: 8 }}>
            {t('emotion.recommendedBooks')}
          </Title>
          <Paragraph style={{ color: '#999', marginBottom: 20 }}>
            {t('emotion.basedOnEmotion', { emotion: t(emotionConfig?.labelKey || 'emotion.neutral') })}
          </Paragraph>
          {loadingRecommend ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Spin size="large" />
            </div>
          ) : recommendedBooks.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {recommendedBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <Paragraph type="secondary" style={{ textAlign: 'center', padding: 24 }}>
              {t('emotion.noRecommend')}
            </Paragraph>
          )}
        </Card>
      )}
    </div>
  );
}
