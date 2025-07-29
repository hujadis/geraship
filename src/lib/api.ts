// API configuration utility
const API_BASE_URL = import.meta.env.PROD ? "http://159.65.127.209" : "";

export const getApiUrl = (endpoint: string): string => {
  if (import.meta.env.PROD) {
    return `${API_BASE_URL}${endpoint}`;
  }
  // In development, use the proxy
  return endpoint;
};

export const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const url = getApiUrl(endpoint);

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...(options || {}),
  };

  return fetch(url, defaultOptions);
};
