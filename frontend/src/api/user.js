import request from './request';

export function getUserProfile() {
  return request.get('/users/me');
}

export function updateUserProfile(data) {
  return request.put('/users/me', data);
}

export function changePassword(oldPassword, newPassword) {
  return request.put('/users/me/password', { oldPassword, newPassword });
}

export function registerFace(faceFeature) {
  const value = Array.isArray(faceFeature)
    ? faceFeature
    : (typeof faceFeature === 'string' ? JSON.parse(faceFeature) : faceFeature);
  return request.post('/users/me/face', { faceFeature: value });
}

export function unregisterFace() {
  return request.delete('/users/me/face');
}

export function getUserStats() {
  return request.get('/users/me/stats');
}

export function getAllUsers(params) {
  return request.get('/users', { params });
}

export function toggleUserStatus(id) {
  return request.put(`/users/${id}/status`);
}

export function createUser(data) {
  return request.post('/users', data);
}

export function updateUser(id, data) {
  return request.put(`/users/${id}`, data);
}

export function deleteUser(id) {
  return request.delete(`/users/${id}`);
}
