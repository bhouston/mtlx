import { command as materialsCommand } from '../materials/download.ts';

/**
 * Hidden alias: `mtlx-ai assets download` behaves exactly like `mtlx-ai materials download`,
 * kept for continuity with the pre-rename CLI.
 */
export const command = { ...materialsCommand, describe: false as const };
