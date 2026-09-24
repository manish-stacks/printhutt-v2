import { axiosInstance } from "@/utils/axios";

export const userService = {
    updateProfile: (formdata: unknown) => axiosInstance.post('/users/me/profile', formdata),
};
