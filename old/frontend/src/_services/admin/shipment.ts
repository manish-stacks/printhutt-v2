import { axiosInstance } from '@/utils/axios';

export const shipmentService = {
  create: (data: {
    orderId: string;
    provider: 'fship' | 'shiprocket' | 'velocity';
    shipmentDetails: {
      length: string | number;
      width: string | number;
      height: string | number;
      weight: string | number;
    };
  }) => axiosInstance.post(`/shipping/create`, data),

  cancel: (orderId: string) => axiosInstance.post(`/shipping/cancel/${orderId}`),

  track: (provider: 'fship' | 'shiprocket' | 'velocity', waybill: string) =>
    axiosInstance.get(`/shipping/track/${provider}/${waybill}`),
};