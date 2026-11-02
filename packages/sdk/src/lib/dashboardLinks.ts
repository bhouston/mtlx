import { coreEntityNameRegex } from './schemas.js';

// Comment hash allows alphanumeric IDs (e.g. numeric comment.id or string "test")
const commentHashRegex = '[a-zA-Z0-9][a-zA-Z0-9-]*';

// Validation regexes for dashboard link paths (include leading slash to match actual link format)
export const dashboardOrgLinkRegex = new RegExp(`^/${coreEntityNameRegex}$`);
export const dashboardProjectLinkRegex = new RegExp(`^/${coreEntityNameRegex}/${coreEntityNameRegex}$`);
export const dashboardAssetLinkRegex = new RegExp(
  `^/${coreEntityNameRegex}/${coreEntityNameRegex}/assets/${coreEntityNameRegex}$`,
);
export const dashboardAssetCommentLinkRegex = new RegExp(
  `^/${coreEntityNameRegex}/${coreEntityNameRegex}/assets/${coreEntityNameRegex}#comment-${commentHashRegex}$`,
);
export const dashboardSettingsInvitesLinkRegex = /^\/settings\/invites$/;

export const validDashboardLinkTargets: RegExp[] = [
  dashboardOrgLinkRegex,
  dashboardProjectLinkRegex,
  dashboardAssetLinkRegex,
  dashboardAssetCommentLinkRegex,
  dashboardSettingsInvitesLinkRegex,
];

function validateAndReturn(path: string, regex: RegExp): string {
  if (!regex.test(path)) {
    throw new Error(`Invalid dashboard link: ${path}`);
  }
  return path;
}

export function dashboardOrgLink({ orgName }: { orgName: string }): string {
  const path = `/${orgName}`;
  return validateAndReturn(path, dashboardOrgLinkRegex);
}

export function dashboardProjectLink({ orgName, projectName }: { orgName: string; projectName: string }): string {
  const path = `/${orgName}/${projectName}`;
  return validateAndReturn(path, dashboardProjectLinkRegex);
}

export function dashboardAssetLink({
  orgName,
  projectName,
  assetName,
}: {
  orgName: string;
  projectName: string;
  assetName: string;
}): string {
  const path = `/${orgName}/${projectName}/assets/${assetName}`;
  return validateAndReturn(path, dashboardAssetLinkRegex);
}

export function dashboardAssetCommentLink({
  orgName,
  projectName,
  assetName,
  commentHash,
}: {
  orgName: string;
  projectName: string;
  assetName: string;
  commentHash: string;
}): string {
  const path = `/${orgName}/${projectName}/assets/${assetName}#comment-${commentHash}`;
  return validateAndReturn(path, dashboardAssetCommentLinkRegex);
}

export function dashboardSettingsInvitesLink(): string {
  const path = '/settings/invites';
  return validateAndReturn(path, dashboardSettingsInvitesLinkRegex);
}
