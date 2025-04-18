
import { AxiosInstance, AxiosRequestConfig } from "axios";


export const safeAxiosPost = async (
    axiosClient: AxiosInstance,
    url: string,
    data: any,
    config?: AxiosRequestConfig
) => {
    try {
        await axiosClient.post(url, data, config);
    } catch (error: any) {
        console.error(`Audit log service failed for POST ${url}:`, error?.response?.data ?? error.message);
    }
};
