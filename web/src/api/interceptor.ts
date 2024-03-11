import axios, { AxiosRequestConfig } from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 60000,
});

instance.interceptors.request.use((config) => {
  return config;
});

instance.interceptors.response.use((config) => {
  return config;
});

export const post = (url: string, data: any, config?: AxiosRequestConfig) =>
  instance.post(url, data, config);
