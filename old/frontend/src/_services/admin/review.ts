

import { axiosInstance } from "@/utils/axios";


export async function getReview(page: string, search: string) {
    return axiosInstance.get(`/reviews?page=${page}&search=${search}&limit=10`);
}

export async function deleteReview(id: string) {
    return axiosInstance.delete(`/reviews/${id}`);
}

