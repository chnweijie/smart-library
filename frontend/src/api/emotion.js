import request from './request';

export function recordEmotion(data) {
  return request.post('/emotion/record', data);
}

export function updateEmotionBookId(recordId, bookId) {
  return request.put(`/emotion/record/${recordId}/book`, null, { params: { bookId } });
}

export function getEmotionHistory(params) {
  return request.get('/emotion/history', { params });
}

export function getEmotionRecommend(emotion) {
  return request.get('/emotion/recommend', { params: { emotion } });
}
