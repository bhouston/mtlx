import { command as materialsCommand } from '../materials/get.ts';

/**
 * Hidden alias: `mtlx assets get` behaves exactly like `mtlx materials get`,
 * kept for continuity with the pre-rename CLI.
 */
export const command = { ...materialsCommand, describe: false as const };
