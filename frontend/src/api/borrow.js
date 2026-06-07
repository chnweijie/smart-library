import request from './request';

export function borrowBook(bookId) {
  return request.post('/borrows', { bookId });
}

export function applyReturn(id) {
  return request.put(`/borrows/${id}/return`);
}

export function cancelReturn(id) {
  return request.put(`/borrows/${id}/cancel-return`);
}

export function getCurrentBorrows(params) {
  return request.get('/borrows/current', { params });
}

export function getBorrowHistory(params) {
  return request.get('/borrows/history', { params });
}

export function getPendingReturns(params) {
  return request.get('/borrows/pending', { params });
}

export function approveReturn(id) {
  return request.put(`/borrows/${id}/approve`);
}

export function rejectReturn(id, reason) {
  return request.put(`/borrows/${id}/reject`, { reason });
}
