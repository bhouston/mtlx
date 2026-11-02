import { command as materialsCommand } from '../materials/download.ts';

/**
 * Hidden alias: `mtlx assets download` behaves exactly like `mtlx materials download`,
 * kept for continuity with the pre-rename CLI.
 */
export const command = { ...materialsCommand, describe: false as const };
