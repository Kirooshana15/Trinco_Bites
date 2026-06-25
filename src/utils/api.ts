import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "https://trincobites-backend.onrender.com/api";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  try {
    const response = await axios({
      url: `${API_BASE_URL}${path}`,
      method: (options.method ?? "GET") as any,
      headers,
      data: options.body,
    });

    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const data = error.response?.data as any;

      if (status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new Event("unauthorized"));
      }

      throw new ApiError(
        data?.message ?? error.message ?? "Something went wrong. Please try again.",
        status
      );
    }

    throw new ApiError("Something went wrong. Please try again.", 500);
  }
}

