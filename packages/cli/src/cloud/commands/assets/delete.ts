import { command as materialsCommand } from '../materials/delete.ts';

/**
 * Hidden alias: `mtlx assets delete` behaves exactly like `mtlx materials delete`,
 * kept for continuity with the pre-rename CLI.
 */
export const command = { ...materialsCommand, describe: false as const };
