import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface Pet {
  id: number;
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  photo_url?: string;
  weight?: number;
  notes?: string;
}

interface PetsState {
  pets: Pet[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PetsState = {
  pets: [],
  isLoading: false,
  error: null,
};

export const fetchPets = createAsyncThunk('pets/fetchPets', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/pets');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки питомцев');
  }
});

export const createPet = createAsyncThunk(
  'pets/createPet',
  async (petData: FormData, { rejectWithValue }) => {
    try {
      const response = await api.post('/pets', petData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания питомца');
    }
  }
);

export const deletePet = createAsyncThunk(
  'pets/deletePet',
  async (petId: number, { rejectWithValue }) => {
    try {
      await api.delete(`/pets/${petId}`);
      return petId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления питомца');
    }
  }
);

export const updatePet = createAsyncThunk(
  'pets/updatePet',
  async ({ petId, formData }: { petId: number; formData: FormData }, { rejectWithValue }) => {
    try {
      
      formData.append('_method', 'PUT');

      const response = await api.post(`/pets/${petId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления питомца');
    }
  }
);

const petsSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pets = action.payload;
      })
      .addCase(fetchPets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createPet.fulfilled, (state, action) => {
        state.pets.push(action.payload);
      })
      .addCase(updatePet.fulfilled, (state, action) => {
        const index = state.pets.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.pets[index] = action.payload;
        }
      })
      .addCase(deletePet.fulfilled, (state, action) => {
        state.pets = state.pets.filter(pet => pet.id !== action.payload);
      });
  },
});

export const { clearError } = petsSlice.actions;
export default petsSlice.reducer;