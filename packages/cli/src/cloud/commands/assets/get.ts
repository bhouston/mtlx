import { command as materialsCommand } from '../materials/get.ts';

/**
 * Hidden alias: `mtlx-ai assets get` behaves exactly like `mtlx-ai materials get`,
 * kept for continuity with the pre-rename CLI.
 */
export const command = { ...materialsCommand, describe: false as const };
