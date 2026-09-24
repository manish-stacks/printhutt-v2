import { axiosInstance } from "@/utils/axios";

export async function getAllCatPagination(page: string, search: string) {
  return axiosInstance.get(`/categories?page=${page}&search=${search}&limit=10`);
}

export const add_new_category = async (formData: object) => {
  return axiosInstance.post(`/categories`, formData);
};

export const get_parent_categories = async () => {
  return axiosInstance.get("/categories/fetch");
};

// export const get_all_categories = async () => {
//   return axiosInstance.get('/category');
// }

export const delete_categories = async (id: string) => {
  return axiosInstance.delete(`/categories/${id}`);
};

export const get_category_by_id = async (id: string) => {
  return axiosInstance.get(`/categories/${id}`);
};

export const update_category = async (id: string, formData: object) => {
  return axiosInstance.put(`/categories/${id}`, formData);
};

export const update_category_status = async (
  categoryId: string,
  newStatus: boolean,
  field: string
) => {
  return axiosInstance.patch(`/categories/${categoryId}`, {
    status: newStatus,
    field: field,
  });
};
