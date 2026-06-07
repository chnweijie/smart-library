import axios from 'axios';
import { clearAuth } from '../../api/request';

const { requestInterceptors, responseInterceptors } = vi.hoisted(() => ({
  requestInterceptors: { fulfilled: [], rejected: [] },
  responseInterceptors: { fulfilled: [], rejected: [] },
}));

vi.mock('axios', () => {
  const mockInstance = {
    interceptors: {
      request: {
        use: (fulfilled, rejected) => {
          requestInterceptors.fulfilled.push(fulfilled);
          requestInterceptors.rejected.push(rejected);
        },
      },
      response: {
        use: (fulfilled, rejected) => {
          responseInterceptors.fulfilled.push(fulfilled);
          responseInterceptors.rejected.push(rejected);
        },
      },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockInstance),
      post: vi.fn(),
    },
    create: vi.fn(() => mockInstance),
  };
});

describe('request', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('axios 实例配置', () => {
    it('使用正确的 baseURL 和 timeout 创建实例', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: '/api',
          timeout: 15000,
        })
      );
    });
  });

  describe('请求拦截器', () => {
    it('localStorage 有 token 时添加 Authorization 头', () => {
      localStorage.setItem('token', 'test-token-123');
      const config = { headers: {} };
      const interceptor = requestInterceptors.fulfilled[0];
      const result = interceptor(config);
      expect(result.headers.Authorization).toBe('Bearer test-token-123');
    });

    it('localStorage 无 token 时不添加 Authorization 头', () => {
      const config = { headers: {} };
      const interceptor = requestInterceptors.fulfilled[0];
      const result = interceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('请求拦截器错误时拒绝 Promise', async () => {
      const interceptor = requestInterceptors.rejected[0];
      await expect(interceptor(new Error('fail'))).rejects.toThrow('fail');
    });
  });

  describe('响应拦截器', () => {
    it('code 为 200 时正常返回数据', () => {
      const interceptor = responseInterceptors.fulfilled[0];
      const response = { data: { code: 200, data: 'ok' } };
      const result = interceptor(response);
      expect(result).toEqual({ code: 200, data: 'ok' });
    });

    it('data 无 code 字段时正常返回', () => {
      const interceptor = responseInterceptors.fulfilled[0];
      const response = { data: { data: 'ok' } };
      const result = interceptor(response);
      expect(result).toEqual({ data: 'ok' });
    });

    it('code 不为 200 时拒绝并返回错误消息', async () => {
      const interceptor = responseInterceptors.fulfilled[0];
      const response = { data: { code: 500, message: '服务器错误' } };
      await expect(interceptor(response)).rejects.toThrow('服务器错误');
    });

    it('code 不为 200 且无 message 时使用默认消息', async () => {
      const interceptor = responseInterceptors.fulfilled[0];
      const response = { data: { code: 400 } };
      await expect(interceptor(response)).rejects.toThrow('请求失败');
    });

    it('401 且无 refreshToken 时清除认证并派发 auth:expired 事件', async () => {
      const interceptor = responseInterceptors.rejected[0];
      const error = {
        config: { _retry: false },
        response: { status: 401, data: {} },
      };
      const eventHandler = vi.fn();
      window.addEventListener('auth:expired', eventHandler);
      await expect(interceptor(error)).rejects.toBe(error);
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(eventHandler).toHaveBeenCalledTimes(1);
      window.removeEventListener('auth:expired', eventHandler);
    });

    it('403 时返回权限错误', async () => {
      const interceptor = responseInterceptors.rejected[0];
      const error = {
        config: {},
        response: { status: 403, data: { message: '禁止访问' } },
      };
      await expect(interceptor(error)).rejects.toThrow('禁止访问');
    });

    it('403 无自定义消息时使用默认消息', async () => {
      const interceptor = responseInterceptors.rejected[0];
      const error = {
        config: {},
        response: { status: 403, data: {} },
      };
      await expect(interceptor(error)).rejects.toThrow('没有访问权限');
    });

    it('其他 HTTP 错误状态码返回对应消息', async () => {
      const interceptor = responseInterceptors.rejected[0];
      const error = {
        config: {},
        response: { status: 404, data: { message: '资源不存在' } },
      };
      await expect(interceptor(error)).rejects.toThrow('资源不存在');
    });

    it('其他 HTTP 错误状态码无消息时使用默认格式', async () => {
      const interceptor = responseInterceptors.rejected[0];
      const error = {
        config: {},
        response: { status: 500, data: {} },
      };
      await expect(interceptor(error)).rejects.toThrow('请求失败 (500)');
    });

    it('网络错误（无 response）返回网络失败消息', async () => {
      const interceptor = responseInterceptors.rejected[0];
      const error = { config: {} };
      await expect(interceptor(error)).rejects.toThrow('网络连接失败，请检查网络');
    });
  });

  describe('clearAuth', () => {
    it('清除 localStorage 中的 token、refreshToken、currentUser', () => {
      localStorage.setItem('token', 'abc');
      localStorage.setItem('refreshToken', 'def');
      localStorage.setItem('currentUser', '{"id":1}');
      clearAuth();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });

    it('localStorage 中无对应项时不报错', () => {
      expect(() => clearAuth()).not.toThrow();
    });
  });
});
