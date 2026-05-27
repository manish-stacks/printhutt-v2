import { axiosInstance } from "@/utils/axios";

export const wishlistService = {
    getAll: () => axiosInstance('/wishlist'),
    addWishlist: (id: string) => axiosInstance.post('/wishlist', { productId: id }),
    deleteWishlist: (id: string) => axiosInstance.delete(`/wishlist/${id}`),
};