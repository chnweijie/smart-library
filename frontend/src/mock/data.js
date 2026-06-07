export const mockCategories = [
  { id: 1, name: 'all', code: 'all' },
  { id: 2, name: 'literature', code: 'literature' },
  { id: 3, name: 'technology', code: 'technology' },
  { id: 4, name: 'history', code: 'history' },
  { id: 5, name: 'art', code: 'art' },
  { id: 6, name: 'philosophy', code: 'philosophy' },
  { id: 7, name: 'economy', code: 'economy' },
  { id: 8, name: 'education', code: 'education' },
];

export const mockBooks = [
  { id: 1, title: 'toLive', author: 'yuHua', category: 'literature', rating: 4.8, available: 5, cover: '', description: 'toLiveDesc', publishDate: '2010-05-10' },
  { id: 2, title: 'threeBody', author: 'liuCixin', category: 'technology', rating: 4.9, available: 0, cover: '', description: 'threeBodyDesc', publishDate: '2008-01-01' },
  { id: 3, title: 'wanliFifteen', author: 'huangRenyu', category: 'history', rating: 4.5, available: 3, cover: '', description: 'wanliFifteenDesc', publishDate: '2006-08-01' },
  { id: 4, title: 'redMansion', author: 'caoXueqin', category: 'literature', rating: 4.9, available: 0, cover: '', description: 'redMansionDesc', publishDate: '1996-12-01' },
  { id: 5, title: 'sapiens', author: 'harari', category: 'history', rating: 4.7, available: 6, cover: '', description: 'sapiensDesc', publishDate: '2014-11-01' },
  { id: 6, title: 'hundredYears', author: 'marquez', category: 'literature', rating: 4.8, available: 4, cover: '', description: 'hundredYearsDesc', publishDate: '2011-06-01' },
  { id: 7, title: 'cleanCode', author: 'robertMartin', category: 'technology', rating: 4.7, available: 2, cover: '', description: 'cleanCodeDesc', publishDate: '2010-01-01' },
  { id: 8, title: 'designPatterns', author: 'gof', category: 'technology', rating: 4.6, available: 8, cover: '', description: 'designPatternsDesc', publishDate: '2007-11-01' },
  { id: 9, title: 'storyOfArt', author: 'gombrich', category: 'art', rating: 4.8, available: 3, cover: '', description: 'storyOfArtDesc', publishDate: '2008-04-01' },
  { id: 10, title: 'sophiesWorld', author: 'gaarder', category: 'philosophy', rating: 4.5, available: 5, cover: '', description: 'sophiesWorldDesc', publishDate: '2007-10-01' },
  { id: 11, title: 'wealthOfNations', author: 'adamSmith', category: 'economy', rating: 4.4, available: 4, cover: '', description: 'wealthOfNationsDesc', publishDate: '2005-01-01' },
  { id: 12, title: 'cuore', author: 'deAmicis', category: 'education', rating: 4.6, available: 6, cover: '', description: 'cuoreDesc', publishDate: '2006-05-01' },
];

export const mockUsers = [
  { id: 1, username: 'admin', nickname: 'adminNick', role: 'admin', email: 'admin@example.com', status: 'normal', joinDate: '2024-01-01', borrowCount: 25, avatar: '' },
  { id: 2, username: 'user', nickname: 'userNick', role: 'user', email: 'user@example.com', status: 'normal', joinDate: '2024-02-15', borrowCount: 12, avatar: '' },
  { id: 3, username: 'test1', nickname: 'ivanPetrov', role: 'user', email: 'test1@example.com', status: 'normal', joinDate: '2024-03-20', borrowCount: 8, avatar: '' },
  { id: 4, username: 'test2', nickname: 'petrSidorov', role: 'user', email: 'test2@example.com', status: 'disabled', joinDate: '2024-04-05', borrowCount: 3, avatar: '' },
  { id: 5, username: 'reader', nickname: 'annaKryuchkova', role: 'user', email: 'reader@example.com', status: 'normal', joinDate: '2024-01-20', borrowCount: 18, avatar: '' },
];

export const mockNotifications = [
  { id: 1, title: 'dueReminder', content: 'dueReminderContent', type: 'warning', category: 'reminder', time: '2024-05-25 14:30', read: false },
  { id: 2, title: 'returnApproved', content: 'returnApprovedContent', type: 'success', category: 'system', time: '2024-05-24 10:15', read: true },
  { id: 3, title: 'reserveArrived', content: 'reserveArrivedContent', type: 'info', category: 'reservation', time: '2024-05-23 16:45', read: true },
  { id: 4, title: 'systemNotice', content: 'systemNoticeContent', type: 'info', category: 'announcement', time: '2024-05-20 09:00', read: true },
  { id: 5, title: 'reviewLiked', content: 'reviewLikedContent', type: 'success', category: 'review', time: '2024-05-22 11:20', read: false },
  { id: 6, title: 'borrowReminder', content: 'borrowReminderContent', type: 'info', category: 'reminder', time: '2024-05-18 09:30', read: true },
];

export const mockReservations = [
  { id: 1, book: 'threeBody', reserveDate: '2024-05-20', status: 'reserving', queuePosition: 1 },
  { id: 2, book: 'redMansion', reserveDate: '2024-05-18', status: 'ready', queuePosition: 0 },
];

export const mockBorrows = [
  { id: 1, book: 'toLive', borrowDate: '2024-05-15', dueDate: '2024-06-15', status: 'borrowing' },
  { id: 2, book: 'threeBody', borrowDate: '2024-04-20', dueDate: '2024-05-20', status: 'pending' },
];

export const mockBorrowHistory = [
  { id: 1, book: 'hundredYears', borrowDate: '2024-03-10', returnDate: '2024-04-05', status: 'returned', rating: 4 },
  { id: 2, book: 'wanliFifteen', borrowDate: '2024-02-01', returnDate: '2024-03-01', status: 'returned', rating: 5 },
  { id: 3, book: 'sapiens', borrowDate: '2024-01-15', returnDate: '2024-02-10', status: 'returned', rating: 4 },
  { id: 4, book: 'redMansion', borrowDate: '2023-12-20', returnDate: '2024-01-18', status: 'returned', rating: 5 },
];

export const mockReviewRequests = [
  { id: 1, user: 'userNick', book: 'threeBody', time: '2024-05-25 10:30', status: 'pending' },
  { id: 2, user: 'ivanPetrov', book: 'toLive', time: '2024-05-24 15:45', status: 'pending' },
  { id: 3, user: 'petrSidorov', book: 'hundredYears', time: '2024-05-23 09:20', status: 'approved' },
  { id: 4, user: 'alexSmirnov', book: 'sapiens', time: '2024-05-22 11:30', status: 'rejected' },
];

export const mockAnnouncements = [
  { id: 1, title: 'systemUpgrade', content: 'systemUpgradeContent', publishDate: '2024-05-25 10:00', status: 'published' },
  { id: 2, title: 'newBooks', content: 'newBooksContent', publishDate: '2024-05-20 09:30', status: 'published' },
  { id: 3, title: 'readingEvent', content: 'readingEventContent', publishDate: '2024-05-18 14:00', status: 'published' },
  { id: 4, title: 'holidayExtend', content: 'holidayExtendContent', publishDate: '2024-04-25 16:00', status: 'expired' },
];

export const mockReviews = [
  { id: 1, bookId: 1, userId: 2, username: 'user', nickname: 'userNick', rating: 5, content: 'review1Content', tags: ['mustRead', 'classic', 'touching'], helpfulVotes: 12, helpfulUsers: [3, 5], comments: [], date: '2024-05-20 14:30', status: 'approved' },
  { id: 2, bookId: 1, userId: 3, username: 'test1', nickname: 'ivanPetrov', rating: 4, content: 'review2Content', tags: ['deep', 'worthReading'], helpfulVotes: 5, helpfulUsers: [], comments: [], date: '2024-05-15 10:20', status: 'approved' },
  { id: 3, bookId: 2, userId: 5, username: 'reader', nickname: 'annaKryuchkova', rating: 5, content: 'review3Content', tags: ['scifi', 'masterpiece', 'recommend'], helpfulVotes: 28, helpfulUsers: [2, 3], comments: [
    { id: 1, userId: 2, username: 'user', content: 'review3Comment1', date: '2024-05-21 09:00' }
  ], date: '2024-05-10 16:45', status: 'approved' },
  { id: 4, bookId: 3, userId: 2, username: 'user', nickname: 'userNick', rating: 4, content: 'review4Content', tags: ['history', 'informative'], helpfulVotes: 8, helpfulUsers: [], comments: [], date: '2024-05-05 11:30', status: 'approved' },
  { id: 5, bookId: 7, userId: 3, username: 'test1', nickname: 'ivanPetrov', rating: 5, content: 'review5Content', tags: ['programming', 'mustRead', 'practical'], helpfulVotes: 15, helpfulUsers: [], comments: [], date: '2024-04-28 09:15', status: 'pending' },
];

export const mockRecommendations = {
  similarTo: {
    1: [6, 4, 10],
    2: [7, 8, 5],
    7: [8, 2, 3]
  }
};
