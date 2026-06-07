const EMOTION_CATEGORY_MAP = {
  happy:     { categoryNames: ['文学', '艺术', '教育'], labelKey: 'emotion.happy', emoji: '😊', color: '#52c41a' },
  sad:       { categoryNames: ['哲学', '文学', '教育'], labelKey: 'emotion.sad', emoji: '😢', color: '#1890ff' },
  angry:     { categoryNames: ['历史', '哲学', '艺术'], labelKey: 'emotion.angry', emoji: '😠', color: '#ff4d4f' },
  fearful:   { categoryNames: ['科技', '教育', '哲学'], labelKey: 'emotion.fearful', emoji: '😨', color: '#722ed1' },
  surprised: { categoryNames: ['科技', '艺术', '经济'], labelKey: 'emotion.surprised', emoji: '😮', color: '#faad14' },
  disgusted: { categoryNames: ['经济', '历史', '教育'], labelKey: 'emotion.disgusted', emoji: '😒', color: '#eb2f96' },
  neutral:   { categoryNames: ['文学', '科技', '历史'], labelKey: 'emotion.neutral', emoji: '😐', color: '#8c8c8c' },
};

export function getEmotionConfig(emotion) {
  return EMOTION_CATEGORY_MAP[emotion] || EMOTION_CATEGORY_MAP.neutral;
}

export function getBooksByEmotion(emotion, books, categories = []) {
  const config = getEmotionConfig(emotion);
  const names = config.categoryNames || [];
  const idSet = new Set(
    categories.filter((c) => names.includes(c.name)).map((c) => c.id)
  );
  let list = idSet.size > 0
    ? books.filter((b) => idSet.has(b.categoryId))
    : books;
  if (list.length === 0) list = books;

  const shuffled = [...list].sort(() => Math.random() - 0.5);
  const topRated = shuffled
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const count = Math.min(6, topRated.length);
  const highRated = topRated.slice(0, Math.ceil(count * 0.6));
  const remaining = topRated.slice(Math.ceil(count * 0.6));
  const randomPick = remaining.sort(() => Math.random() - 0.5).slice(0, count - highRated.length);
  return [...highRated, ...randomPick];
}

export const EMOTION_KEYS = Object.keys(EMOTION_CATEGORY_MAP);
