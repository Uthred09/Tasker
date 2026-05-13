import { API_URL } from "@/config/env";
import { useAuth } from "@clerk/clerk-react";
import { apiContract } from "@tasker/openapi/contracts";
import { initClient } from "@ts-rest/core";
import axios, {
  type Method,
  AxiosError,
  isAxiosError,
  type AxiosResponse,
} from "axios";

type Headers = Awaited<
  ReturnType<NonNullable<Parameters<typeof initClient>[1]["api"]>>
>["headers"];

export type TApiClient = ReturnType<typeof useApiClient>;

export const useApiClient = ({ isBlob = false }: { isBlob?: boolean } = {}) => {
  const { getToken } = useAuth();

  return initClient(apiContract, {
    baseUrl: "",
    baseHeaders: {
      "Content-Type": "application/json",
    },
    api: async ({ path, method, headers, body }) => {
      const token = await getToken();

      // Build request data — convert to FormData if body contains a File
      let data: FormData | unknown = body;
      const requestHeaders: Record<string, string> = { ...headers } as Record<
        string,
        string
      >;
      if (body && typeof body === "object") {
        const hasFile = Object.values(body as Record<string, unknown>).some(
          (v) => v instanceof File || v instanceof Blob,
        );
        if (hasFile) {
          const formData = new FormData();
          for (const [key, value] of Object.entries(
            body as Record<string, unknown>,
          )) {
            formData.append(key, value as string | Blob);
          }
          data = formData;
          // Let the browser set Content-Type with the correct boundary
          delete requestHeaders["Content-Type"];
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const makeRequest = async (retryCount = 0): Promise<any> => {
        // Refresh token on retries in case it expired
        const currentToken = retryCount > 0 ? await getToken() : token;
        try {
          const result = await axios.request({
            method: method as Method,
            url: `${API_URL}/api${path}`,
            headers: {
              ...requestHeaders,
              ...(currentToken
                ? { Authorization: `Bearer ${currentToken}` }
                : {}),
            },
            data,
            ...(isBlob ? { responseType: "blob" } : {}),
          });
          return {
            status: result.status,
            body: result.data,
            headers: result.headers as unknown as Headers,
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: Error | AxiosError | any) {
          if (isAxiosError(e)) {
            const error = e as AxiosError;
            const response = error.response as AxiosResponse;

            // If unauthorized and we haven't retried yet, retry
            if (response?.status === 401 && retryCount < 2) {
              return makeRequest(retryCount + 1);
            }

            return {
              status: response?.status || 500,
              body: response?.data || { message: "Internal server error" },
              headers: (response?.headers as unknown as Headers) || {},
            };
          }
          throw e;
        }
      };

      return makeRequest();
    },
  });
};
