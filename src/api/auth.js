// ─────────────────────────────────────────────────────────────────────────
// Local admin authentication — replaces `base44.auth.*`.
//
// The app is now public-by-default: any visitor can browse books/videos
// without an account. Only the /admin, /settings and /dev areas require a
// single local administrator login (JWT issued by our own backend).
// ─────────────────────────────────────────────────────────────────────────
import { api } from './apiClient';
import { getToken, setToken } from './apiClient';

export const Auth = {
  // Returns the logged-in admin, or throws if not authenticated.
  me: () => api.get('/auth/me'),

  login: async (username, password) => {
    const { token, user } = await api.post('/auth/login', { username, password });
    setToken(token);
    return user;
  },

  logout: () => {
    setToken(null);
  },

  updateMe: (data) => api.put('/auth/me', data),

  isLoggedIn: () => Boolean(getToken()),
};
