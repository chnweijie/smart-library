import request from './request';

export function toggleFavorite(bookId) {
  return request.post(`/favorites/${bookId}`);
}

export function getFavorites(params) {
  return request.get('/favorites', { params });
}

export function checkFavorite(bookId) {
  return request.get(`/favorites/${bookId}/check`);
}
