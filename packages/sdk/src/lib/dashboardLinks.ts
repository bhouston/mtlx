import { coreEntityNameRegex } from './schemas.js';

// Comment hash allows alphanumeric IDs (e.g. numeric comment.id or string "test")
const commentHashRegex = '[a-zA-Z0-9][a-zA-Z0-9-]*';

// Validation regexes for dashboard link paths (include leading slash to match actual link format)
export const dashboardUserLinkRegex = new RegExp(`^/${coreEntityNameRegex}$`);
export const dashboardAssetLinkRegex = new RegExp(`^/${coreEntityNameRegex}/${coreEntityNameRegex}$`);
export const dashboardAssetCommentLinkRegex = new RegExp(
  `^/${coreEntityNameRegex}/${coreEntityNameRegex}#comment-${commentHashRegex}$`,
);
export const dashboardSettingsInvitesLinkRegex = /^\/settings\/invites$/;

export const validDashboardLinkTargets: RegExp[] = [
  dashboardUserLinkRegex,
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

export function dashboardUserLink({ userName }: { userName: string }): string {
  const path = `/${userName}`;
  return validateAndReturn(path, dashboardUserLinkRegex);
}

export function dashboardAssetLink({ userName, assetName }: { userName: string; assetName: string }): string {
  const path = `/${userName}/${assetName}`;
  return validateAndReturn(path, dashboardAssetLinkRegex);
}

export function dashboardAssetCommentLink({
  userName,
  assetName,
  commentHash,
}: {
  userName: string;
  assetName: string;
  commentHash: string;
}): string {
  const path = `/${userName}/${assetName}#comment-${commentHash}`;
  return validateAndReturn(path, dashboardAssetCommentLinkRegex);
}

export function dashboardSettingsInvitesLink(): string {
  const path = '/settings/invites';
  return validateAndReturn(path, dashboardSettingsInvitesLinkRegex);
}
