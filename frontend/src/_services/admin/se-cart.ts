import { axiosInstance } from '@/utils/axios';

export async function getAllSessionCarts(page: string | number, limit = 10) {
  return axiosInstance.get(`/cart?page=${page}&limit=${limit}`);
}

export async function bulkDeleteSessionCarts(ids: string[]) {
  return axiosInstance.post(`/cart/bulk-delete`, { ids });
}