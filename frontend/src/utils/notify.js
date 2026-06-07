import { message } from 'antd';

export function notifyError(err, fallback = '操作失败') {
  const text = err?.message || (typeof err === 'string' ? err : fallback);
  message.error(text);
}

export function notifySuccess(text) {
  message.success(text);
}
