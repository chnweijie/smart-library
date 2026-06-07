import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Button, message, Tabs, Spin, Tag, Typography } from 'antd';
import { CameraOutlined, ScanOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import useFaceRecognition from '../hooks/useFaceRecognition';

export default function AuthModal({ open, mode, onCancel }) {
  const { t } = useTranslation();
  const { login, register, faceLogin } = useStore();
  const [form] = Form.useForm();
  const { Text } = Typography;
  const [activeTab, setActiveTab] = useState('password');
  const [isRegisterMode, setIsRegisterMode] = useState(mode === 'register');
  // 追踪用户是否主动选择了人脸识别 tab，防止 stale state 触发摄像头
  const faceTabIntentionalRef = useRef(false);

  useEffect(() => {
    if (open) {
      faceTabIntentionalRef.current = false;
      setIsRegisterMode(mode === 'register');
      setActiveTab('password');
      form.resetFields();
    }
  }, [open, mode, form]);

  const {
    videoRef,
    isModelLoaded,
    isScanning,
    error: faceError,
    isLoading: modelLoading,
    loadModels,
    extractDescriptor,
    matchFace,
    startCamera,
    stopCamera,
  } = useFaceRecognition();

  useEffect(() => {
    if (open && activeTab === 'face' && faceTabIntentionalRef.current) {
      loadModels();
    }
  }, [open, activeTab, loadModels]);

  useEffect(() => {
    let cancelled = false;
    if (isModelLoaded && activeTab === 'face' && open && faceTabIntentionalRef.current) {
      startCamera().then(() => {
        if (cancelled) {
          stopCamera();
        }
      });
    }
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isModelLoaded, activeTab, open, startCamera, stopCamera]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'face') {
      faceTabIntentionalRef.current = true;
    } else {
      faceTabIntentionalRef.current = false;
      stopCamera();
    }
  };

  const handlePasswordSubmit = async (values) => {
    if (isRegisterMode) {
      if (values.password !== values.confirmPassword) {
        message.error(t('auth.passwordMismatch'));
        return;
      }
      const result = await register(values.username, values.password, values.nickname, values.email);
      if (result.success) {
        stopCamera();
        message.success(t(result.messageKey));
        form.resetFields();
        onCancel();
      } else {
        message.error(result.message || t(result.messageKey));
      }
      return;
    }
    const result = await login(values.username, values.password);
    if (result.success) {
      stopCamera();
      message.success(t(result.messageKey));
      form.resetFields();
      onCancel();
    } else {
      message.error(result.message || t(result.messageKey));
    }
  };

  const handleFaceLogin = async () => {
    // 采集3帧独立特征，用于后端多帧一致性验证
    const SAMPLE_COUNT = 3;
    const descriptors = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const d = await extractDescriptor();
      if (d) descriptors.push(d);
      if (i < SAMPLE_COUNT - 1) await new Promise(r => setTimeout(r, 300));
    }
    if (descriptors.length === 0) {
      message.warning(t('auth.faceNotFound'));
      return;
    }
    // 计算平均特征作为主特征，同时发送所有帧用于一致性验证
    const avg = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      avg[i] = descriptors.reduce((sum, d) => sum + d[i], 0) / descriptors.length;
    }
    const result = await faceLogin(Array.from(avg), descriptors);
    if (result.success) {
      message.success(t(result.messageKey));
      stopCamera();
      onCancel();
    } else {
      message.error(result.message || t(result.messageKey));
    }
  };

  const handleCancel = () => {
    stopCamera();
    form.resetFields();
    onCancel();
  };

  const tabItems = [
    {
      key: 'password',
      label: isRegisterMode ? t('auth.register') : t('auth.login'),
      children: (
        <Form onFinish={handlePasswordSubmit} size="large" form={form}>
          <Form.Item name="username" rules={[{ required: true, message: t('auth.username') }]}>
            <Input placeholder={t('auth.username')} />
          </Form.Item>
          {isRegisterMode && (
            <Form.Item name="nickname" rules={[{ required: true, message: t('auth.nickname') }]}>
              <Input placeholder={t('auth.nickname')} />
            </Form.Item>
          )}
          {isRegisterMode && (
            <Form.Item name="email" rules={[{ required: true, message: t('auth.email') }, { type: 'email', message: t('auth.invalidEmail') }]}>
              <Input placeholder={t('auth.email')} />
            </Form.Item>
          )}
          <Form.Item name="password" rules={[{ required: true, message: t('auth.password') }]}>
            <Input.Password placeholder={t('auth.password')} />
          </Form.Item>
          {isRegisterMode && (
            <Form.Item name="confirmPassword" rules={[{ required: true, message: t('auth.confirmPassword') }]}>
              <Input.Password placeholder={t('auth.confirmPassword')} />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" block htmlType="submit">
              {isRegisterMode ? t('auth.register') : t('auth.login')}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    ...(activeTab !== 'register' && !isRegisterMode ? [{
      key: 'face',
      label: t('auth.faceLogin'),
      children: (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            position: 'relative', background: '#000', borderRadius: 8,
            overflow: 'hidden', aspectRatio: '4/3', marginBottom: 16
          }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              muted
              playsInline
            />
            {!isScanning && !modelLoading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)', flexDirection: 'column', gap: 12
              }}>
                <CameraOutlined style={{ fontSize: 36, color: '#fff' }} />
                <span style={{ color: '#fff', fontSize: 14 }}>
                  {isModelLoaded ? t('auth.startFaceScan') : t('emotion.loadingModel')}
                </span>
              </div>
            )}
            {modelLoading && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)', flexDirection: 'column', gap: 12
              }}>
                <Spin size="large" />
                <span style={{ color: '#fff' }}>{t('emotion.loadingModel')}</span>
              </div>
            )}
            {isScanning && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 4
              }}>
                <span style={{ color: '#52c41a', fontSize: 12 }}>
                  <ScanOutlined /> {t('auth.scanning')}
                </span>
              </div>
            )}
          </div>
          {faceError && <Tag color="red" style={{ marginBottom: 12 }}>{t(faceError)}</Tag>}
          <Button
            type="primary"
            block
            size="large"
            icon={<ScanOutlined />}
            onClick={handleFaceLogin}
            disabled={!isScanning}
          >
            {t('auth.startFaceScan')}
          </Button>
          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('auth.testAccounts')}
            </Text>
          </div>
        </div>
      ),
    }] : []),
  ];

  return (
    <Modal
      title={isRegisterMode ? t('auth.register') : t('auth.login')}
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      width={480}
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        centered
      />
      {activeTab === 'password' && (
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 8 }}>
          {t('auth.testAccounts')}
        </div>
      )}
    </Modal>
  );
}
