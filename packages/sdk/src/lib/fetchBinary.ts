import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import type { BinaryResponse, BinaryResponseType } from './types.js';
import { defaultBinaryResponse } from './types.js';

/**
 * In Node.js, axios returns a Buffer for responseType: 'arraybuffer'.
 * Normalize to a real ArrayBuffer so callers get the type they asked for.
 */
function ensureArrayBuffer(data: ArrayBuffer | Buffer): ArrayBuffer {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
    const buf = data;
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    return ab as ArrayBuffer;
  }
  return data as ArrayBuffer;
}

/**
 * Performs a GET request with a binary response type and normalizes the result.
 * When binaryResponse is 'arraybuffer', converts Node.js Buffer to ArrayBuffer
 * so callers receive the same type in both Node and browser.
 *
 * @param axiosInstance - The axios instance to use
 * @param url - Request URL
 * @param config - Axios request config (params, maxRedirects, etc.). responseType is set from binaryResponse.
 * @param binaryResponse - Desired binary response type ('arraybuffer' | 'stream' | 'blob'). Defaults to blob in browser, stream in Node.
 * @returns The axios response with response.data typed as BinaryResponseType<T> and normalized when T is 'arraybuffer'
 */
export async function fetchBinary<T extends BinaryResponse>(
  axiosInstance: AxiosInstance,
  url: string,
  config: Omit<AxiosRequestConfig, 'responseType'>,
  binaryResponse = defaultBinaryResponse<T>(),
): Promise<AxiosResponse<BinaryResponseType<T>>> {
  const response = await axiosInstance.get(url, {
    ...config,
    responseType: binaryResponse,
  });
  if (binaryResponse === 'arraybuffer' && response.data !== null) {
    response.data = ensureArrayBuffer(response.data as ArrayBuffer | Buffer) as BinaryResponseType<T>;
  }
  return response as AxiosResponse<BinaryResponseType<T>>;
}
