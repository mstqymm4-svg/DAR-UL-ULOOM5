// ─────────────────────────────────────────────────────────────────────────
// Local data-entity clients — replaces `base44.entities.*`.
// Same method shapes as before (list/filter/create/update/delete) so the
// rest of the app needed only its imports swapped, not its logic rewritten.
// ─────────────────────────────────────────────────────────────────────────
import { api } from './apiClient';

function buildQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.set(k, v);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

function makeEntityClient(resourcePath) {
  return {
    // list('-created_date', 1000)
    list: (sort, limit) => api.get(`${resourcePath}${buildQuery({ sort, limit })}`),
    // filter({ setting_key: 'x' }, sort, limit)
    filter: (query = {}, sort, limit) => api.get(`${resourcePath}${buildQuery({ ...query, sort, limit })}`),
    get: (id) => api.get(`${resourcePath}/${id}`),
    create: (data) => api.post(resourcePath, data),
    update: (id, data) => api.put(`${resourcePath}/${id}`, data),
    delete: (id) => api.del(`${resourcePath}/${id}`),
  };
}

export const Entities = {
  Book: makeEntityClient('/books'),
  Video: makeEntityClient('/videos'),
  VideoChannel: makeEntityClient('/video-channels'),
  SocialChannel: makeEntityClient('/social-channels'),
  AppSettings: makeEntityClient('/settings'),
  Category: makeEntityClient('/categories'),
  ContactMessage: makeEntityClient('/contact'),
};
