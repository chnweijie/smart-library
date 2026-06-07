import request from './request';

export function createReview(data) {
  return request.post('/reviews', data);
}

export function updateReview(id, data) {
  return request.put(`/reviews/${id}`, data);
}

export function deleteReview(id) {
  return request.delete(`/reviews/${id}`);
}

export function getBookReviews(bookId, params) {
  return request.get(`/reviews/book/${bookId}`, { params });
}

export function voteReview(id) {
  return request.post(`/reviews/${id}/vote`);
}

export function replyReview(id, content, replyToUserId) {
  return request.post(`/reviews/${id}/reply`, { content, replyToUserId });
}

export function getPendingReviews(params) {
  return request.get('/reviews/pending', { params });
}

export function approveReview(id) {
  return request.put(`/reviews/${id}/approve`);
}

export function rejectReview(id) {
  return request.put(`/reviews/${id}/reject`);
}
