
import { axiosInstance } from "@/utils/axios";
import type { Coupon } from "@/lib/types/coupon";


export async function getAllCouponsPagination(page: string, search: string) {
  return axiosInstance.get(`/coupons?page=${page}&search=${search}&limit=10`);
}

export async function addNewCoupon(formData: Partial<Coupon>) {
  return axiosInstance.post(`/coupons`, formData)
}

export async function updateCoupon(id: string, formData: Partial<Coupon>) {
  return axiosInstance.put(`/coupons/${id}`, formData);
}

export async function deleteCoupon(id: string) {
  return axiosInstance.delete(`/coupons/${id}`);
}

export async function validateCoupon(code: string) {
  return axiosInstance.post(`/coupons/apply`, { code });
}

// ✅ NEW: checkout par coupon validate karo (storefront endpoint, admin perms nahi).
//    Server-side hi active/expire/limit/min-purchase sab check hota hai (Bug #4 + #7).
//    Returns: { valid, message, coupon, discount }
export async function checkCouponByCode(code: string, cartTotal: number) {
  return axiosInstance.post(`/coupons/validate`, { code, cartTotal });
}