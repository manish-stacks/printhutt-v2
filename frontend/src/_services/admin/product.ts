import { axiosInstance } from "@/utils/axios";
import type { Product } from "@/lib/types/product";

export const add_new_product = async (formData: object) => {
  return axiosInstance.post(`/products`, formData)
}

export const get_all_products = async (page: string, search: string) => {
  return axiosInstance.get(`/products?page=${page}&search=${search}&limit=10`);
}

export const delete_a_product = async (id: string) => {
  return axiosInstance.delete(`/products/${id}`);
}

export const update_a_product = async (id: string, formData: object) => {
  return axiosInstance.put(`/products/${id}`, formData)
}

export const get_product_by_slug = async (slug: string): Promise<Product> => {
  return axiosInstance.get(`/products/slug/${slug}`);
}

export const get_product_by_id = async (id: string): Promise<Product> => {
  return axiosInstance.get(`/products/storefront/byId/${id}`);
}

export const get_product_by_category_id = async (id: string) => {
  return axiosInstance.get(`/products/by-category?id=${id}&limit=6`);
}

export const update_product_status = async (categoryId: string, newStatus: boolean) => {
  return axiosInstance.patch(`/products/${categoryId}`, {
    status: newStatus,
  });
}

export const removeProductImage = async (productId: string, imageToRemove: object) => {
  return axiosInstance.post(`/products/image-delete`, {
    productId: productId,
    image: imageToRemove,
  });
};


export const copy_product = async (id: string) => {
  return axiosInstance.post(`/products/${id}/copy`);
};