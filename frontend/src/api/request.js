import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onTokenRefreshFailed() {
  refreshSubscribers = [];
}

function handleAuthExpired() {
  clearAuth();
  window.dispatchEvent(new CustomEvent('auth:expired'));
}

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code && res.code !== 200) {
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401 && !originalRequest._retry) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          handleAuthExpired();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(request(originalRequest));
              } else {
                reject(error);
              }
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const body = res.data;
          const newToken = body?.data?.token ?? body?.token;
          if (!newToken) {
            throw new Error('刷新令牌响应无效');
          }
          localStorage.setItem('token', newToken);
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return request(originalRequest);
        } catch {
          onTokenRefreshFailed();
          handleAuthExpired();
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      if (status === 403) {
        const msg = data?.message || '没有访问权限';
        return Promise.reject(new Error(msg));
      }

      const message = data?.message || `请求失败 (${status})`;
      return Promise.reject(new Error(message));
    }

    return Promise.reject(new Error('网络连接失败，请检查网络'));
  }
);

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');
}

export default request;
export { clearAuth };
