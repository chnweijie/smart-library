import request from './request';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const CHUNK_SIZE = 1024 * 1024; // 1MB per chunk

/**
 * 上传头像
 */
export function uploadAvatar(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/files/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
}

/**
 * 更新用户头像URL
 */
export function updateAvatarUrl(avatarUrl) {
  return request.put('/users/me/avatar', { avatarUrl });
}

/**
 * 上传分片
 */
export function uploadChunk(file, fileId, chunkIndex, totalChunks) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileId', fileId);
  formData.append('chunkIndex', chunkIndex);
  formData.append('totalChunks', totalChunks);
  formData.append('fileName', file.name || 'image.jpg');
  return request.post('/files/upload/chunk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * 检查已上传的分片
 */
export function checkChunks(fileId) {
  return request.get('/files/upload/chunk-check', { params: { fileId } });
}

/**
 * 合并分片
 */
export function mergeChunks(fileId) {
  return request.post('/files/upload/merge', null, { params: { fileId } });
}

/**
 * 分片上传（断点续传）
 * @param {File} file - 文件对象
 * @param {Function} onProgress - 进度回调 (percent: number)
 * @param {string} fileId - 文件唯一标识（用于断点续传）
 * @returns {Promise<string>} - 文件URL
 */
export async function chunkUpload(file, onProgress, fileId) {
  if (!fileId) {
    fileId = generateFileId(file);
  }

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // 检查已上传的分片
  let uploadedChunks = [];
  try {
    const checkRes = await checkChunks(fileId);
    uploadedChunks = checkRes.data?.uploadedChunks || [];
  } catch {
    // 首次上传，没有已上传分片
  }

  // 逐个上传未完成的分片
  for (let i = 0; i < totalChunks; i++) {
    if (uploadedChunks.includes(i)) {
      // 该分片已上传，跳过
      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalChunks) * 100));
      }
      continue;
    }

    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);

    // 重试机制
    let retries = 3;
    let success = false;
    while (retries > 0 && !success) {
      try {
        await uploadChunk(chunkBlob, fileId, i, totalChunks);
        success = true;
      } catch (e) {
        retries--;
        if (retries === 0) {
          throw new Error(`分片 ${i} 上传失败: ${e.message}`);
        }
        // 等待1秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }
  }

  // 合并分片
  const mergeRes = await mergeChunks(fileId);
  return mergeRes.data?.url;
}

/**
 * 生成文件唯一标识
 */
function generateFileId(file) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}-${file.size}`;
}

/**
 * 校验图片文件
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, message: '请选择文件' };
  }

  // 格式校验
  const extension = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, message: `不支持的图片格式，仅支持 ${ALLOWED_EXTENSIONS.join('、')}` };
  }

  // MIME类型校验（必须存在且在白名单中）
  if (!file.type || !ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, message: '请选择图片文件' };
  }

  // 大小校验
  if (file.size > MAX_SIZE) {
    return { valid: false, message: `图片大小不能超过 ${MAX_SIZE / 1024 / 1024}MB` };
  }

  return { valid: true };
}

export { ALLOWED_EXTENSIONS, MAX_SIZE, CHUNK_SIZE };

export function uploadFile(file, subDir) {
  const formData = new FormData();
  formData.append('file', file);
  if (subDir) {
    formData.append('subDir', subDir);
  }
  return request.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function uploadCover(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/files/upload/cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
