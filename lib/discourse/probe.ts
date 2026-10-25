/** A malformed successful response must be reported as a failed probe, not crash it. */
export function jsonObject(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text)
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
  } catch {
    return null
  }
}
