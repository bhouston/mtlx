import { command as materialsCommand } from '../materials/update.ts';

/**
 * Hidden alias: `mtlx-ai assets update` behaves exactly like `mtlx-ai materials update`,
 * kept for continuity with the pre-rename CLI.
 */
export const command = { ...materialsCommand, describe: false as const };
