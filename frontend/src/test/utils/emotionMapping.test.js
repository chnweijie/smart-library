import { getEmotionConfig, getBooksByEmotion, EMOTION_KEYS } from '../../utils/emotionMapping';

describe('emotionMapping', () => {
  const ALL_EMOTIONS = ['happy', 'sad', 'angry', 'fearful', 'surprised', 'disgusted', 'neutral'];

  describe('getEmotionConfig', () => {
    it('返回 happy 情绪配置', () => {
      const config = getEmotionConfig('happy');
      expect(config.categoryNames).toEqual(['文学', '艺术', '教育']);
      expect(config.labelKey).toBe('emotion.happy');
      expect(config.emoji).toBe('😊');
      expect(config.color).toBe('#52c41a');
    });

    it('返回 sad 情绪配置', () => {
      const config = getEmotionConfig('sad');
      expect(config.categoryNames).toEqual(['科技', '哲学', '历史']);
      expect(config.labelKey).toBe('emotion.sad');
      expect(config.emoji).toBe('😢');
      expect(config.color).toBe('#1890ff');
    });

    it('返回 angry 情绪配置', () => {
      const config = getEmotionConfig('angry');
      expect(config.categoryNames).toEqual(['哲学', '艺术', '历史']);
      expect(config.labelKey).toBe('emotion.angry');
      expect(config.emoji).toBe('😠');
      expect(config.color).toBe('#ff4d4f');
    });

    it('返回 fearful 情绪配置', () => {
      const config = getEmotionConfig('fearful');
      expect(config.categoryNames).toEqual(['哲学', '科技', '文学']);
      expect(config.labelKey).toBe('emotion.fearful');
      expect(config.emoji).toBe('😨');
      expect(config.color).toBe('#722ed1');
    });

    it('返回 surprised 情绪配置', () => {
      const config = getEmotionConfig('surprised');
      expect(config.categoryNames).toEqual(['科技', '历史', '文学']);
      expect(config.labelKey).toBe('emotion.surprised');
      expect(config.emoji).toBe('😮');
      expect(config.color).toBe('#faad14');
    });

    it('返回 disgusted 情绪配置', () => {
      const config = getEmotionConfig('disgusted');
      expect(config.categoryNames).toEqual(['艺术', '哲学', '历史']);
      expect(config.labelKey).toBe('emotion.disgusted');
      expect(config.emoji).toBe('😒');
      expect(config.color).toBe('#eb2f96');
    });

    it('返回 neutral 情绪配置', () => {
      const config = getEmotionConfig('neutral');
      expect(config.categoryNames).toEqual(['文学', '历史', '科技']);
      expect(config.labelKey).toBe('emotion.neutral');
      expect(config.emoji).toBe('😐');
      expect(config.color).toBe('#8c8c8c');
    });

    it('未知情绪默认返回 neutral 配置', () => {
      const config = getEmotionConfig('unknown_emotion');
      expect(config.labelKey).toBe('emotion.neutral');
      expect(config.emoji).toBe('😐');
    });

    it('undefined 参数默认返回 neutral 配置', () => {
      const config = getEmotionConfig(undefined);
      expect(config.labelKey).toBe('emotion.neutral');
    });

    it('null 参数默认返回 neutral 配置', () => {
      const config = getEmotionConfig(null);
      expect(config.labelKey).toBe('emotion.neutral');
    });
  });

  describe('getBooksByEmotion', () => {
    const books = [
      { id: 1, categoryId: 10, title: '书A', rating: 4.5 },
      { id: 2, categoryId: 20, title: '书B', rating: 3.0 },
      { id: 3, categoryId: 30, title: '书C', rating: 5.0 },
      { id: 4, categoryId: 10, title: '书D', rating: 2.5 },
      { id: 5, categoryId: 40, title: '书E', rating: 4.0 },
      { id: 6, categoryId: 20, title: '书F', rating: 1.0 },
      { id: 7, categoryId: 30, title: '书G', rating: 3.5 },
      { id: 8, categoryId: 50, title: '书H', rating: 4.8 },
    ];

    const categories = [
      { id: 10, name: '文学' },
      { id: 20, name: '科技' },
      { id: 30, name: '艺术' },
      { id: 40, name: '历史' },
      { id: 50, name: '教育' },
    ];

    it('根据情绪匹配分类筛选书籍', () => {
      // happy -> 文学(10), 艺术(30), 教育(50)
      const result = getBooksByEmotion('happy', books, categories);
      const matchedIds = result.map((b) => b.id);
      // 匹配 categoryId 10, 30, 50 的书: 1,3,4,7,8
      expect(matchedIds.every((id) => [1, 3, 4, 7, 8].includes(id))).toBe(true);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('无匹配分类时返回所有书籍', () => {
      const emptyCategories = [];
      const result = getBooksByEmotion('happy', books, emptyCategories);
      expect(result.length).toBe(6); // 最多6本
    });

    it('匹配分类存在但无对应书籍时返回所有书籍', () => {
      const noMatchCategories = [{ id: 99, name: '文学' }]; // id 99 没有对应书籍
      const result = getBooksByEmotion('happy', books, noMatchCategories);
      // idSet 为空 -> 使用全部 books
      expect(result.length).toBe(6);
    });

    it('空书籍数组返回空数组', () => {
      const result = getBooksByEmotion('happy', [], categories);
      expect(result).toEqual([]);
    });

    it('空分类数组返回所有书籍（最多6本）', () => {
      const result = getBooksByEmotion('happy', books, []);
      expect(result.length).toBe(6);
    });

    it('结果按评分降序排列', () => {
      const result = getBooksByEmotion('happy', books, categories);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].rating).toBeGreaterThanOrEqual(result[i].rating);
      }
    });

    it('最多返回6本书', () => {
      const manyBooks = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        categoryId: 10,
        title: `书${i}`,
        rating: Math.random() * 5,
      }));
      const result = getBooksByEmotion('happy', manyBooks, categories);
      expect(result.length).toBe(6);
    });

    it('书籍无 rating 时默认为0参与排序', () => {
      const booksNoRating = [
        { id: 1, categoryId: 10, title: '书A' },
        { id: 2, categoryId: 10, title: '书B', rating: 3 },
      ];
      const result = getBooksByEmotion('happy', booksNoRating, categories);
      expect(result[0].rating).toBe(3);
      expect(result[1].rating).toBeUndefined();
    });

    it('不修改原始书籍数组', () => {
      const originalBooks = [
        { id: 1, categoryId: 10, title: '书A', rating: 4 },
        { id: 2, categoryId: 10, title: '书B', rating: 5 },
      ];
      const copy = [...originalBooks];
      getBooksByEmotion('happy', originalBooks, categories);
      expect(originalBooks).toEqual(copy);
    });
  });

  describe('EMOTION_KEYS', () => {
    it('包含全部7种情绪', () => {
      expect(EMOTION_KEYS).toHaveLength(7);
      ALL_EMOTIONS.forEach((emotion) => {
        expect(EMOTION_KEYS).toContain(emotion);
      });
    });

    it('是字符串数组', () => {
      EMOTION_KEYS.forEach((key) => {
        expect(typeof key).toBe('string');
      });
    });
  });
});
