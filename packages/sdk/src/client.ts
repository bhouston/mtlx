import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type * as z from 'zod';

import { makeUrl } from './lib/url.js';
import { refreshAccessToken } from './routes/auth.js';

export type ApiAuthType = 'frontendToken' | 'access-token' | 'session' | 'anonymous';

// CDN friendly as it puts the public key in the URL.
export type ApiAuthFrontendToken = {
  authType: 'frontendToken';
  frontendToken: string;
};

export type ApiAuthSecretToken = {
  authType: 'secretToken';
  secretToken: string;
};

export type ApiAuthUserSession = {
  authType: 'userSession';
  userSessionToken: string;
};

export type ApiAuthAnonymous = {
  authType: 'anonymous';
};

export type ApiAuth = ApiAuthFrontendToken | ApiAuthSecretToken | ApiAuthUserSession | ApiAuthAnonymous;

export type ApiClient = {
  axios: AxiosInstance;
  host: string;
  auth: ApiAuth;
  validateResults?: boolean;
};

export class ClientFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type ApiRequest = {
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
  init?: Omit<AxiosRequestConfig, 'url' | 'params'>;
};

const validateHost = (host: string) => {
  if (!host.includes('://')) {
    throw new Error(`host must include protocol, either http:// or https://, but it doesn't: ${host}`);
  }
};

const validatePath = (path: string) => {
  if (!path.startsWith('/api')) {
    throw new Error(`path must start with "api", but it does not: ${path}`);
  }
};

export type CreateInstanceParams = {
  host: string;
};

export type CreateFrontendTokenInstanceParams = CreateInstanceParams & {
  frontendToken: string;
};

export const createFrontendTokenInstance = ({ host, frontendToken }: CreateFrontendTokenInstanceParams): ApiClient => {
  validateHost(host);

  // CDN friendly as it puts the public key in the URL.
  const axiosInstance = axios.create({
    baseURL: host,
    params: {
      frontendToken,
    },
  });

  return {
    axios: axiosInstance,
    host,
    auth: {
      authType: 'frontendToken',
      frontendToken,
    },
  };
};

const createJWTInstance = (host: string, refreshToken: string, accessToken?: string) => {
  validateHost(host);

  const axiosInstance = axios.create({
    baseURL: host,
  });

  // Set initial access token if provided
  if (accessToken) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  }

  const refresh = async (config: InternalAxiosRequestConfig) => {
    const newAccessToken = await refreshAccessToken(host, {
      body: {
        refreshToken,
      },
    });
    config.headers.set('Authorization', `Bearer ${newAccessToken.accessToken}`);
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken.accessToken}`;
  };

  axiosInstance.interceptors.request.use(async (config) => {
    if (!config.headers.Authorization) {
      await refresh(config);
    }
    return config;
  });
  axiosInstance.interceptors.response.use(
    async (response) => response,
    async (error) => {
      const requestConfig = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

      // Only attempt refresh once per request
      if (error.response?.status === 401 && !requestConfig._retried) {
        requestConfig._retried = true;
        await refresh(requestConfig);
        // Retry the request once if refresh succeeded
        return axiosInstance(requestConfig);
      }

      throw error;
    },
  );

  return {
    axios: axiosInstance,
    host,
  };
};

export type CreateSecretTokenInstanceParams = CreateInstanceParams & {
  secretToken: string;
  accessToken?: string;
};

export const createSecretTokenInstance = ({
  host,
  secretToken,
  accessToken,
}: CreateSecretTokenInstanceParams): ApiClient => {
  validateHost(host);
  return {
    ...createJWTInstance(host, secretToken, accessToken),
    auth: {
      authType: 'secretToken',
      secretToken,
    },
  };
};

export type CreateSessionInstanceParams = CreateInstanceParams & {
  userSessionToken: string;
  accessToken?: string;
};

export const createSessionInstance = ({
  host,
  userSessionToken,
  accessToken,
}: CreateSessionInstanceParams): ApiClient => {
  validateHost(host);
  return {
    ...createJWTInstance(host, userSessionToken, accessToken),
    auth: {
      authType: 'userSession',
      userSessionToken,
    },
  };
};

export type CreateAnonymousClientParams = CreateInstanceParams;

export const createAnonymousClient = ({ host }: CreateAnonymousClientParams): ApiClient => {
  validateHost(host);
  return {
    axios: axios.create({
      baseURL: host,
    }),
    host,
    auth: {
      authType: 'anonymous',
    },
  };
};

export const clientFetchUrl = (client: ApiClient, request: ApiRequest) => {
  validatePath(request.path);

  let params = request.params;
  if (client.auth.authType === 'frontendToken') {
    params = { ...params, frontendToken: client.auth.frontendToken };
  }

  return makeUrl(client.host, request.path, params);
};

export const clientFetch = async (client: ApiClient, request: ApiRequest) => {
  validatePath(request.path);

  return await client.axios.request({
    ...request.init,
    url: request.path,
    params: request.params,
  });
};

// Re-export parseResult from lib to maintain backward compatibility
// This breaks the circular dependency since routes/auth.ts imports from lib/parseResult.ts directly
import { parseResultWithClient } from './lib/parseResult.js';

/**
 * Conditionally parses API response data using a zod schema.
 * If client.validateResults is true, validates and parses the data.
 * Otherwise, returns the data with a type assertion based on the schema's inferred type.
 *
 * @param client - The API client instance (unused, kept for backward compatibility)
 * @param schema - The zod schema to use for validation/type inference
 * @param data - The raw response data to parse
 * @returns The parsed or type-asserted data matching the schema's inferred type
 */
export const parseResult = <T extends z.ZodTypeAny>(client: ApiClient, schema: T, data: unknown): z.infer<T> =>
  parseResultWithClient(client, schema, data);
