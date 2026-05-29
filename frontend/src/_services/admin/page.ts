import { axiosInstance } from '@/utils/axios';

export interface PageData {
  _id?: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  updatedAt?: string;
}

export const pageService = {
  list: () => axiosInstance.get<{ success: boolean; pages: PageData[] }>(`/pages`),
  getBySlug: (slug: string) =>
    axiosInstance.get<{ success: boolean; page: PageData }>(`/pages/${slug}`),
  update: (slug: string, data: Partial<PageData>) =>
    axiosInstance.put(`/pages/${slug}`, data),
};