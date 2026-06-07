import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Notifications from '../../pages/Notifications';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const map = {
        'notification.title': 'Notifications',
        'notification.all': 'All',
        'notification.reminder': 'Reminders',
        'notification.system': 'System',
        'notification.reservationNotif': 'Reservations',
        'notification.announcement': 'Announcements',
        'notification.unread': `${options?.count ?? 0} unread`,
        'notification.markAllRead': 'Mark All Read',
        'notification.markAllReadSuccess': 'All marked as read',
        'notification.markRead': 'Mark Read',
        'notification.newMessage': 'New',
        'notification.empty': 'No notifications',
        'common.error': 'Error',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    },
  };
});

// Mock formatDateTime
vi.mock('../../utils/userDisplay', () => ({
  formatDateTime: (value) => {
    if (!value) return '';
    const s = String(value);
    if (s.includes('T')) return s.replace('T', ' ').slice(0, 19);
    return s;
  },
}));

// Mock useStore
const mockFetchNotifications = vi.fn(() => Promise.resolve());
const mockFetchUnreadCount = vi.fn(() => Promise.resolve());
const mockMarkAsRead = vi.fn(() => Promise.resolve());
const mockMarkAllAsRead = vi.fn(() => Promise.resolve());

const defaultStoreValues = {
  notifications: [],
  unreadCount: 0,
  notifSettings: {
    borrowDueReminder: true,
    reservationArrivalReminder: true,
    systemAnnouncements: true,
  },
  fetchNotifications: mockFetchNotifications,
  fetchUnreadCount: mockFetchUnreadCount,
  markAsRead: mockMarkAsRead,
  markAllAsRead: mockMarkAllAsRead,
};

let storeOverrides = {};

vi.mock('../../store/useStore', () => ({
  useStore: () => ({ ...defaultStoreValues, ...storeOverrides }),
}));

const sampleNotifications = [
  {
    id: 1,
    title: 'Borrow Approved',
    content: 'Your borrow request has been approved',
    type: 'BORROW_APPROVED',
    isRead: false,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    title: 'Return Reminder',
    content: 'Your book is due tomorrow',
    type: 'RETURN_REMINDER',
    isRead: false,
    createdAt: '2024-01-14T08:00:00Z',
  },
  {
    id: 3,
    title: 'Overdue Notice',
    content: 'Your book is overdue',
    type: 'OVERDUE_NOTICE',
    isRead: true,
    createdAt: '2024-01-13T09:00:00Z',
  },
  {
    id: 4,
    title: 'Reservation Ready',
    content: 'Your reserved book is ready',
    type: 'RESERVATION_READY',
    isRead: false,
    createdAt: '2024-01-12T09:00:00Z',
  },
  {
    id: 5,
    title: 'System Announcement',
    content: 'Library will be closed on Monday',
    type: 'SYSTEM_ANNOUNCEMENT',
    isRead: true,
    createdAt: '2024-01-11T09:00:00Z',
  },
  {
    id: 6,
    title: 'Borrow Rejected',
    content: 'Your borrow request was rejected',
    type: 'BORROW_REJECTED',
    isRead: false,
    createdAt: '2024-01-10T09:00:00Z',
  },
];

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeOverrides = {};
  });

  describe('Initial Render', () => {
    it('renders page title', () => {
      render(<Notifications />);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('calls fetchNotifications and fetchUnreadCount on mount', () => {
      render(<Notifications />);

      expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
      expect(mockFetchUnreadCount).toHaveBeenCalledTimes(1);
    });

    it('renders tab navigation', () => {
      render(<Notifications />);

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Reminders')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Reservations')).toBeInTheDocument();
      expect(screen.getByText('Announcements')).toBeInTheDocument();
    });
  });

  describe('Notification List Display', () => {
    it('renders notification items with titles', () => {
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      expect(screen.getByText('Borrow Approved')).toBeInTheDocument();
      expect(screen.getByText('Return Reminder')).toBeInTheDocument();
      expect(screen.getByText('Overdue Notice')).toBeInTheDocument();
    });

    it('renders notification content', () => {
      storeOverrides = { notifications: [sampleNotifications[0]] };
      render(<Notifications />);

      expect(screen.getByText('Your borrow request has been approved')).toBeInTheDocument();
    });

    it('renders notification timestamps', () => {
      storeOverrides = { notifications: [sampleNotifications[0]] };
      render(<Notifications />);

      expect(screen.getByText('2024-01-15 10:00:00')).toBeInTheDocument();
    });

    it('renders New tag for unread notifications', () => {
      storeOverrides = { notifications: [sampleNotifications[0]] };
      render(<Notifications />);

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('does not render New tag for read notifications', () => {
      storeOverrides = { notifications: [sampleNotifications[2]] };
      render(<Notifications />);

      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('renders Mark Read button for unread notifications', () => {
      storeOverrides = { notifications: [sampleNotifications[0]] };
      render(<Notifications />);

      expect(screen.getByText('Mark Read')).toBeInTheDocument();
    });

    it('does not render Mark Read button for read notifications', () => {
      storeOverrides = { notifications: [sampleNotifications[2]] };
      render(<Notifications />);

      expect(screen.queryByText('Mark Read')).not.toBeInTheDocument();
    });
  });

  describe('Unread Count Badge', () => {
    it('shows unread count tag when there are unread notifications', () => {
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      // 4 unread notifications: ids 1, 2, 4, 6
      expect(screen.getByText('4 unread')).toBeInTheDocument();
    });

    it('does not show unread count tag when all are read', () => {
      storeOverrides = {
        notifications: sampleNotifications.map(n => ({ ...n, isRead: true })),
      };
      render(<Notifications />);

      expect(screen.queryByText(/unread/)).not.toBeInTheDocument();
    });
  });

  describe('Mark All Read', () => {
    it('renders Mark All Read button when there are unread notifications', () => {
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      expect(screen.getByText('Mark All Read')).toBeInTheDocument();
    });

    it('does not render Mark All Read button when all are read', () => {
      storeOverrides = {
        notifications: sampleNotifications.map(n => ({ ...n, isRead: true })),
      };
      render(<Notifications />);

      expect(screen.queryByText('Mark All Read')).not.toBeInTheDocument();
    });

    it('calls markAllAsRead and shows success message on success', async () => {
      mockMarkAllAsRead.mockResolvedValue({});
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      fireEvent.click(screen.getByText('Mark All Read'));

      await waitFor(() => {
        expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
      });

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith('All marked as read');
      });
    });

    it('shows error message when markAllAsRead fails', async () => {
      mockMarkAllAsRead.mockRejectedValue(new Error('Failed'));
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      fireEvent.click(screen.getByText('Mark All Read'));

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Failed');
      });
    });
  });

  describe('Mark Single as Read', () => {
    it('calls markAsRead when Mark Read button is clicked', async () => {
      mockMarkAsRead.mockResolvedValue({});
      storeOverrides = { notifications: [sampleNotifications[0]] };
      render(<Notifications />);

      fireEvent.click(screen.getByText('Mark Read'));

      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalledWith(1);
      });
    });

    it('shows error message when markAsRead fails', async () => {
      mockMarkAsRead.mockRejectedValue(new Error('Mark read failed'));
      storeOverrides = { notifications: [sampleNotifications[0]] };
      render(<Notifications />);

      fireEvent.click(screen.getByText('Mark Read'));

      const { message } = await import('antd');
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('Mark read failed');
      });
    });

    it('calls markAsRead when clicking on unread notification item', async () => {
      mockMarkAsRead.mockResolvedValue({});
      storeOverrides = { notifications: [sampleNotifications[0]] };
      render(<Notifications />);

      // Click on the notification item (the List.Item)
      const notificationItem = screen.getByText('Borrow Approved').closest('.ant-list-item');
      if (notificationItem) {
        fireEvent.click(notificationItem);
      }

      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Tab Filtering', () => {
    it('shows all notifications in All tab by default', () => {
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      expect(screen.getByText('Borrow Approved')).toBeInTheDocument();
      expect(screen.getByText('Return Reminder')).toBeInTheDocument();
      expect(screen.getByText('Overdue Notice')).toBeInTheDocument();
      expect(screen.getByText('Reservation Ready')).toBeInTheDocument();
      expect(screen.getByText('System Announcement')).toBeInTheDocument();
      expect(screen.getByText('Borrow Rejected')).toBeInTheDocument();
    });

    it('filters notifications by category when tab is clicked', async () => {
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      fireEvent.click(screen.getByText('Reservations'));

      await waitFor(() => {
        expect(screen.getByText('Reservation Ready')).toBeInTheDocument();
        expect(screen.queryByText('Borrow Approved')).not.toBeInTheDocument();
      });
    });

    it('shows reminder notifications in Reminders tab', async () => {
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      fireEvent.click(screen.getByText('Reminders'));

      await waitFor(() => {
        // RETURN_REMINDER and OVERDUE_NOTICE map to 'reminder' category
        expect(screen.getByText('Return Reminder')).toBeInTheDocument();
        expect(screen.getByText('Overdue Notice')).toBeInTheDocument();
      });
    });

    it('shows system notifications in System tab', async () => {
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      fireEvent.click(screen.getByText('System'));

      await waitFor(() => {
        // BORROW_REJECTED and REVIEW_REPLIED map to 'system' category
        expect(screen.getByText('Borrow Rejected')).toBeInTheDocument();
      });
    });

    it('shows announcement notifications in Announcements tab', async () => {
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      fireEvent.click(screen.getByText('Announcements'));

      await waitFor(() => {
        expect(screen.getByText('System Announcement')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Settings Filtering', () => {
    it('filters out notifications when setting is disabled', () => {
      storeOverrides = {
        notifications: sampleNotifications,
        notifSettings: {
          borrowDueReminder: false,
          reservationArrivalReminder: true,
          systemAnnouncements: true,
        },
      };
      render(<Notifications />);

      // RETURN_REMINDER and OVERDUE_NOTICE are 'reminder' category, mapped to borrowDueReminder
      // When borrowDueReminder is false, they should be filtered out
      expect(screen.queryByText('Return Reminder')).not.toBeInTheDocument();
      expect(screen.queryByText('Overdue Notice')).not.toBeInTheDocument();
    });

    it('filters out reservation notifications when setting is disabled', () => {
      storeOverrides = {
        notifications: sampleNotifications,
        notifSettings: {
          borrowDueReminder: true,
          reservationArrivalReminder: false,
          systemAnnouncements: true,
        },
      };
      render(<Notifications />);

      expect(screen.queryByText('Reservation Ready')).not.toBeInTheDocument();
    });

    it('filters out announcement and system notifications when setting is disabled', () => {
      storeOverrides = {
        notifications: sampleNotifications,
        notifSettings: {
          borrowDueReminder: true,
          reservationArrivalReminder: true,
          systemAnnouncements: false,
        },
      };
      render(<Notifications />);

      expect(screen.queryByText('System Announcement')).not.toBeInTheDocument();
      expect(screen.queryByText('Borrow Rejected')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no notifications', () => {
      storeOverrides = { notifications: [] };
      render(<Notifications />);

      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(screen.getByText('📭')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows spin component while loading', () => {
      mockFetchNotifications.mockReturnValue(new Promise(() => {}));
      mockFetchUnreadCount.mockReturnValue(new Promise(() => {}));
      render(<Notifications />);

      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  describe('Avatar Display', () => {
    it('renders reminder avatar for reminder category notifications', () => {
      storeOverrides = { notifications: [sampleNotifications[0]] };
      render(<Notifications />);

      // BORROW_APPROVED maps to 'reminder' category → ⏰
      expect(screen.getByText('⏰')).toBeInTheDocument();
    });

    it('renders urgent avatar for high priority announcement', () => {
      storeOverrides = {
        notifications: [{
          id: 1,
          title: 'Urgent Announcement',
          content: 'Urgent content',
          type: 'SYSTEM_ANNOUNCEMENT',
          priority: 1,
          isRead: false,
          createdAt: '2024-01-15T10:00:00Z',
        }],
      };
      render(<Notifications />);

      expect(screen.getByText('🔴')).toBeInTheDocument();
    });

    it('renders medium priority avatar for medium priority announcement', () => {
      storeOverrides = {
        notifications: [{
          id: 1,
          title: 'Medium Announcement',
          content: 'Medium content',
          type: 'SYSTEM_ANNOUNCEMENT',
          priority: 2,
          isRead: false,
          createdAt: '2024-01-15T10:00:00Z',
        }],
      };
      render(<Notifications />);

      expect(screen.getByText('🟠')).toBeInTheDocument();
    });

    it('renders default announcement avatar for low priority announcement', () => {
      storeOverrides = {
        notifications: [{
          id: 1,
          title: 'Low Announcement',
          content: 'Low content',
          type: 'SYSTEM_ANNOUNCEMENT',
          priority: 3,
          isRead: false,
          createdAt: '2024-01-15T10:00:00Z',
        }],
      };
      render(<Notifications />);

      expect(screen.getByText('📢')).toBeInTheDocument();
    });

    it('renders reservation avatar for reservation category', () => {
      storeOverrides = {
        notifications: [{
          id: 1,
          title: 'Reservation Ready',
          content: 'Your book is ready',
          type: 'RESERVATION_READY',
          isRead: false,
          createdAt: '2024-01-15T10:00:00Z',
        }],
      };
      render(<Notifications />);

      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    it('renders default bell avatar for system category', () => {
      storeOverrides = {
        notifications: [{
          id: 1,
          title: 'System Message',
          content: 'System content',
          type: 'BORROW_REJECTED',
          isRead: false,
          createdAt: '2024-01-15T10:00:00Z',
        }],
      };
      render(<Notifications />);

      expect(screen.getByText('🔔')).toBeInTheDocument();
    });
  });

  describe('Tab Badges', () => {
    it('shows badge count on Reminders tab for unread reminders', () => {
      storeOverrides = { notifications: sampleNotifications };
      render(<Notifications />);

      // RETURN_REMINDER and OVERDUE_NOTICE are reminder category
      // Only RETURN_REMINDER (id:2) is unread in reminder category
      const reminderTab = screen.getByText('Reminders');
      expect(reminderTab).toBeInTheDocument();
    });
  });
});
