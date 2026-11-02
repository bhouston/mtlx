import { command as materialsCommand } from '../materials/upload.ts';

/**
 * Hidden alias: `mtlx assets upload` behaves exactly like `mtlx materials upload`,
 * kept for continuity with the pre-rename CLI.
 */
export const command = { ...materialsCommand, describe: false as const };
