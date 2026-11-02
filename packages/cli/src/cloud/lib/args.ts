import * as sdk from 'mtlx-sdk';
import { getOrg, getProject } from './config-defaults.ts';

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
 * still refer to a specific material by name (the owning org/project come from --org/--project).
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
 * Get org and project option definitions with dynamic defaults (from `mtlx config set --org --project`).
 * Not marked demandOption because some commands accept an `<org>/<project>/<name>` positional instead;
 * commands that always need them call `requireOrgProject()` on the resolved values.
 * @returns Option object that can be spread into .options()
 */
export const getOrgProjectOptions = () => {
  const org = getOrg();
  const project = getProject();
  return {
    org: {
      type: 'string' as const,
      description: 'Organization name',
      ...(org ? { default: org } : {}),
    },
    project: {
      type: 'string' as const,
      description: 'Project name',
      ...(project ? { default: project } : {}),
    },
  } as const;
};

/**
 * Ensures an org is present, throwing a helpful error otherwise (e.g. API tokens, where project is optional).
 */
export function requireOrg(org: string | undefined): string {
  if (!org) {
    throw new Error('No org specified. Pass --org or run `mtlx config set --org <org>`.');
  }
  return org;
}

/**
 * Ensures an org and project are present, throwing a helpful error otherwise.
 * Used by commands that require them (e.g. upload) but don't accept an `<org>/<project>/<name>` positional.
 */
export function requireOrgProject(
  org: string | undefined,
  project: string | undefined,
): { orgName: string; projectName: string } {
  if (!(org && project)) {
    throw new Error(
      'No org/project specified. Pass --org and --project or run `mtlx config set --org <org> --project <project>`.',
    );
  }
  return { orgName: org, projectName: project };
}

/**
 * Resolves an `<org>/<project>/<name>` style argument (or a bare `<name>`), falling back to the
 * --org/--project/--name flags for whatever the positional doesn't specify.
 * @param positional - The `<org>/<project>/<name>` or `<name>` positional argument, if given
 * @param orgFlag - The --org flag value, if given (may come from the config default)
 * @param projectFlag - The --project flag value, if given (may come from the config default)
 * @param nameFlag - The --name flag value, if given
 */
export function resolveAssetRef(
  positional: string | undefined,
  orgFlag: string | undefined,
  projectFlag: string | undefined,
  nameFlag: string | undefined,
): { orgName: string; projectName: string; name: string } {
  const parts = positional?.split('/') ?? [];
  if (parts.length === 3) {
    const [orgName = '', projectName = '', name = ''] = parts;
    return { orgName, projectName, name };
  }
  if (parts.length > 1) {
    throw new Error(`Expected <org>/<project>/<name>, got "${positional}"`);
  }
  const name = parts[0] ?? nameFlag;
  if (!name) {
    throw new Error('Provide <org>/<project>/<name>, or --name with --org and --project');
  }
  return { ...requireOrgProject(orgFlag, projectFlag), name };
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
