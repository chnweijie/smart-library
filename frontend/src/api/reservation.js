import request from './request';

export function reserveBook(bookId) {
  return request.post('/reservations', { bookId });
}

export function cancelReservation(id) {
  return request.delete(`/reservations/${id}`);
}

export function getReservations(params) {
  return request.get('/reservations', { params });
}
