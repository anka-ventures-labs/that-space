/**
 * Repository: thin SQL over the Bà Mối schema, returning camelCase objects
 * through quoted aliases. Idempotency comes from unique constraints plus
 * INSERT ... ON CONFLICT. Casts keep results identical under postgres.js and
 * PGlite (numeric -> float8, date -> text, counts -> int). jsonb parameters
 * are plain values: postgres.js encodes them from the server-described type.
 */
import type { Db } from './db'
import type { DerivedProfile } from '@/lib/matching/derive'
import { orderedKey, pairKey, type Exclusions } from '@/lib/matching/filters'
import { initialOf } from '@/lib/matching/privacy'
import type { Tier } from '@/lib/matching/score'
import type {
  Children, Gender, Intent, MaritalStatus, PoolCard, Seeking, WantsChildren,
} from '@/lib/matching/types'

const iso = (at: Date) => at.toISOString()

/** Serializes every write about one pair of members (interest, response, match). */
async function lockPair(tx: Db, a: string, b: string): Promise<void> {
  await tx.query(`select pg_advisory_xact_lock(hashtext($1))`, [`pair:${pairKey(a, b)}`])
}

/** Serializes a member's read-count-write daily quota decisions. */
export async function lockMemberQuota(tx: Db, memberId: string): Promise<void> {
  await tx.query(`select pg_advisory_xact_lock(hashtext($1))`, [`quota:${memberId}`])
}

// ── Members ────────────────────────────────────────────────────────────────

export type MemberStatus = 'active' | 'paused'

export interface Member {
  id: string
  discourseUserId: number | null
  discourseUsername: string | null
  displayName: string | null
  personaTopicId: number | null
  status: MemberStatus
  consentVersion: string | null
  optedInAt: Date | null
  isSample: boolean
}

const MEMBER_COLS = `id, discourse_user_id as "discourseUserId", discourse_username as "discourseUsername",
  display_name as "displayName", persona_topic_id as "personaTopicId", status,
  consent_version as "consentVersion", opted_in_at as "optedInAt", is_sample as "isSample"`

/** Creates or refreshes the member for a Discourse user. Identity comes only from the tool context. */
export async function upsertMemberFromDiscourse(db: Db, input: {
  discourseUserId: number
  username: string
  displayName?: string | null
  personaTopicId?: number | null
}): Promise<Member> {
  const [row] = await db.query<Member>(
    `insert into members (discourse_user_id, discourse_username, display_name, persona_topic_id)
     values ($1, $2, $3, $4)
     on conflict (discourse_user_id) do update set
       discourse_username = excluded.discourse_username,
       display_name = coalesce(excluded.display_name, members.display_name),
       persona_topic_id = coalesce(excluded.persona_topic_id, members.persona_topic_id),
       updated_at = now()
     returning ${MEMBER_COLS}`,
    [input.discourseUserId, input.username, input.displayName ?? null, input.personaTopicId ?? null],
  )
  return row
}

/** Sample members fill the pool for the demo. They have no Discourse account and are always labelled. */
export async function insertSampleMember(db: Db, displayName: string, at: Date): Promise<Member> {
  const [row] = await db.query<Member>(
    `insert into members (display_name, is_sample, consent_version, opted_in_at)
     values ($1, true, 'sample', $2::timestamptz) returning ${MEMBER_COLS}`,
    [displayName, iso(at)],
  )
  return row
}

export async function getMember(db: Db, memberId: string): Promise<Member | null> {
  const [row] = await db.query<Member>(`select ${MEMBER_COLS} from members where id = $1`, [memberId])
  return row ?? null
}

export async function getMemberByDiscourseId(db: Db, discourseUserId: number): Promise<Member | null> {
  const [row] = await db.query<Member>(`select ${MEMBER_COLS} from members where discourse_user_id = $1`, [discourseUserId])
  return row ?? null
}

export async function recordConsent(db: Db, memberId: string, version: string, at: Date): Promise<void> {
  await db.query(
    `update members set consent_version = $2, opted_in_at = coalesce(opted_in_at, $3::timestamptz), updated_at = now()
     where id = $1`,
    [memberId, version, iso(at)],
  )
}

/** The member's own thread with Bà Mối, where her notifications go. */
export async function setPersonaTopic(db: Db, memberId: string, topicId: number): Promise<void> {
  await db.query(`update members set persona_topic_id = $2, updated_at = now() where id = $1`, [memberId, topicId])
}

export async function setMemberStatus(db: Db, memberId: string, status: MemberStatus): Promise<void> {
  await db.query(`update members set status = $2, updated_at = now() where id = $1`, [memberId, status])
}

export async function createConfirmationChallenge(db: Db, challenge: {
  nonce: string
  memberId: string
  topicId: number
  action: string
  resource: string
  issuedPostId: number
  issuedAt: Date
  expiresAt: Date
}): Promise<void> {
  // Keep only a short operational audit window; no message text or token is stored.
  await db.query(
    `delete from confirmation_challenges where member_id = $1 and expires_at < $2::timestamptz - interval '7 days'`,
    [challenge.memberId, iso(challenge.issuedAt)],
  )
  await db.query(
    `insert into confirmation_challenges
       (nonce, member_id, topic_id, action, resource, issued_post_id, issued_at, expires_at)
     values ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz)`,
    [challenge.nonce, challenge.memberId, challenge.topicId, challenge.action, challenge.resource,
      challenge.issuedPostId, iso(challenge.issuedAt), iso(challenge.expiresAt)],
  )
}

/** Atomically consumes a challenge only from a later human-authored Discourse post. */
export async function consumeConfirmationChallenge(db: Db, challenge: {
  nonce: string
  memberId: string
  topicId: number
  action: string
  resource: string
  issuedPostId: number
  currentPostId: number
  now: Date
}): Promise<boolean> {
  const rows = await db.query(
    `update confirmation_challenges
       set consumed_at = $8::timestamptz, consumed_post_id = $7
     where nonce = $1 and member_id = $2 and topic_id = $3 and action = $4 and resource = $5
       and issued_post_id = $6 and issued_post_id < $7
       and consumed_at is null and expires_at >= $8::timestamptz
     returning nonce`,
    [challenge.nonce, challenge.memberId, challenge.topicId, challenge.action, challenge.resource,
      challenge.issuedPostId, challenge.currentPostId, iso(challenge.now)],
  )
  return rows.length === 1
}

/** Removes every sample member (and, by cascade, anything that referenced one). Returns how many. */
export async function deleteSampleMembers(db: Db): Promise<number> {
  const rows = await db.query(`delete from members where is_sample returning id`)
  return rows.length
}

/** Deletes all of the member's matchmaking data; every other table cascades. */
export async function deleteMember(db: Db, memberId: string): Promise<void> {
  // Outbound payloads are JSON without FKs. Purge messages to/from this member
  // before the cascades remove the match IDs needed to find them.
  await db.query(
    `delete from pending_posts where payload->>'memberId' = $1::text
       or payload->>'matchId' in (select id::text from matches where member_a = $1::uuid or member_b = $1::uuid)`,
    [memberId],
  )
  await db.query(`delete from members where id = $1`, [memberId])
}

// ── Profiles ───────────────────────────────────────────────────────────────

/** Filled in one interview answer at a time, so every field may still be missing. */
export interface ProfileDraft {
  intent: Intent | null
  gender: Gender | null
  seeking: Seeking | null
  birthDate: string | null
  birthTime: string | null
  city: string | null
  ageMin: number | null
  ageMax: number | null
  marital: MaritalStatus | null
  children: Children | null
  wantsChildren: WantsChildren | null
  hobbies: string[]
  openAnswer: string | null
  occupation: string | null
}

export const EMPTY_PROFILE: ProfileDraft = {
  intent: null, gender: null, seeking: null, birthDate: null, birthTime: null, city: null,
  ageMin: null, ageMax: null, marital: null, children: null, wantsChildren: null,
  hobbies: [], openAnswer: null, occupation: null,
}

export type StoredProfile = ProfileDraft & DerivedProfile & { memberId: string }

const PROFILE_COLS = `member_id as "memberId", intent, gender, seeking, birth_date::text as "birthDate",
  birth_time as "birthTime", city, age_min as "ageMin", age_max as "ageMax", marital, children,
  wants_children as "wantsChildren", hobbies, open_answer as "openAnswer", occupation, region,
  lunar_year as "lunarYear", year_stem as "yearStem", year_branch as "yearBranch", nap_am as "napAm",
  nap_am_element as "napAmElement", day_stem as "dayStem", day_branch as "dayBranch",
  day_element as "dayElement"`

/** Hard-filter inputs: changing one voids open discoveries in both directions. */
export const DISCOVERY_FIELDS = ['birthDate', 'birthTime', 'intent', 'gender', 'seeking', 'marital', 'ageMin', 'ageMax'] as const
/** Changing one of these also takes the card out of the pool until she re-confirms it, since its summary may be stale. */
export const CARD_FIELDS = ['birthDate', 'birthTime', 'intent', 'gender', 'seeking', 'marital'] as const

export async function getProfile(db: Db, memberId: string): Promise<StoredProfile | null> {
  const [row] = await db.query<StoredProfile>(`select ${PROFILE_COLS} from member_profiles where member_id = $1`, [memberId])
  return row ?? null
}

/**
 * Stores the whole profile; the caller merges answers and derives fields.
 * Existing signals and matches are never voided retroactively.
 */
export async function saveProfile(db: Db, memberId: string, profile: ProfileDraft, derived: DerivedProfile): Promise<{ changed: string[]; cardUnconfirmed: boolean }> {
  return db.transaction(async (tx) => {
    const before = await getProfile(tx, memberId)
    await tx.query(
      `insert into member_profiles (member_id, intent, gender, seeking, birth_date, birth_time, city, age_min, age_max,
         marital, children, wants_children, hobbies, open_answer, occupation, region, lunar_year, year_stem,
         year_branch, nap_am, nap_am_element, day_stem, day_branch, day_element, updated_at)
       values ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10, $11, $12,
         array(select jsonb_array_elements_text($13::jsonb)), $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, now())
       on conflict (member_id) do update set
         intent = excluded.intent, gender = excluded.gender, seeking = excluded.seeking,
         birth_date = excluded.birth_date, birth_time = excluded.birth_time, city = excluded.city,
         age_min = excluded.age_min, age_max = excluded.age_max, marital = excluded.marital,
         children = excluded.children, wants_children = excluded.wants_children, hobbies = excluded.hobbies,
         open_answer = excluded.open_answer, occupation = excluded.occupation, region = excluded.region,
         lunar_year = excluded.lunar_year, year_stem = excluded.year_stem, year_branch = excluded.year_branch,
         nap_am = excluded.nap_am, nap_am_element = excluded.nap_am_element, day_stem = excluded.day_stem,
         day_branch = excluded.day_branch, day_element = excluded.day_element, updated_at = now()`,
      [memberId, profile.intent, profile.gender, profile.seeking, profile.birthDate, profile.birthTime,
        profile.city, profile.ageMin, profile.ageMax, profile.marital, profile.children, profile.wantsChildren,
        profile.hobbies, profile.openAnswer, profile.occupation, derived.region, derived.lunarYear,
        derived.yearStem, derived.yearBranch, derived.napAm, derived.napAmElement, derived.dayStem,
        derived.dayBranch, derived.dayElement],
    )
    if (!before) return { changed: [], cardUnconfirmed: false }
    const changed = DISCOVERY_FIELDS.filter((k) => (before[k] ?? null) !== (profile[k] ?? null))
    if (changed.length > 0) {
      await tx.query(
        `update discoveries set status = 'void', updated_at = now()
         where status = 'active' and (viewer_id = $1 or candidate_id = $1)`,
        [memberId],
      )
    }
    const cardUnconfirmed = changed.some((k) => (CARD_FIELDS as readonly string[]).includes(k))
    if (cardUnconfirmed) {
      await tx.query(
        `update pool_cards set discoverable = false, confirmed_at = null, updated_at = now() where member_id = $1`,
        [memberId],
      )
    }
    return { changed, cardUnconfirmed }
  })
}

// ── Cards and the pool ─────────────────────────────────────────────────────

export interface StoredCard {
  memberId: string
  card: PoolCard
  summaryText: string | null
  confirmedAt: Date | null
  discoverable: boolean
}

export async function getCard(db: Db, memberId: string): Promise<StoredCard | null> {
  const [row] = await db.query<StoredCard>(
    `select member_id as "memberId", card, summary_text as "summaryText", confirmed_at as "confirmedAt", discoverable
     from pool_cards where member_id = $1`,
    [memberId],
  )
  return row ?? null
}

/** A confirmed card is discoverable; an unconfirmed one is a preview. */
export async function saveCard(db: Db, memberId: string, card: PoolCard, summaryText: string | null, confirmedAt: Date | null): Promise<void> {
  await db.query(
    `insert into pool_cards (member_id, card, summary_text, confirmed_at, discoverable, updated_at)
     values ($1, $2::jsonb, $3, $4::timestamptz, $5, now())
     on conflict (member_id) do update set card = excluded.card, summary_text = excluded.summary_text,
       confirmed_at = excluded.confirmed_at, discoverable = excluded.discoverable, updated_at = now()`,
    [memberId, card, summaryText, confirmedAt ? iso(confirmedAt) : null, confirmedAt !== null],
  )
}

export interface PoolBuckets {
  regions: Map<string, number>
  initials: Map<string, number>
}

/** Counts behind the rule of 5, over the discoverable pool. */
export async function poolBuckets(db: Db, currentConsentVersion?: string): Promise<PoolBuckets> {
  const rows = await db.query<{ region: string | null; displayName: string | null }>(
    `select p.region, m.display_name as "displayName"
     from pool_cards c join members m on m.id = c.member_id join member_profiles p on p.member_id = c.member_id
     where c.discoverable and m.status = 'active'
       ${currentConsentVersion ? 'and (m.consent_version = $1 or m.is_sample)' : ''}`,
    currentConsentVersion ? [currentConsentVersion] : [],
  )
  const regions = new Map<string, number>()
  const initials = new Map<string, number>()
  for (const row of rows) {
    const initial = initialOf(row.displayName)
    if (row.region) regions.set(row.region, (regions.get(row.region) ?? 0) + 1)
    if (initial) initials.set(initial, (initials.get(initial) ?? 0) + 1)
  }
  return { regions, initials }
}

export interface PoolCandidate extends StoredProfile {
  card: PoolCard
  isSample: boolean
}

/** Every discoverable, active member except the viewer. The beta pool is small enough to score in memory. */
export async function listPool(db: Db, viewerId: string, limit = 1000, currentConsentVersion?: string): Promise<PoolCandidate[]> {
  return db.query<PoolCandidate>(
    `select p.*, c.card, m.is_sample as "isSample"
     from (select ${PROFILE_COLS} from member_profiles) p
     join pool_cards c on c.member_id = p."memberId"
     join members m on m.id = p."memberId"
     where c.discoverable and m.status = 'active' and m.id <> $1
       ${currentConsentVersion ? 'and (m.consent_version = $3 or m.is_sample)' : ''}
     order by m.created_at
     limit $2`,
    currentConsentVersion ? [viewerId, limit, currentConsentVersion] : [viewerId, limit],
  )
}

export async function loadExclusions(db: Db, viewerId: string): Promise<Exclusions> {
  const [blocks, discovered, declined, matched] = await Promise.all([
    db.query<{ a: string; b: string }>(
      `select blocker_id as a, blocked_id as b from blocks where blocker_id = $1 or blocked_id = $1`, [viewerId]),
    db.query<{ candidateId: string }>(
      `select candidate_id as "candidateId" from discoveries where viewer_id = $1`, [viewerId]),
    db.query<{ a: string; b: string }>(
      `select from_id as a, to_id as b from interests where status = 'declined' and (from_id = $1 or to_id = $1)`, [viewerId]),
    db.query<{ a: string; b: string }>(
      `select member_a as a, member_b as b from matches where member_a = $1 or member_b = $1`, [viewerId]),
  ])
  return {
    blocked: new Set(blocks.map((r) => pairKey(r.a, r.b))),
    discovered: new Set(discovered.map((r) => orderedKey(viewerId, r.candidateId))),
    declined: new Set(declined.map((r) => pairKey(r.a, r.b))),
    matched: new Set(matched.map((r) => pairKey(r.a, r.b))),
  }
}

// ── Daily box ──────────────────────────────────────────────────────────────

export type DailyOpeningStatus = 'pending' | 'matched' | 'no_match' | 'void'

/**
 * Claims the member's box for a Vietnam calendar day (see vnDate). Returns
 * false when the day's turn is already used: pending, matched or no_match.
 * A voided opening can be claimed again.
 */
export async function claimDailyOpening(db: Db, memberId: string, openDay: string): Promise<boolean> {
  const rows = await db.query(
    `insert into daily_openings (member_id, open_day) values ($1, $2::date)
     on conflict (member_id, open_day) do update set status = 'pending', discovery_id = null, created_at = now()
       where daily_openings.status = 'void'
     returning member_id`,
    [memberId, openDay],
  )
  return rows.length > 0
}

export async function finishDailyOpening(db: Db, memberId: string, openDay: string, status: Exclude<DailyOpeningStatus, 'pending'>, discoveryId: string | null): Promise<void> {
  await db.query(
    `update daily_openings set status = $3, discovery_id = $4 where member_id = $1 and open_day = $2::date`,
    [memberId, openDay, status, discoveryId],
  )
}

export async function getDailyOpening(db: Db, memberId: string, openDay: string): Promise<{ status: DailyOpeningStatus; discoveryId: string | null } | null> {
  const [row] = await db.query<{ status: DailyOpeningStatus; discoveryId: string | null }>(
    `select status, discovery_id as "discoveryId" from daily_openings where member_id = $1 and open_day = $2::date`,
    [memberId, openDay],
  )
  return row ?? null
}

// ── Discoveries ────────────────────────────────────────────────────────────

export type DiscoverySource = 'box' | 'search'
export type DiscoveryStatus = 'active' | 'interest_sent' | 'matched' | 'void'

export interface NewDiscovery {
  viewerId: string
  candidateId: string
  source: DiscoverySource
  aToB: number
  bToA: number
  mutual: number
  tier: Tier
  cardSnapshot: PoolCard
  fit: Record<string, unknown>
}

export interface Discovery extends NewDiscovery {
  id: string
  status: DiscoveryStatus
  createdAt: Date
}

const DISCOVERY_COLS = `id, viewer_id as "viewerId", candidate_id as "candidateId", source,
  a_to_b::float8 as "aToB", b_to_a::float8 as "bToA", mutual::float8 as mutual, tier,
  card_snapshot as "cardSnapshot", fit, status, created_at as "createdAt"`

/** Records that the viewer was shown the candidate. Returns null if she was already shown them. */
export async function insertDiscovery(db: Db, d: NewDiscovery): Promise<Discovery | null> {
  const [row] = await db.query<Discovery>(
    `insert into discoveries (viewer_id, candidate_id, source, a_to_b, b_to_a, mutual, tier, card_snapshot, fit)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
     on conflict (viewer_id, candidate_id) do nothing
     returning ${DISCOVERY_COLS}`,
    [d.viewerId, d.candidateId, d.source, d.aToB, d.bToA, d.mutual, d.tier, d.cardSnapshot, d.fit],
  )
  return row ?? null
}

export async function getDiscoveryForViewer(db: Db, discoveryId: string, viewerId: string): Promise<Discovery | null> {
  const [row] = await db.query<Discovery>(
    `select ${DISCOVERY_COLS} from discoveries where id = $1 and viewer_id = $2`, [discoveryId, viewerId])
  return row ?? null
}

export async function countDiscoveriesSince(db: Db, viewerId: string, source: DiscoverySource, since: Date): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    `select count(*)::int as n from discoveries where viewer_id = $1 and source = $2 and created_at >= $3::timestamptz`,
    [viewerId, source, iso(since)],
  )
  return row.n
}

// ── Interests (signals) and matches ────────────────────────────────────────

export type InterestStatus = 'pending' | 'accepted' | 'declined' | 'dismissed' | 'expired'

export interface Interest {
  id: string
  discoveryId: string
  fromId: string
  toId: string
  recipientPayload: Record<string, unknown>
  status: InterestStatus
  expiresAt: Date
  respondedAt: Date | null
  createdAt: Date
}

const INTEREST_COLS = `id, discovery_id as "discoveryId", from_id as "fromId", to_id as "toId",
  recipient_payload as "recipientPayload", status, expires_at as "expiresAt",
  responded_at as "respondedAt", created_at as "createdAt"`

export type MatchState = 'mutual_interest' | 'revealed' | 'closed'

export interface Match {
  id: string
  memberA: string
  memberB: string
  state: MatchState
  revealA: boolean
  revealB: boolean
  closedReason: 'ended' | 'blocked' | null
  createdAt: Date
}

const MATCH_COLS = `id, member_a as "memberA", member_b as "memberB", state, reveal_a as "revealA",
  reveal_b as "revealB", closed_reason as "closedReason", created_at as "createdAt"`

/** Both said yes: accept any open interest either way, create the match once, settle both discoveries. */
async function settleMutual(tx: Db, x: string, y: string, now: Date): Promise<Match> {
  await tx.query(
    `update interests set status = 'accepted', responded_at = $3::timestamptz
     where ((from_id = $1 and to_id = $2) or (from_id = $2 and to_id = $1)) and status in ('pending', 'dismissed', 'expired')`,
    [x, y, iso(now)],
  )
  const [a, b] = x < y ? [x, y] : [y, x]
  await tx.query(`insert into matches (member_a, member_b) values ($1, $2) on conflict (member_a, member_b) do nothing`, [a, b])
  await tx.query(
    `update discoveries set status = 'matched', updated_at = now()
     where (viewer_id = $1 and candidate_id = $2) or (viewer_id = $2 and candidate_id = $1)`,
    [x, y],
  )
  const [match] = await tx.query<Match>(`select ${MATCH_COLS} from matches where member_a = $1 and member_b = $2`, [a, b])
  return match
}

/**
 * The sender's "yes", idempotent per ordered pair. If the recipient has
 * already said yes (a live pending interest the other way, or an earlier
 * acceptance), the pair is mutual and the match is created at once.
 */
export async function createInterest(db: Db, input: {
  discoveryId: string
  fromId: string
  toId: string
  recipientPayload: Record<string, unknown>
  now: Date
}): Promise<{ interest: Interest; created: boolean; match: Match | null }> {
  return db.transaction(async (tx) => {
    await lockPair(tx, input.fromId, input.toId)
    const inserted = await tx.query<Interest>(
      `insert into interests (discovery_id, from_id, to_id, recipient_payload, expires_at)
       values ($1, $2, $3, $4::jsonb, $5::timestamptz + interval '7 days')
       on conflict (from_id, to_id) do nothing
       returning ${INTEREST_COLS}`,
      [input.discoveryId, input.fromId, input.toId, input.recipientPayload, iso(input.now)],
    )
    await tx.query(
      `update discoveries set status = 'interest_sent', updated_at = now() where id = $1 and status = 'active'`,
      [input.discoveryId],
    )
    const [other] = await tx.query<{ status: InterestStatus; live: boolean }>(
      `select status, expires_at > $3::timestamptz as live from interests where from_id = $1 and to_id = $2`,
      [input.toId, input.fromId, iso(input.now)],
    )
    const [mine] = inserted.length > 0 ? inserted : await tx.query<Interest>(
      `select ${INTEREST_COLS} from interests where from_id = $1 and to_id = $2`, [input.fromId, input.toId])
    const otherSaidYes = other && (other.status === 'accepted' || (other.status === 'pending' && other.live))
    if (!otherSaidYes || mine.status === 'declined') return { interest: mine, created: inserted.length > 0, match: null }
    const match = await settleMutual(tx, input.fromId, input.toId, input.now)
    const [interest] = await tx.query<Interest>(`select ${INTEREST_COLS} from interests where id = $1`, [mine.id])
    return { interest, created: inserted.length > 0, match }
  })
}

export async function countInterestsSince(db: Db, fromId: string, since: Date): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    `select count(*)::int as n from interests where from_id = $1 and created_at >= $2::timestamptz`, [fromId, iso(since)])
  return row.n
}

/** Pending signals for a recipient, oldest first. Overdue ones are expired as they are read. */
export async function listPendingSignals(db: Db, toId: string, now: Date): Promise<Interest[]> {
  await db.query(
    `update interests set status = 'expired' where to_id = $1 and status = 'pending' and expires_at <= $2::timestamptz`,
    [toId, iso(now)],
  )
  return db.query<Interest>(
    `select ${INTEREST_COLS} from interests where to_id = $1 and status = 'pending' order by created_at`, [toId])
}

export type SignalResponse = 'accept' | 'decline' | 'dismiss'

export type RespondResult =
  | { ok: true; interest: Interest; match: Match | null }
  | { ok: false; error: 'not_found' | 'not_pending' | 'expired' }

/** The recipient's answer. Expiry is enforced here again, whatever the last read showed. */
export async function respondToSignal(db: Db, input: {
  interestId: string
  recipientId: string
  response: SignalResponse
  now: Date
}): Promise<RespondResult> {
  return db.transaction(async (tx) => {
    const [pair] = await tx.query<{ fromId: string }>(
      `select from_id as "fromId" from interests where id = $1 and to_id = $2`, [input.interestId, input.recipientId])
    if (!pair) return { ok: false, error: 'not_found' }
    await lockPair(tx, pair.fromId, input.recipientId)
    const [current] = await tx.query<Interest>(`select ${INTEREST_COLS} from interests where id = $1 for update`, [input.interestId])
    if (current.status !== 'pending') return { ok: false, error: 'not_pending' }
    if (new Date(current.expiresAt).getTime() <= input.now.getTime()) {
      await tx.query(`update interests set status = 'expired' where id = $1`, [current.id])
      return { ok: false, error: 'expired' }
    }
    if (input.response === 'accept') {
      const match = await settleMutual(tx, current.fromId, current.toId, input.now)
      const [interest] = await tx.query<Interest>(`select ${INTEREST_COLS} from interests where id = $1`, [current.id])
      return { ok: true, interest, match }
    }
    const [interest] = await tx.query<Interest>(
      `update interests set status = $2, responded_at = $3::timestamptz where id = $1 returning ${INTEREST_COLS}`,
      [current.id, input.response === 'decline' ? 'declined' : 'dismissed', iso(input.now)],
    )
    return { ok: true, interest, match: null }
  })
}

export async function getMatchForMember(db: Db, matchId: string, memberId: string, lock = false): Promise<Match | null> {
  const [row] = await db.query<Match>(
    `select ${MATCH_COLS} from matches where id = $1 and (member_a = $2 or member_b = $2) ${lock ? 'for update' : ''}`, [matchId, memberId])
  return row ?? null
}

export async function listMatchesForMember(db: Db, memberId: string): Promise<Match[]> {
  return db.query<Match>(
    `select ${MATCH_COLS} from matches where member_a = $1 or member_b = $1 order by created_at desc`, [memberId])
}

/** Records one side's reveal. The match becomes 'revealed' once both have; a closed match stays closed. */
export async function setReveal(db: Db, matchId: string, memberId: string): Promise<Match | null> {
  const [row] = await db.query<Match>(
    `update matches set
       reveal_a = reveal_a or member_a = $2,
       reveal_b = reveal_b or member_b = $2,
       state = case when state = 'closed' then state
                    when (reveal_a or member_a = $2) and (reveal_b or member_b = $2) then 'revealed'
                    else state end,
       updated_at = now()
     where id = $1 and (member_a = $2 or member_b = $2)
     returning ${MATCH_COLS}`,
    [matchId, memberId],
  )
  return row ?? null
}

export async function closeMatch(db: Db, matchId: string, reason: 'ended' | 'blocked'): Promise<void> {
  await db.query(
    `update matches set state = 'closed', closed_reason = coalesce(closed_reason, $2), updated_at = now() where id = $1`,
    [matchId, reason],
  )
}

export async function insertBlock(db: Db, blockerId: string, blockedId: string): Promise<void> {
  await db.query(`insert into blocks (blocker_id, blocked_id) values ($1, $2) on conflict do nothing`, [blockerId, blockedId])
}

// ── Relay ──────────────────────────────────────────────────────────────────

export interface RelayTopic {
  matchId: string
  memberId: string
  discourseTopicId: number | null
  aliasForOther: string
}

const RELAY_TOPIC_COLS = `match_id as "matchId", member_id as "memberId", discourse_topic_id as "discourseTopicId",
  alias_for_other as "aliasForOther"`

/** Returns false when the member already has a relay topic for this match. */
export async function insertRelayTopic(db: Db, t: { matchId: string; memberId: string; aliasForOther: string }): Promise<boolean> {
  const rows = await db.query(
    `insert into relay_topics (match_id, member_id, alias_for_other) values ($1, $2, $3) on conflict do nothing
     returning member_id`,
    [t.matchId, t.memberId, t.aliasForOther],
  )
  return rows.length > 0
}

export async function getRelayTopic(db: Db, matchId: string, memberId: string): Promise<RelayTopic | null> {
  const [row] = await db.query<RelayTopic>(
    `select ${RELAY_TOPIC_COLS} from relay_topics where match_id = $1 and member_id = $2`, [matchId, memberId])
  return row ?? null
}

export async function setRelayTopicDiscourseId(db: Db, matchId: string, memberId: string, discourseTopicId: number): Promise<void> {
  await db.query(
    `update relay_topics set discourse_topic_id = $3 where match_id = $1 and member_id = $2`,
    [matchId, memberId, discourseTopicId],
  )
}

export async function getRelayTopicByDiscourseId(db: Db, discourseTopicId: number): Promise<RelayTopic | null> {
  const [row] = await db.query<RelayTopic>(
    `select ${RELAY_TOPIC_COLS} from relay_topics where discourse_topic_id = $1`, [discourseTopicId])
  return row ?? null
}

export async function listRelayTopicsForMatch(db: Db, matchId: string): Promise<RelayTopic[]> {
  return db.query<RelayTopic>(`select ${RELAY_TOPIC_COLS} from relay_topics where match_id = $1`, [matchId])
}

export type RelayStatus = 'relayed' | 'held' | 'rate_limited' | 'too_long'

/** Returns the new message's id, which doubles as its sequence number, or null for a replayed source post. */
export async function insertRelayMessage(db: Db, m: { matchId: string; fromMember: string; sourcePostId: number; status: RelayStatus }): Promise<number | null> {
  const [row] = await db.query<{ id: number }>(
    `insert into relay_messages (match_id, from_member, source_post_id, status) values ($1, $2, $3, $4)
     on conflict (source_post_id) do nothing returning id::int as id`,
    [m.matchId, m.fromMember, m.sourcePostId, m.status],
  )
  return row?.id ?? null
}

export async function setRelayedPostId(db: Db, id: number, relayedPostId: number): Promise<void> {
  await db.query(`update relay_messages set relayed_post_id = $2 where id = $1`, [id, relayedPostId])
}

/** Every message counts toward the rate limit, held or not, so flooding stays limited. */
export async function countRelayMessagesSince(db: Db, memberId: string, since: Date): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    `select count(*)::int as n from relay_messages where from_member = $1 and created_at >= $2::timestamptz`,
    [memberId, iso(since)],
  )
  return row.n
}

/** Short rolling context used only to detect contact details split across messages. */
export async function getRelayContactTail(db: Db, matchId: string, memberId: string): Promise<string> {
  const [row] = await db.query<{ textTail: string }>(
    `select text_tail as "textTail" from relay_contact_windows where match_id = $1 and member_id = $2`,
    [matchId, memberId],
  )
  return row?.textTail ?? ''
}

export async function setRelayContactTail(db: Db, matchId: string, memberId: string, textTail: string): Promise<void> {
  await db.query(
    `insert into relay_contact_windows (match_id, member_id, text_tail, updated_at)
     values ($1, $2, $3, now())
     on conflict (match_id, member_id) do update set text_tail = excluded.text_tail, updated_at = now()`,
    [matchId, memberId, textTail],
  )
}

export async function clearRelayContactTail(db: Db, matchId: string, memberId: string): Promise<void> {
  await db.query(`delete from relay_contact_windows where match_id = $1 and member_id = $2`, [matchId, memberId])
}

/** Discard both sides' rolling plaintext as soon as the anonymous boundary ends. */
export async function clearRelayContactTailsForMatch(db: Db, matchId: string): Promise<void> {
  await db.query(`delete from relay_contact_windows where match_id = $1`, [matchId])
}

// ── Pending Discourse posts (retry queue) ──────────────────────────────────

export interface PendingPost {
  id: string
  idempotencyKey: string
  kind: string
  payload: Record<string, unknown>
  attempts: number
}

export const MAX_POST_ATTEMPTS = 10

export async function enqueuePost(db: Db, idempotencyKey: string, kind: string, payload: Record<string, unknown>, now = new Date()): Promise<void> {
  await db.query(
    `insert into pending_posts (idempotency_key, kind, payload, next_at) values ($1, $2, $3::jsonb, $4::timestamptz)
     on conflict (idempotency_key) do nothing`,
    [idempotencyKey, kind, payload, iso(now)],
  )
}

/**
 * Leases due posts and counts the attempt up front. The lease doubles as the
 * backoff (1, 2, 4 ... minutes, capped at an hour), so a worker that dies
 * mid-send can't retry a post forever or send it twice at once.
 */
export async function claimDuePosts(db: Db, now: Date, limit = 20, key?: string): Promise<PendingPost[]> {
  await db.query(
    `update pending_posts set status = 'dead', updated_at = now()
     where status = 'pending' and attempts >= $2 and next_at <= $1::timestamptz`,
    [iso(now), MAX_POST_ATTEMPTS],
  )
  return db.query<PendingPost>(
    `update pending_posts set
       attempts = attempts + 1,
       next_at = $1::timestamptz + least(interval '1 minute' * power(2, attempts), interval '1 hour'),
       updated_at = now()
     where id in (select id from pending_posts where status = 'pending' and attempts < $3 and next_at <= $1::timestamptz
                  ${key ? 'and idempotency_key = $4' : ''}
                  order by next_at limit $2 for update skip locked)
     returning id, idempotency_key as "idempotencyKey", kind, payload, attempts`,
    key ? [iso(now), limit, MAX_POST_ATTEMPTS, key] : [iso(now), limit, MAX_POST_ATTEMPTS],
  )
}

export async function markPostSent(db: Db, id: string): Promise<void> {
  await db.query(`update pending_posts set status = 'sent', payload = '{}'::jsonb, last_error = null, updated_at = now() where id = $1`, [id])
}

/** Records the failure; the post is dead once it has used MAX_POST_ATTEMPTS. */
export async function markPostFailed(db: Db, id: string, error: string): Promise<'pending' | 'dead'> {
  const [row] = await db.query<{ status: 'pending' | 'dead' }>(
    `update pending_posts set
       status = case when attempts >= $3 then 'dead' else 'pending' end,
       last_error = left($2, 500), updated_at = now()
     where id = $1 returning status`,
    [id, error, MAX_POST_ATTEMPTS],
  )
  return row?.status ?? 'dead' // deletion can purge a claimed post while delivery is in flight
}
