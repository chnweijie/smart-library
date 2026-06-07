import request from './request';

export function getAnnouncements(params) {
  return request.get('/announcements', { params });
}

export function createAnnouncement(data) {
  return request.post('/announcements', data);
}

export function deleteAnnouncement(id) {
  return request.delete(`/announcements/${id}`);
}
