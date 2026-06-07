/** 将后端 role（数字 / 枚举名）统一为 admin | user */
export function normalizeRole(role) {
  if (role === 2 || role === '2' || role === 'ADMIN' || role === 'admin') return 'admin';
  return 'user';
}

/** 将后端 status 统一为 normal | disabled */
export function normalizeStatus(status) {
  if (status === 1 || status === '1' || status === 'NORMAL' || status === 'normal') return 'normal';
  return 'disabled';
}

export function formatDateTime(value) {
  if (!value) return '';
  const s = String(value);
  if (s.includes('T')) {
    return s.replace('T', ' ').slice(0, 19);
  }
  return s;
}

/** i18n：有翻译用翻译，否则显示原文（通知标题/内容等） */
export function translateOrRaw(t, key, raw) {
  if (!raw) return '';
  const translated = t(key, { defaultValue: '' });
  if (translated && translated !== key) return translated;
  return raw;
}
