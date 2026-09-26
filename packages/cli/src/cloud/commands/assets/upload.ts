import { command as materialsCommand } from '../materials/upload.ts';

/**
 * Hidden alias: `mtlx-ai assets upload` behaves exactly like `mtlx-ai materials upload`,
 * kept for continuity with the pre-rename CLI.
 */
export const command = { ...materialsCommand, describe: false as const };
