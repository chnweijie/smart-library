import { normalizeRole, normalizeStatus, formatDateTime, translateOrRaw } from '../../utils/userDisplay';

describe('userDisplay', () => {
  describe('normalizeRole', () => {
    it('数字 2 返回 admin', () => {
      expect(normalizeRole(2)).toBe('admin');
    });

    it('字符串 "2" 返回 admin', () => {
      expect(normalizeRole('2')).toBe('admin');
    });

    it('字符串 "ADMIN" 返回 admin', () => {
      expect(normalizeRole('ADMIN')).toBe('admin');
    });

    it('字符串 "admin" 返回 admin', () => {
      expect(normalizeRole('admin')).toBe('admin');
    });

    it('数字 1 返回 user', () => {
      expect(normalizeRole(1)).toBe('user');
    });

    it('字符串 "USER" 返回 user', () => {
      expect(normalizeRole('USER')).toBe('user');
    });

    it('null 返回 user', () => {
      expect(normalizeRole(null)).toBe('user');
    });

    it('undefined 返回 user', () => {
      expect(normalizeRole(undefined)).toBe('user');
    });

    it('数字 0 返回 user', () => {
      expect(normalizeRole(0)).toBe('user');
    });

    it('空字符串返回 user', () => {
      expect(normalizeRole('')).toBe('user');
    });
  });

  describe('normalizeStatus', () => {
    it('数字 1 返回 normal', () => {
      expect(normalizeStatus(1)).toBe('normal');
    });

    it('字符串 "1" 返回 normal', () => {
      expect(normalizeStatus('1')).toBe('normal');
    });

    it('字符串 "NORMAL" 返回 normal', () => {
      expect(normalizeStatus('NORMAL')).toBe('normal');
    });

    it('字符串 "normal" 返回 normal', () => {
      expect(normalizeStatus('normal')).toBe('normal');
    });

    it('数字 0 返回 disabled', () => {
      expect(normalizeStatus(0)).toBe('disabled');
    });

    it('字符串 "DISABLED" 返回 disabled', () => {
      expect(normalizeStatus('DISABLED')).toBe('disabled');
    });

    it('null 返回 disabled', () => {
      expect(normalizeStatus(null)).toBe('disabled');
    });

    it('undefined 返回 disabled', () => {
      expect(normalizeStatus(undefined)).toBe('disabled');
    });
  });

  describe('formatDateTime', () => {
    it('ISO 字符串含 T 时替换为空格并截取前19字符', () => {
      expect(formatDateTime('2024-01-15T10:30:45.123Z')).toBe('2024-01-15 10:30:45');
    });

    it('不含 T 的字符串原样返回', () => {
      expect(formatDateTime('2024-01-15 10:30:45')).toBe('2024-01-15 10:30:45');
    });

    it('null 返回空字符串', () => {
      expect(formatDateTime(null)).toBe('');
    });

    it('undefined 返回空字符串', () => {
      expect(formatDateTime(undefined)).toBe('');
    });

    it('空字符串返回空字符串', () => {
      expect(formatDateTime('')).toBe('');
    });

    it('数字 0 返回空字符串', () => {
      expect(formatDateTime(0)).toBe('');
    });

    it('短字符串原样返回', () => {
      expect(formatDateTime('2024-01-15')).toBe('2024-01-15');
    });
  });

  describe('translateOrRaw', () => {
    const t = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('有翻译时返回翻译结果', () => {
      t.mockReturnValue('已翻译内容');
      const result = translateOrRaw(t, 'translation.key', '原始内容');
      expect(result).toBe('已翻译内容');
      expect(t).toHaveBeenCalledWith('translation.key', { defaultValue: '' });
    });

    it('翻译结果等于 key 时返回原始值', () => {
      t.mockReturnValue('translation.key');
      const result = translateOrRaw(t, 'translation.key', '原始内容');
      expect(result).toBe('原始内容');
    });

    it('翻译结果为空字符串时返回原始值', () => {
      t.mockReturnValue('');
      const result = translateOrRaw(t, 'translation.key', '原始内容');
      expect(result).toBe('原始内容');
    });

    it('raw 为 null 时返回空字符串', () => {
      const result = translateOrRaw(t, 'translation.key', null);
      expect(result).toBe('');
      expect(t).not.toHaveBeenCalled();
    });

    it('raw 为 undefined 时返回空字符串', () => {
      const result = translateOrRaw(t, 'translation.key', undefined);
      expect(result).toBe('');
      expect(t).not.toHaveBeenCalled();
    });

    it('raw 为空字符串时返回空字符串', () => {
      const result = translateOrRaw(t, 'translation.key', '');
      expect(result).toBe('');
      expect(t).not.toHaveBeenCalled();
    });
  });
});
