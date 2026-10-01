import { describe, expect, it } from 'vitest'
import { jsonObject } from '@/lib/discourse/probe'

describe('Discourse probe JSON handling', () => {
  it('accepts objects and rejects malformed or non-object responses', () => {
    expect(jsonObject('{"current_user":{"username":"ba_moi"}}')).toEqual({ current_user: { username: 'ba_moi' } })
    expect(jsonObject('<html>proxy error</html>')).toBeNull()
    expect(jsonObject('[]')).toBeNull()
  })
})
