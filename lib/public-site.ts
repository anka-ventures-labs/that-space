/** Public, non-secret settings used by the marketing surface. */
function normalizeUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}

function isEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export function getPublicSiteConfig() {
  const communityUrl = normalizeUrl(process.env.DISCOURSE_URL);
  const supportEmail = process.env.PUBLIC_SUPPORT_EMAIL?.trim() || undefined;
  const communityPublicRegistrationEnabled = isEnabled(
    process.env.COMMUNITY_PUBLIC_REGISTRATION_ENABLED,
  );

  return {
    communityUrl,
    communityPublicRegistrationEnabled,
    supportEmail,
    communityHref: communityUrl || "/",
    loginHref: communityUrl ? `${communityUrl}/login` : "/login",
    signupHref: communityUrl ? `${communityUrl}/signup` : "/signup",
    contactHref: supportEmail
      ? `mailto:${supportEmail}`
      : communityUrl
        ? `${communityUrl}/about`
        : "/contact",
  };
}
