import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

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
    'lib/forum-data.ts',
    'lib/matchmaking-data.ts',
  ])('does not ship the former demo surface %s', (path) => {
    expect(existsSync(resolve(root, path))).toBe(false)
  })
})
