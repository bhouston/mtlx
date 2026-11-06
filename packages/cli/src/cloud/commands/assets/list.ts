import { command as materialsCommand } from '../materials/list.ts';

/**
 * Hidden alias: `mtlx-ai assets list` behaves exactly like `mtlx-ai materials list`,
 * kept for continuity with the pre-rename CLI.
 */
export const command = { ...materialsCommand, describe: false as const };
