import { axiosInstance } from '@/utils/axios';

export interface DbCartItemPayload {
  productId: string;
  variantId?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  discountType?: string;
  discountPrice?: number;
  custom_data?: Record<string, unknown>;
}

export const userCartService = {
  get: () => axiosInstance.get(`/usercart`),
  add: (item: DbCartItemPayload) => axiosInstance.post(`/usercart/add`, item),
  updateQty: (itemId: string, quantity: number) =>
    axiosInstance.patch(`/usercart/item`, { itemId, quantity }),
  remove: (itemId: string) => axiosInstance.delete(`/usercart/item/${itemId}`),
  clear: () => axiosInstance.delete(`/usercart`),
  merge: (items: DbCartItemPayload[]) =>
    axiosInstance.post(`/usercart/merge`, { items }),
  sync: (items: DbCartItemPayload[]) => axiosInstance.post(`/usercart/sync`, { items }),
};