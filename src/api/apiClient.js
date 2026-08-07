// ─────────────────────────────────────────────────────────────────────────
// Local API client — full replacement for the old @base44/sdk.
// Talks to the Express/SQLite backend in /server. No external service,
// no API keys, no cloud dependency of any kind.
// ─────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'dau_admin_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    /* ignore */
  }
}

class ApiError extends Error {
  constructor(status, data) {
    super(data?.message || `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (!isForm) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers: finalHeaders,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
};

export { ApiError };
