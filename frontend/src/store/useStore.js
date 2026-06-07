import { useAuthStore } from './useAuthStore';
import { useBookStore } from './useBookStore';
import { useBorrowStore } from './useBorrowStore';
import { useReviewStore } from './useReviewStore';
import { useNotificationStore } from './useNotificationStore';
import { useUserStore } from './useUserStore';
import { useAnnouncementStore } from './useAnnouncementStore';
import { useEmotionStore } from './useEmotionStore';

export const useStore = () => {
  const auth = useAuthStore();
  const book = useBookStore();
  const borrow = useBorrowStore();
  const review = useReviewStore();
  const notification = useNotificationStore();
  const user = useUserStore();
  const announcement = useAnnouncementStore();
  const emotion = useEmotionStore();

  return {
    currentUser: auth.currentUser,
    login: auth.login,
    register: auth.register,
    faceLogin: auth.faceLogin,
    logout: () => {
      useAuthStore.getState().reset();
      useBookStore.getState().reset();
      useBorrowStore.getState().reset();
      useReviewStore.getState().reset();
      useNotificationStore.getState().reset();
      useUserStore.getState().reset();
      useAnnouncementStore.getState().reset();
    },
    setCurrentUser: auth.setCurrentUser,

    books: book.books,
    totalBooks: book.totalBooks,
    bookPage: book.bookPage,
    selectedBook: book.selectedBook,
    selectedCategory: book.selectedCategory,
    categories: book.categories,
    favorites: book.favorites,
    favoriteBooks: book.favoriteBooks,
    fetchBooks: book.fetchBooks,
    setSelectedBook: book.setSelectedBook,
    fetchBookDetail: book.fetchBookDetail,
    addBook: book.addBook,
    updateBook: book.updateBook,
    deleteBook: book.deleteBook,
    setSelectedCategory: book.setSelectedCategory,
    fetchCategories: book.fetchCategories,
    addCategory: book.addCategory,
    updateCategory: book.updateCategory,
    deleteCategory: book.deleteCategory,
    fetchFavorites: book.fetchFavorites,
    toggleFavorite: book.toggleFavorite,
    checkFavorite: book.checkFavorite,
    getSimilarBooks: book.getSimilarBooks,

    borrows: borrow.borrows,
    borrowHistory: borrow.borrowHistory,
    reservations: borrow.reservations,
    reviewRequests: borrow.reviewRequests,
    fetchCurrentBorrows: borrow.fetchCurrentBorrows,
    borrowBook: borrow.borrowBook,
    applyReturn: borrow.applyReturn,
    cancelReturn: borrow.cancelReturn,
    fetchBorrowHistory: borrow.fetchBorrowHistory,
    fetchReservations: borrow.fetchReservations,
    reserveBook: borrow.reserveBook,
    cancelReservation: borrow.cancelReservation,
    fetchReviewRequests: borrow.fetchReviewRequests,
    approveReturn: borrow.approveReturn,
    rejectReturn: borrow.rejectReturn,

    reviews: review.reviews,
    pendingReviews: review.pendingReviews,
    fetchBookReviews: review.fetchBookReviews,
    fetchPendingReviews: review.fetchPendingReviews,
    addReview: review.addReview,
    updateReview: review.updateReview,
    deleteReview: review.deleteReview,
    approveReview: review.approveReview,
    rejectReview: review.rejectReview,
    voteHelpful: review.voteHelpful,
    addReviewComment: review.addReviewComment,

    notifications: notification.notifications,
    unreadCount: notification.unreadCount,
    notifSettings: notification.notifSettings,
    updateNotifSetting: notification.updateNotifSetting,
    fetchNotifications: notification.fetchNotifications,
    fetchUnreadCount: notification.fetchUnreadCount,
    markAsRead: notification.markAsRead,
    markAllAsRead: notification.markAllAsRead,

    users: user.users,
    fetchUsers: user.fetchUsers,
    toggleUserStatus: user.toggleUserStatus,
    registerFace: user.registerFace,
    unregisterFace: user.unregisterFace,
    changePassword: user.changePassword,
    updateUserProfile: user.updateUserProfile,

    announcements: announcement.announcements,
    fetchAnnouncements: announcement.fetchAnnouncements,
    addAnnouncement: announcement.addAnnouncement,
    deleteAnnouncement: announcement.deleteAnnouncement,

    fetchEmotionRecommend: emotion.fetchEmotionRecommend,
    recordEmotion: emotion.recordEmotion,
    updateEmotionBookId: emotion.updateEmotionBookId,
    currentEmotionRecordId: emotion.currentEmotionRecordId,
    setCurrentEmotionRecordId: emotion.setCurrentEmotionRecordId,
    clearEmotionRecordId: emotion.clearEmotionRecordId,
  };
};

export { useAuthStore, useBookStore, useBorrowStore, useReviewStore, useNotificationStore, useUserStore, useAnnouncementStore, useEmotionStore };
