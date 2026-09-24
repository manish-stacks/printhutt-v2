
import { axiosInstance } from "@/utils/axios";
import type { ReturnPolicy } from "@/lib/types/return";


export async function getOfferPolicies(page: string, search: string) {
    return axiosInstance.get(`/offers?page=${page}&search=${search}&limit=10`);
}

export async function createOffer(formData: Partial<ReturnPolicy>) {
    return axiosInstance.post(`/offers`, formData)
}

export async function modifyOffer(id: string, formData: Partial<ReturnPolicy>) {
    return axiosInstance.put(`/offers/${id}`, formData)
}

export async function removeOffer(id: string) {
    return axiosInstance.delete(`/offers/${id}`);
}

export const get_all_offer = async () => {
    return axiosInstance.get(`/offers/all`)
}