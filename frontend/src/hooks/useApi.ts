// src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { API_ERROR_MESSAGES } from '../constants/api';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

type ApiMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

/**
 * Custom hook for making API requests with loading, error, and success states
 */
const useApi = <T = any>(initialState: T | null = null) => {
  const [state, setState] = useState<ApiState<T>>({
    data: initialState,
    loading: false,
    error: null,
  });

  const { showToast } = useToast();

  const request = useCallback(
    async (
      method: ApiMethod,
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
      options: UseApiOptions = {}
    ) => {
      const {
        showSuccessToast = false,
        showErrorToast = true,
        successMessage = 'Operation completed successfully',
        errorMessage,
      } = options;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let response: AxiosResponse<T>;

        switch (method) {
          case 'get':
            response = await api.get<T>(url, config);
            break;
          case 'post':
            response = await api.post<T>(url, data, config);
            break;
          case 'put':
            response = await api.put<T>(url, data, config);
            break;
          case 'delete':
            response = await api.delete<T>(url, config);
            break;
          case 'patch':
            response = await api.patch<T>(url, data, config);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        setState({
          data: response.data,
          loading: false,
          error: null,
        });

        if (showSuccessToast) {
          showToast(successMessage, 'success');
        }

        return response.data;
      } catch (err) {
        const error = err as AxiosError<{message?: string}>;
        const errorMsg = errorMessage ||
          error.response?.data?.message ||
          API_ERROR_MESSAGES.DEFAULT;

        setState({
          data: initialState,
          loading: false,
          error: errorMsg,
        });

        if (showErrorToast) {
          showToast(errorMsg, 'error');
        }

        throw error;
      }
    },
    [initialState, showToast]
  );

  const get = useCallback(
    (url: string, config?: AxiosRequestConfig, options?: UseApiOptions) =>
      request('get', url, undefined, config, options),
    [request]
  );

  const post = useCallback(
    (url: string, data?: any, config?: AxiosRequestConfig, options?: UseApiOptions) =>
      request('post', url, data, config, options),
    [request]
  );

  const put = useCallback(
    (url: string, data?: any, config?: AxiosRequestConfig, options?: UseApiOptions) =>
      request('put', url, data, config, options),
    [request]
  );

  const del = useCallback(
    (url: string, config?: AxiosRequestConfig, options?: UseApiOptions) =>
      request('delete', url, undefined, config, options),
    [request]
  );

  const patch = useCallback(
    (url: string, data?: any, config?: AxiosRequestConfig, options?: UseApiOptions) =>
      request('patch', url, data, config, options),
    [request]
  );

  const reset = useCallback(() => {
    setState({
      data: initialState,
      loading: false,
      error: null,
    });
  }, [initialState]);

  return {
    ...state,
    request,
    get,
    post,
    put,
    delete: del,
    patch,
    reset,
  };
};

export default useApi;