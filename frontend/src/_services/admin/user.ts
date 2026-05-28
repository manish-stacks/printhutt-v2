import { axiosInstance } from '@/utils/axios';

export async function getAllUsers(page: string, search: string) {
  return axiosInstance.get(`/users?page=${page}&search=${search}&limit=10`);
}

export async function getUserFullDetail(id: string) {
  return axiosInstance.get(`/users/${id}/full`);
}

export async function toggleUserBlock(id: string, isBlocked: boolean) {
  return axiosInstance.patch(`/users/${id}/block`, { isBlocked });
}
export async function exportUsersExcel(search = '') {
  return axiosInstance.get(`/users/export/excel?search=${search}`, {
    responseType: 'blob',
  });
}