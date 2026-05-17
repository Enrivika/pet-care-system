import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export interface CalendarEvent {
  id: number;
  pet_id: number;
  created_by: number;
  title: string;
  event_type: string;
  start_at: string;
  end_at?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
  reminder_sent_at?: string;
  is_completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CalendarEventsState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CalendarEventsState = {
  events: [],
  isLoading: false,
  error: null,
};

// Загрузка ВСЕХ событий пользователя
export const fetchAllTasks = createAsyncThunk(
  'calendar/fetchAllTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/calendar-events');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки задач');
    }
  }
);

// Создание события
export const createTask = createAsyncThunk(
  'calendar/createTask',
  async (taskData: any, { rejectWithValue }) => {
    try {
      const dataToSend = { ...taskData };

      // Если значение null, 0 или 'none' — УДАЛЯЕМ ключ из объекта
      if (taskData.reminder_minutes == null || taskData.reminder_minutes === 'none') {
        delete dataToSend.reminder_minutes;
      } else {
        dataToSend.reminder_minutes = Number(taskData.reminder_minutes);
      }

      const response = await api.post(`/pets/${taskData.pet_id}/events`, dataToSend);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания задачи');
    }
  }
);

// Обновление события
export const updateTask = createAsyncThunk(
  'calendar/updateTask',
  async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
      const dataToSend = { ...data };

      // Унифицируем поведение: если reminder_minutes null или 'none' — удаляем ключ
      if (data.reminder_minutes == null || data.reminder_minutes === 'none') {
        delete dataToSend.reminder_minutes;
      } else {
        dataToSend.reminder_minutes = Number(data.reminder_minutes);
      }

      const response = await api.put(`/calendar-events/${id}`, dataToSend);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления задачи');
    }
  }
);

// Удаление события
export const deleteTask = createAsyncThunk(
  'calendar/deleteTask',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/calendar-events/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления задачи');
    }
  }
);

// Выполнение события
export const completeTask = createAsyncThunk(
  'calendar/completeTask',
  async ({ id, notes }: { id: number; notes?: string }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/calendar-events/${id}/complete`, { notes });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка выполнения задачи');
    }
  }
);

const calendarEventsSlice = createSlice({
  name: 'calendarEvents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Загрузка всех задач
      .addCase(fetchAllTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Создание
      .addCase(createTask.fulfilled, (state, action) => {
        state.events.push(action.payload);
      })

      // Обновление
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.events.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })

      // Удаление
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.events = state.events.filter(e => e.id !== action.payload);
      })

      // Выполнение
      .addCase(completeTask.fulfilled, (state, action) => {
        const index = state.events.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      });
  },
});

export const { clearError } = calendarEventsSlice.actions;
export default calendarEventsSlice.reducer;