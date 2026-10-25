// Theme settings are admin-editable; only a plain username is rendered.
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,59}$/i;

export function safeUsername(value) {
  const username = typeof value === "string" ? value.trim() : "";
  return USERNAME_PATTERN.test(username) ? username : null;
}
