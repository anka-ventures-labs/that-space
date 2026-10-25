import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { forumThreads } from '../../lib/origami-data'

const root = resolve(__dirname, '../..')

describe('public launch route boundary', () => {
  it('ships a Vietnamese not-found page for removed or mistyped routes', () => {
    expect(existsSync(resolve(root, 'app/not-found.tsx'))).toBe(true)
  })

  it.each([
    'app/forum/page.tsx',
    'app/forum/[slug]/page.tsx',
    'app/tuvi/page.tsx',
    'app/matchmaking/page.tsx',
    'app/profile/page.tsx',
    'lib/origami-data.ts',
  ])('ships the authoritative origami handoff surface %s', (path) => {
    expect(existsSync(resolve(root, path))).toBe(true)
  })

  it('keeps public sample titles inclusive and explicitly non-member data', () => {
    expect(forumThreads.every((thread) => !/chị em|phụ nữ/i.test(thread.title))).toBe(true)
    expect(forumThreads.filter((thread) => thread.sampleReplies.length > 0)).toHaveLength(1)
  })
})
