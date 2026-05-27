import { axiosInstance } from "@/utils/axios";


export const personalizedGiftService = {
    all: () => axiosInstance.get("/personalized-gifts/storefront"),
    getAll: (sectionType: string) => axiosInstance.get(`/personalized-gifts/storefront?sectionType=${sectionType}`),
    create: (data: FormData) => axiosInstance.post("/personalized-gifts/storefront", data),
    delete: (id: string) => axiosInstance.delete(`/personalized-gifts/${id}`),
    update: (id: string, data: FormData) => axiosInstance.put(`/personalized-gifts/${id}`, data),
};