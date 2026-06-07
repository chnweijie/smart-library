import { notifyError, notifySuccess } from '../../utils/notify';

vi.mock('antd', () => ({
  message: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { message } from 'antd';

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notifyError', () => {
    it('传入 Error 对象时使用 error.message', () => {
      const err = new Error('网络错误');
      notifyError(err);
      expect(message.error).toHaveBeenCalledWith('网络错误');
    });

    it('传入字符串时直接使用该字符串', () => {
      notifyError('自定义错误');
      expect(message.error).toHaveBeenCalledWith('自定义错误');
    });

    it('传入 null 时使用默认 fallback', () => {
      notifyError(null);
      expect(message.error).toHaveBeenCalledWith('操作失败');
    });

    it('传入 undefined 时使用默认 fallback', () => {
      notifyError(undefined);
      expect(message.error).toHaveBeenCalledWith('操作失败');
    });

    it('传入数字时使用默认 fallback', () => {
      notifyError(404);
      expect(message.error).toHaveBeenCalledWith('操作失败');
    });

    it('传入自定义 fallback', () => {
      notifyError(null, '上传失败');
      expect(message.error).toHaveBeenCalledWith('上传失败');
    });

    it('Error 对象优先于 fallback', () => {
      const err = new Error('具体错误');
      notifyError(err, '默认失败');
      expect(message.error).toHaveBeenCalledWith('具体错误');
    });

    it('空字符串 Error message 使用 fallback', () => {
      const err = new Error('');
      notifyError(err, '兜底消息');
      // err?.message 为 '' 是 falsy，走到 typeof err === 'string' 为 false，最终用 fallback
      expect(message.error).toHaveBeenCalledWith('兜底消息');
    });
  });

  describe('notifySuccess', () => {
    it('调用 message.success 显示成功消息', () => {
      notifySuccess('操作成功');
      expect(message.success).toHaveBeenCalledWith('操作成功');
    });

    it('传入空字符串也能正常调用', () => {
      notifySuccess('');
      expect(message.success).toHaveBeenCalledWith('');
    });
  });
});
