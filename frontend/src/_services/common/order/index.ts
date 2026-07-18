import { axiosInstance } from "@/utils/axios";
import { IOrder } from "@/lib/types/order";
import axios from "axios";


export const create_a_new_order = async (formData: IOrder) => {
  return axiosInstance.post(`/orders`, formData)
}

// export async function get_all_orders_of_user(page: string, search: string, status: string) {
//   return axiosInstance.get(`/orders?status=${status}&page=${page}&search=${search}&limit=10`);
// }
export async function get_all_orders_of_user(
  page: string,
  search = "",
  status = "",
  startDate = "",
  endDate = ""
) {
  return axiosInstance.get(`/orders`, {
    params: {
      page,
      limit: 10,
      search,
      status,
      startDate,
      endDate,
    },
  });
}



// ✅ NEW: Admin — filtered Excel export of orders (returns Blob)
export interface OrderExportFilters {
  search?: string;
  status?: string;                       // '' | 'all' | 'delivered' | 'cancelled,refunded'
  startDate?: string;
  endDate?: string;
  paymentType?: 'all' | 'online' | 'offline';
  paymentStatus?: 'all' | 'paid' | 'unpaid';
}

export async function export_orders_excel(filters: OrderExportFilters = {}) {
  return axiosInstance.get(`/orders/export/excel`, {
    params: {
      search: filters.search || '',
      status: filters.status || 'all',
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      paymentType: filters.paymentType || 'all',
      paymentStatus: filters.paymentStatus || 'all',
    },
    responseType: 'blob',
  });
}

export async function get_order_by_id(id: string) {
  return axiosInstance.get(`/orders/${id}`);
}
export async function get_pending_order_by_id(id: string) {
  return axiosInstance.get(`/orders/${id}/pending`);
}
interface IOrderDetails {
  _id: string;
  payAmt: number;
  orderId:string;
  user: {
    username: string;
    number: string;
    email: string;
  }
}
export async function initiate_Payment(order: IOrderDetails) {
  const data = {
    orderId: order._id,
    amount: order.payAmt,
    transactionId: order.orderId, //`txn_${Date.now()}`,
    userDetails: {
      name: order.user.username || 'user',
      email: order?.user?.email || 'admin@gmail.com',
      phone: order?.user?.number || '1234567890',
    },
  }
  return axiosInstance.post(`/payment/initiate`, data);
}


export const get_order_details = async (id: string) => {

  return axiosInstance.get(`/orders/${id}`)
}

// ✅ NEW: 100% coupon → payable 0. Gateway skip karke order ko free confirm karo (Bug #6).
export const confirm_free_order = async (orderMongoId: string) => {
  return axiosInstance.post(`/payment/free-order`, { _id: orderMongoId });
};