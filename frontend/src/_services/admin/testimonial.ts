
import { ITestimonial } from "@/lib/types";
import { axiosInstance } from "@/utils/axios";


export async function getTestimonial(page: string, search: string) {
    return axiosInstance.get(`/testimonials?page=${page}&search=${search}&limit=10`);
}

export async function createTestimonial(formData: Partial<ITestimonial>) {
    return axiosInstance.post(`/testimonials`, formData)
}

export async function updateTestimonial(id: string, formData: Partial<ITestimonial>) {
    return axiosInstance.put(`/testimonials/${id}`, formData)
}

export async function deleteTestimonial(id: string) {
    return axiosInstance.delete(`/testimonials/${id}`);
}

