import { axiosInstance } from "@/utils/axios";


export async function getAllsub_CatPagination(page: string, search: string) {
  return axiosInstance.get(`/subcategories?page=${page}&search=${search}&limit=10`);
}

export const add_new_sub_category = async (formData: object) => {
  return axiosInstance.post(`/subcategories`, formData)
}


export const get_parent_sub_categories = async (id: string) => {
  return axiosInstance.post('/subcategories/fetch', { id: id });
}

export const get_all_sub_categories = async () => {
  return axiosInstance.get('/sub-category');
}

export const delete_sub_categories = async (id: string) => {
  return axiosInstance.delete(`/subcategories/${id}`);
};

export const get_sub_category_by_id = async (id: string) => {
  return axiosInstance.get(`/subcategories/${id}`)
}

export const update_sub_category = async (id: string, formData: object) => {
  return axiosInstance.put(`/subcategories/${id}`, formData)
}

export const update_sub_category_status = async (categoryId: string, newStatus: boolean) => {
  return axiosInstance.patch(`/subcategories/${categoryId}`, {
    status: newStatus,
  });
}





