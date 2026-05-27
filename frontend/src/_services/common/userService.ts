import { axiosInstance } from "@/utils/axios";

export const userService = {
    updateProfile: (formdata) => axiosInstance.post('/users/mes/update-profile', formdata),
};