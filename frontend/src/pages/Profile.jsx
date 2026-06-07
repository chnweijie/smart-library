import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Tag, Space, Tabs, Descriptions, List, Modal, Form, Input, message, Spin, Switch } from 'antd';
import { CameraOutlined, ScanOutlined, DeleteOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useStore, useAuthStore } from '../store/useStore';
import { normalizeRole, formatDateTime } from '../utils/userDisplay';
import * as userApi from '../api/user';
import useFaceRecognition from '../hooks/useFaceRecognition';
import BookCard from '../components/BookCard';
import ImageUpload from '../components/ImageUpload';

const { Title, Text, Paragraph } = Typography;

export default function Profile() {
  const { t } = useTranslation();
  const {
    currentUser,
    borrows,
    favorites,
    favoriteBooks,
    reservations,
    books,
    registerFace,
    unregisterFace,
    changePassword,
    updateUserProfile,
  } = useStore();

  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const { notifSettings, updateNotifSetting } = useStore();

  const {
    videoRef,
    isModelLoaded,
    isScanning,
    error: faceError,
    isLoading: modelLoading,
    loadModels,
    registerFace: captureFaceDescriptor,
    startCamera,
    stopCamera,
  } = useFaceRecognition();

  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const profileRes = await userApi.getUserProfile();
        setUserProfile(profileRes.data);
        if (profileRes.data?.avatarUrl) {
          setAvatarUrl(profileRes.data.avatarUrl);
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const hasFaceRegistered = !!userProfile?.faceRegistered;

  useEffect(() => {
    if (isFaceModalOpen) {
      loadModels();
    }
    if (!isFaceModalOpen) {
      stopCamera();
    }
    return () => stopCamera();
  }, [isFaceModalOpen, loadModels, stopCamera]);

  useEffect(() => {
    if (isModelLoaded && isFaceModalOpen) {
      startCamera();
    }
  }, [isModelLoaded, isFaceModalOpen, startCamera]);

  const handleRegisterFace = async () => {
    setIsRegistering(true);
    try {
      const descriptor = await captureFaceDescriptor(3);
      if (descriptor) {
        await registerFace(currentUser.id, descriptor);
        message.success(t('profile.faceRegisterSuccess'));
        stopCamera();
        setIsFaceModalOpen(false);
        const profileRes = await userApi.getUserProfile();
        setUserProfile(profileRes.data);
      } else {
        message.error(t('profile.faceRegisterFailed'));
      }
    } catch {
      message.error(t('profile.faceRegisterFailed'));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregisterFace = () => {
    Modal.confirm({
      title: t('profile.faceRemoveConfirm'),
      content: t('profile.faceRemoveDesc'),
      okType: 'danger',
      onOk: async () => {
        try {
          await unregisterFace(currentUser.id);
          message.success(t('profile.faceRemoveSuccess'));
          const profileRes = await userApi.getUserProfile();
          setUserProfile(profileRes.data);
        } catch (e) {
          message.error(e.message || t('common.error'));
        }
      },
    });
  };

  const roleKey = normalizeRole(userProfile?.role ?? currentUser?.role);
  const displayProfile = userProfile || {
    username: currentUser?.username || 'user',
    nickname: currentUser?.username || 'user',
    email: '',
    joinDate: '',
  };

  const tabItems = [
    { key: 'info', label: t('profile.basicInfo') },
    { key: 'settings', label: t('profile.accountSettings') },
  ];

  const favoriteBooksList = favoriteBooks.length > 0 ? favoriteBooks : favorites.map(id => books.find(b => b.id === id)).filter(Boolean);

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100%' }}>
      <Title level={2} style={{ marginBottom: 24 }}>{t('nav.profile')}</Title>

      <Spin spinning={profileLoading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ImageUpload
              mode="avatar"
              imageUrl={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username}`}
              onUploadSuccess={(url) => {
                setAvatarUrl(url);
                const user = useAuthStore.getState().currentUser;
                if (user) {
                  const updatedUser = { ...user, avatarUrl: url };
                  localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                  useAuthStore.setState({ currentUser: updatedUser });
                }
              }}
            />
            <div style={{ flex: 1 }}>
              <Title level={3} style={{ marginBottom: 8 }}>{displayProfile.nickname}</Title>
              <Text type="secondary">@{displayProfile.username}</Text>
              <div style={{ marginTop: 12 }}>
                <Tag color="blue">{t(`common.role.${roleKey}`)}</Tag>
                <Tag color="green">{t('profile.accountNormal')}</Tag>
                {hasFaceRegistered && <Tag color="purple">{t('profile.faceRegistered')}</Tag>}
              </div>
            </div>
            <Space>
              <Button type="primary" onClick={() => {
                editForm.setFieldsValue({
                  nickname: displayProfile.nickname || '',
                  email: displayProfile.email || '',
                  phone: displayProfile.phone || '',
                });
                setIsEditModalOpen(true);
              }}>{t('profile.editProfile')}</Button>
            </Space>
          </div>
        </Card>

        <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Tabs defaultActiveKey="info" items={tabItems.map(item => ({
            ...item,
            children: item.key === 'info' ? (
              <Descriptions column={2}>
                <Descriptions.Item label={t('profile.username')}>{displayProfile.username}</Descriptions.Item>
                <Descriptions.Item label={t('profile.nickname')}>{displayProfile.nickname}</Descriptions.Item>
                <Descriptions.Item label={t('profile.email')}>{displayProfile.email || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('profile.phone')}>{displayProfile.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('profile.role')}>{t(`common.role.${roleKey}`)}</Descriptions.Item>
                <Descriptions.Item label={t('profile.joinDate')}>{formatDateTime(displayProfile.createdAt || displayProfile.joinDate) || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('profile.accountStatus')}>
                  <Tag color="green">{t('profile.accountNormal')}</Tag>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card size="small" title={t('profile.securitySettings')} extra={
                  <Button type="link" onClick={() => setIsPasswordModalOpen(true)}>
                    {t('profile.changePassword')}
                  </Button>
                }>
                  <List>
                    <List.Item>
                      <Text strong>{t('profile.password')}</Text>
                      <Text type="secondary" style={{ marginLeft: 'auto' }}>••••••••</Text>
                    </List.Item>
                    <List.Item>
                      <Text strong>{t('profile.loginDevice')}</Text>
                      <Text type="secondary" style={{ marginLeft: 'auto' }}>{t('profile.currentDevice')}</Text>
                    </List.Item>
                  </List>
                </Card>

                <Card size="small" title={t('profile.faceRecognition')}>
                  <List>
                    <List.Item
                      actions={[
                        hasFaceRegistered ? (
                          <Button danger icon={<DeleteOutlined />} onClick={handleUnregisterFace} size="small">
                            {t('profile.removeFace')}
                          </Button>
                        ) : (
                          <Button type="primary" icon={<CameraOutlined />} onClick={() => setIsFaceModalOpen(true)} size="small">
                            {t('profile.registerFace')}
                          </Button>
                        )
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<SafetyCertificateOutlined style={{ fontSize: 24, color: hasFaceRegistered ? '#52c41a' : '#d9d9d9' }} />}
                        title={t('profile.faceLogin')}
                        description={hasFaceRegistered ? t('profile.faceRegisteredDesc') : t('profile.faceNotRegisteredDesc')}
                      />
                    </List.Item>
                  </List>
                </Card>

                <Card size="small" title={t('profile.notificationSettings')}>
                  <List>
                    <List.Item>
                      <Text>{t('profile.borrowDueReminder')}</Text>
                      <Switch checked={notifSettings.borrowDueReminder} onChange={checked => updateNotifSetting('borrowDueReminder', checked)} />
                    </List.Item>
                    <List.Item>
                      <Text>{t('profile.reservationArrivalReminder')}</Text>
                      <Switch checked={notifSettings.reservationArrivalReminder} onChange={checked => updateNotifSetting('reservationArrivalReminder', checked)} />
                    </List.Item>
                    <List.Item>
                      <Text>{t('profile.systemAnnouncements')}</Text>
                      <Switch checked={notifSettings.systemAnnouncements} onChange={checked => updateNotifSetting('systemAnnouncements', checked)} />
                    </List.Item>
                  </List>
                </Card>
              </Space>
            )
          }))} />
        </Card>

        <Card title={t('profile.myFavorites')} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {favoriteBooksList.length > 0 ? (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {favoriteBooksList.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
              <Text type="secondary">{t('profile.noFavorites')}</Text>
            </div>
          )}
        </Card>
      </Space>
      </Spin>

      <Modal
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        centered
      >
        <Form form={editForm} size="large">
          <Form.Item name="nickname" label={t('profile.nickname')} rules={[{ required: true, message: t('profile.nicknameRequired') }]}>
            <Input placeholder={t('profile.nickname')} />
          </Form.Item>
          <Form.Item name="email" label={t('profile.email')} rules={[{ type: 'email', message: t('auth.invalidEmail') }]}>
            <Input placeholder={t('profile.email')} />
          </Form.Item>
          <Form.Item name="phone" label={t('profile.phone')}>
            <Input placeholder={t('profile.phone')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" block size="large" loading={editLoading} onClick={async () => {
              try {
                const values = await editForm.validateFields();
                setEditLoading(true);
                await updateUserProfile(values);
                message.success(t('admin.updateSuccess'));
                setIsEditModalOpen(false);
                const profileRes = await userApi.getUserProfile();
                setUserProfile(profileRes.data);
              } catch (e) {
                if (e.message) message.error(e.message);
              } finally {
                setEditLoading(false);
              }
            }}>
              {t('profile.confirmChange')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        footer={null}
        centered
      >
        <Form form={form} size="large">
          <Form.Item name="oldPassword" rules={[{ required: true, message: t('profile.enterOldPassword') }]}>
            <Input.Password placeholder={t('profile.oldPassword')} />
          </Form.Item>
          <Form.Item name="newPassword" rules={[{ required: true, message: t('profile.enterNewPassword') }]}>
            <Input.Password placeholder={t('profile.newPassword')} />
          </Form.Item>
          <Form.Item name="confirmPassword" dependencies={['newPassword']} rules={[
            { required: true, message: t('profile.confirmNewPassword') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('profile.passwordMismatch')));
              },
            }),
          ]}>
            <Input.Password placeholder={t('profile.confirmNewPassword')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" block size="large" loading={passwordLoading} onClick={async () => {
              try {
                const values = await form.validateFields();
                if (values.newPassword !== values.confirmPassword) {
                  message.error(t('profile.passwordMismatch'));
                  return;
                }
                setPasswordLoading(true);
                await changePassword(values.oldPassword, values.newPassword);
                message.success(t('profile.passwordChanged'));
                form.resetFields();
                setIsPasswordModalOpen(false);
              } catch (e) {
                if (e.message) {
                  message.error(e.message);
                }
              } finally {
                setPasswordLoading(false);
              }
            }}>
              {t('profile.confirmChange')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('profile.registerFace')}
        open={isFaceModalOpen}
        onCancel={() => { stopCamera(); setIsFaceModalOpen(false); }}
        footer={null}
        centered
        width={480}
      >
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
                  {isModelLoaded ? t('profile.readyToScan') : t('emotion.loadingModel')}
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
          </div>
          {faceError && <Tag color="red" style={{ marginBottom: 12 }}>{t(faceError)}</Tag>}
          <Paragraph style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
            {t('profile.faceRegisterTip')}
          </Paragraph>
          <Button
            type="primary"
            block
            size="large"
            icon={<ScanOutlined />}
            onClick={handleRegisterFace}
            disabled={!isScanning || isRegistering}
            loading={isRegistering}
          >
            {isRegistering ? t('profile.registering') : t('profile.startRegister')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
