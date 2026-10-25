/** Public, non-secret settings used by the marketing surface. */
function normalizeUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}

function isEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export function getPublicSiteConfig() {
  const configuredCommunityUrl = normalizeUrl(process.env.DISCOURSE_URL);
  const communityUrl = isEnabled(process.env.PUBLIC_COMMUNITY_LINK_ENABLED)
    ? configuredCommunityUrl
    : "";
  const publicRegistrationEnabled = Boolean(communityUrl) && isEnabled(
    process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED,
  );
  const supportEmail = process.env.PUBLIC_SUPPORT_EMAIL?.trim() || undefined;

  return {
    communityUrl,
    publicRegistrationEnabled,
    supportEmail,
    loginHref: communityUrl ? `${communityUrl}/login` : undefined,
    signupHref: publicRegistrationEnabled ? `${communityUrl}/signup` : "/contact",
    contactHref: supportEmail
      ? `mailto:${supportEmail}`
      : "/contact",
  };
}
