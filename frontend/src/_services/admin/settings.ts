import { axiosInstance } from '@/utils/axios';

export interface Setting {
  key: string;
  value: unknown;
  type?: 'string' | 'number' | 'boolean' | 'json' | 'html' | 'image';
  group?: string;
  label?: string;
  description?: string;
}

export const settingsService = {
  publicAll: () => axiosInstance.get(`/settings`),
  adminAll: () => axiosInstance.get(`/settings/admin`),
  byKey: (key: string) => axiosInstance.get(`/settings/${key}`),
  bulkUpsert: (settings: Setting[]) =>
    axiosInstance.post(`/settings/bulk`, { settings }),
  uploadImage: (key: string, formData: FormData) =>
    axiosInstance.post(`/settings/upload`, formData),
  delete: (key: string) => axiosInstance.delete(`/settings/${key}`),
};