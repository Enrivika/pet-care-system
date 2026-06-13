import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface Notification {
  id: number;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  event_id?: number;
  pet_id?: number;
  category?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  isInitialLoad: boolean;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  isInitialLoad: true,
};

// Загрузка уведомлений
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async () => {
    const response = await api.get('/notifications');
    return response.data;
  }
);

// Отметить как прочитанное
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: number) => {
    await api.post(`/notifications/${id}/read`);
    return id;
  }
);

// Пометить все как прочитанные
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await api.post('/notifications/mark-all-read');
  }
);

export const clearAllNotifications = createAsyncThunk('notifications/clearAll', async () => {
  await api.delete('/notifications/clear');
  return true;
});

// Удалить одно уведомление
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (id: number) => {
    await api.delete(`/notifications/${id}`);
    return id;
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n: Notification) => !n.read_at).length;
        state.loading = false;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        state.notifications = state.notifications.map(n =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        );
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map(n => ({
          ...n,
          read_at: new Date().toISOString()
        }));
        state.unreadCount = 0;
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload;
        const deleted = state.notifications.find((n: Notification) => n.id === id);
        state.notifications = state.notifications.filter((n: Notification) => n.id !== id);
        if (deleted && !deleted.read_at) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export default notificationsSlice.reducer;