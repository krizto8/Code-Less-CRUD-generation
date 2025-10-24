import { create } from 'zustand';
import { ModelDefinition } from '../types';
import api from '../lib/api';

interface ModelState {
  models: ModelDefinition[];
  currentModel: ModelDefinition | null;
  isLoading: boolean;
  fetchModels: () => Promise<void>;
  fetchModel: (name: string) => Promise<void>;
  createModel: (model: ModelDefinition) => Promise<void>;
  updateModel: (name: string, model: ModelDefinition) => Promise<void>;
  deleteModel: (name: string) => Promise<void>;
}

export const useModelStore = create<ModelState>((set) => ({
  models: [],
  currentModel: null,
  isLoading: false,

  fetchModels: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/models');
      set({ models: response.data.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchModel: async (name: string) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/models/${name}`);
      set({ currentModel: response.data.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createModel: async (model: ModelDefinition) => {
    const response = await api.post('/models', model);
    set((state) => ({
      models: [...state.models, response.data.data],
    }));
  },

  updateModel: async (name: string, model: ModelDefinition) => {
    const response = await api.put(`/models/${name}`, model);
    set((state) => ({
      models: state.models.map((m) =>
        m.name === name ? response.data.data : m
      ),
    }));
  },

  deleteModel: async (name: string) => {
    await api.delete(`/models/${name}`);
    set((state) => ({
      models: state.models.filter((m) => m.name !== name),
    }));
  },
}));
