import type { ApiClient } from '../client.js';

const errorPath = () => '/health/error';

/**
 * Throws a test error for error handling testing.
 *
 * @operationId health-error
 * @param client - The API client instance
 * @returns Promise resolving to void
 */
export const errorCheck = async (client: ApiClient): Promise<void> => {
  await client.axios.get(errorPath());
};
