import request from './request';

export function login(username, password) {
  return request.post('/auth/login', { username, password });
}

export function register(data) {
  return request.post('/auth/register', data);
}

export function faceLogin(faceFeature, faceFeatures) {
  const normalize = (v) => Array.isArray(v) ? v : (typeof v === 'string' ? JSON.parse(v) : v);
  const payload = { faceFeature: normalize(faceFeature) };
  if (faceFeatures && faceFeatures.length >= 2) {
    payload.faceFeatures = faceFeatures.map(normalize);
  }
  return request.post('/auth/face-login', payload);
}

export function refreshToken(refreshToken) {
  return request.post('/auth/refresh', { refreshToken });
}
