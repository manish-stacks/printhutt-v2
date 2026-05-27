import { axiosInstance } from "@/utils/axios";
interface BlogCategory {
  name: string;
  isActive: boolean;
}
export const blogCategoryService = {
  getAll: (page: string, search: string) => axiosInstance.get(`/blog-categories?page=${page}&search=${search}&limit=10`),
  create: (formData: BlogCategory) => axiosInstance.post(`/blog-categories`, formData),
  update: (id: string, formData: BlogCategory) => axiosInstance.put(`/blog-categories/${id}`, formData),
  delete: (id: string) => axiosInstance.delete(`/blog-categories/${id}`),
};


export const blogService = {
  getAll: (page: string, search: string) => axiosInstance.get(`/blogs?page=${page}&search=${search}&limit=10`),
  create: (formData: BlogCategory) => axiosInstance.post(`/blogs`, formData),
  getBlog: (id: string) => axiosInstance.get(`/blogs/${id}`),
  update: (id: string, formData: BlogCategory) => axiosInstance.put(`/blogs/${id}`, formData),
  delete: (id: string) => axiosInstance.delete(`/blogs/${id}`),
  update_status: (blogId: string, newStatus: boolean) => axiosInstance.patch(`/blogs/${blogId}`, { status: newStatus, })
};

