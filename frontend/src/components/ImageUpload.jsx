import React, { useState, useRef, useCallback } from 'react';
import { Upload, Progress, message, Image, Modal } from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { uploadAvatar, chunkUpload, validateImageFile, updateAvatarUrl, MAX_SIZE, ALLOWED_EXTENSIONS } from '../api/upload';

/**
 * 图片上传组件
 * 支持功能：文件选择、格式验证、大小限制、进度显示、预览、断点续传
 *
 * @param {Object} props
 * @param {string} props.mode - 上传模式: 'avatar' | 'general'
 * @param {string} props.imageUrl - 当前图片URL
 * @param {Function} props.onUploadSuccess - 上传成功回调 (url: string) => void
 * @param {number} props.maxSize - 最大文件大小（字节），默认5MB
 * @param {string[]} props.accept - 接受的文件类型
 */
export default function ImageUpload({
  mode = 'general',
  imageUrl,
  onUploadSuccess,
  maxSize = MAX_SIZE,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const fileInputRef = useRef(null);

  const isAvatar = mode === 'avatar';

  // 处理文件选择
  const handleFileSelect = useCallback(async (file) => {
    setUploadError(null);
    setProgress(0);

    // 前端校验
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.message);
      message.error(validation.message);
      return false;
    }

    // 生成预览
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    setCurrentFile(file);
    setUploading(true);

    try {
      let url;
      if (isAvatar) {
        // 头像直接上传
        url = await uploadAvatar(file, (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        });
        url = url.data?.url;
        // 更新用户头像URL
        if (url) {
          await updateAvatarUrl(url);
        }
      } else {
        // 通用图片使用分片上传（断点续传）
        const generatedFileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.size}`;
        setFileId(generatedFileId);
        url = await chunkUpload(file, (percent) => {
          setProgress(percent);
        }, generatedFileId);
      }

      if (url) {
        message.success(t('upload.success'));
        setProgress(100);
        onUploadSuccess?.(url);
      }
    } catch (e) {
      const errorMsg = e.message || t('upload.failed');
      setUploadError(errorMsg);
      message.error(errorMsg);
    } finally {
      setUploading(false);
    }

    return false; // 阻止antd默认上传行为
  }, [isAvatar, onUploadSuccess, t]);

  // 断点续传：重试上传
  const handleRetry = useCallback(() => {
    if (currentFile && fileId) {
      setUploading(true);
      setUploadError(null);
      chunkUpload(currentFile, (percent) => {
        setProgress(percent);
      }, fileId)
        .then((url) => {
          if (url) {
            message.success(t('upload.success'));
            setProgress(100);
            onUploadSuccess?.(url);
          }
        })
        .catch((e) => {
          const errorMsg = e.message || t('upload.failed');
          setUploadError(errorMsg);
          message.error(errorMsg);
        })
        .finally(() => setUploading(false));
    } else if (currentFile) {
      handleFileSelect(currentFile);
    }
  }, [currentFile, fileId, onUploadSuccess, handleFileSelect, t]);

  // 删除已选文件
  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    setCurrentFile(null);
    setFileId(null);
    setProgress(0);
    setUploadError(null);
  }, []);

  // 头像模式渲染
  if (isAvatar) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Upload
          accept={accept}
          showUploadList={false}
          beforeUpload={handleFileSelect}
          disabled={uploading}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              border: '2px solid #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5',
            }}
          >
            {previewUrl || imageUrl ? (
              <img
                src={previewUrl || imageUrl}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
            )}
            {uploading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
              >
                <Progress
                  type="circle"
                  percent={progress}
                  size={50}
                  strokeColor="#fff"
                  trailColor="rgba(255,255,255,0.2)"
                />
              </div>
            )}
          </div>
        </Upload>
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#1677ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px solid #fff',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadOutlined style={{ color: '#fff', fontSize: 10 }} />
        </div>
        {uploadError && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
            <RedoOutlined onClick={handleRetry} style={{ cursor: 'pointer', marginRight: 4 }} />
            {t('upload.retry')}
          </div>
        )}
      </div>
    );
  }

  // 通用模式渲染
  return (
    <div>
      {previewUrl || imageUrl ? (
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            padding: 4,
          }}
        >
          <Image
            src={previewUrl || imageUrl}
            alt="preview"
            style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }}
            preview={false}
          />
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 4,
            }}
          >
            <EyeOutlined
              onClick={() => setPreviewVisible(true)}
              style={{
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                padding: 4,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            />
            <DeleteOutlined
              onClick={handleRemove}
              style={{
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                padding: 4,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            />
          </div>
          {uploading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}
            >
              <Progress percent={progress} style={{ width: '80%' }} />
              <span style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                {t('upload.uploading')}
              </span>
            </div>
          )}
        </div>
      ) : (
        <Upload
          accept={accept}
          showUploadList={false}
          beforeUpload={handleFileSelect}
          disabled={uploading}
        >
          <div
            style={{
              width: 200,
              height: 120,
              border: '1px dashed #d9d9d9',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.3s',
              background: '#fafafa',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1677ff')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d9d9d9')}
          >
            <PlusOutlined style={{ fontSize: 28, color: '#999' }} />
            <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
              {t('upload.selectImage')}
            </div>
            <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
              {t('upload.supportFormats')}: JPG/PNG/GIF/WEBP
            </div>
            <div style={{ color: '#999', fontSize: 11 }}>
              {t('upload.maxSize')}: {maxSize / 1024 / 1024}MB
            </div>
          </div>
        </Upload>
      )}

      {uploadError && (
        <div
          style={{
            color: '#ff4d4f',
            fontSize: 12,
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>{uploadError}</span>
          <RedoOutlined
            onClick={handleRetry}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ cursor: 'pointer' }} onClick={handleRetry}>
            {t('upload.retry')}
          </span>
        </div>
      )}

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
      >
        <img
          src={previewUrl || imageUrl}
          alt="preview"
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  );
}
