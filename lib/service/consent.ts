import type { Member } from '@/lib/db/repo'
import { CONSENT_VERSION } from './copy'

/** Sample cards deliberately use the fixed `sample` consent marker. */
export function hasCurrentConsent(member: Pick<Member, 'consentVersion' | 'isSample'>): boolean {
  return member.isSample || member.consentVersion === CONSENT_VERSION
}
