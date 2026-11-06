import * as sdk from 'mtlx-sdk';
import { getUser } from './config-defaults.ts';

/**
 * Format types for output.
 */
export const FormatType = ['json', 'yaml', 'csv'] as const;
export type FormatType = (typeof FormatType)[number];

/**
 * Option definition objects for use with .options() spread pattern.
 * These can be spread into yargs.options() calls for a cleaner syntax.
 */

/**
 * Get asset option definition (required). Used by comment/api-token commands that
 * still refer to a specific material by name (the owning user comes from --user).
 * @returns Option object that can be spread into .options()
 */
export const getAssetRequiredOption = () =>
  ({
    asset: {
      type: 'string' as const,
      description: 'Material name',
      demandOption: true as const,
    },
  }) as const;

/**
 * Get asset visibility option definition (optional).
 * @returns Option object that can be spread into .options()
 */
export const getAssetVisibilityOption = () =>
  ({
    visibility: {
      type: 'string' as const,
      choices: sdk.Enums.AssetVisibility,
      description: 'Material visibility',
    },
  }) as const;

/**
 * Get license option definition.
 * @returns Option object that can be spread into .options()
 */
export const getLicenseOption = () =>
  ({
    license: {
      type: 'string' as const,
      description: 'Share license',
      choices: sdk.Enums.ShareLicense,
    },
  }) as const;

/**
 * Get user option definition with dynamic default handling (from `mtlx-ai config set --user`).
 * Not marked demandOption because some commands accept a `<user>/<name>` positional instead;
 * commands that always need it call `requireUser()` on the resolved value.
 * @returns Option object that can be spread into .options()
 */
export const getUserOption = () => {
  const user = getUser();
  return {
    user: {
      type: 'string' as const,
      description: 'User name',
      ...(user ? { default: user } : {}),
    },
  } as const;
};

/**
 * Ensures a user name is present, throwing a helpful error otherwise.
 * Used by commands that require a user (e.g. upload) but don't accept a `<user>/<name>` positional.
 */
export function requireUser(user: string | undefined): string {
  if (!user) {
    throw new Error('No user specified. Pass --user <name> or run `mtlx-ai config set --user <name>`.');
  }
  return user;
}

/**
 * Resolves a `<user>/<name>` style argument, falling back to separate --user/--name flags.
 * @param positional - The `<user>/<name>` positional argument, if given
 * @param userFlag - The --user flag value, if given (may come from the config default)
 * @param nameFlag - The --name flag value, if given
 * @param nameLabel - Label used in error messages for the second half (e.g. "name")
 */
export function resolveUserAndName(
  positional: string | undefined,
  userFlag: string | undefined,
  nameFlag: string | undefined,
  nameLabel = 'name',
): { userName: string; name: string } {
  if (positional) {
    const slashIndex = positional.indexOf('/');
    if (slashIndex === -1) {
      throw new Error(`Expected <user>/<${nameLabel}>, got "${positional}"`);
    }
    return { userName: positional.slice(0, slashIndex), name: positional.slice(slashIndex + 1) };
  }
  if (!userFlag || !nameFlag) {
    throw new Error(`Provide <user>/<${nameLabel}> or both --user and --${nameLabel}`);
  }
  return { userName: userFlag, name: nameFlag };
}

/**
 * Direct option definition objects for use with .options() spread pattern.
 * These are simple constant objects that can be spread directly.
 */

/**
 * Description option definition.
 */
export const descriptionOption = {
  description: {
    type: 'string' as const,
    description: 'Description',
  },
} as const;

/**
 * Metadata option definition.
 * Accepts a string (max 10240 characters) for metadata.
 */
export const metadataOption = {
  metadata: {
    type: 'string' as const,
    description: 'Metadata as a string (max 10240 characters)',
  },
} as const;

/**
 * Format option definition.
 */
export const formatOption = {
  format: {
    alias: 'f',
    type: 'string' as const,
    choices: FormatType,
    description: `Output format`,
    default: 'json' as const,
  },
} as const;

/**
 * Pagination option definitions.
 */
export const paginationOption = {
  'page-offset': {
    type: 'number' as const,
    description: 'Page offset for pagination',
    default: 0 as const,
  },
  'page-size': {
    type: 'number' as const,
    description: 'Page size for pagination',
    default: 20 as const,
  },
} as const;

/**
 * Text option definition (required).
 */
export const textOption = {
  text: {
    type: 'string' as const,
    description: 'Comment text',
    demandOption: true as const,
  },
} as const;
