
import { AxiosInstance, AxiosRequestConfig } from "axios";
import logger from "../config/logger";


export const safeAxiosPost = async (
    axiosClient: AxiosInstance,
    url: string,
    data: any,
    config?: AxiosRequestConfig
) => {
    try {
        await axiosClient.post(url, data, config);
    } catch (error: any) {
        logger.error(`Audit log service failed for POST ${url}:`, error?.response?.data ?? error.message);
    }
};
