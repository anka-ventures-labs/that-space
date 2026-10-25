import { describe, expect, it } from 'vitest'
import {
  complete,
  RETRY_SCHEDULE,
  retryUrl,
  type RetryJob,
  type RetryVaultSecret,
} from '@/scripts/ba-moi-retry-config'

const command = 'SELECT retry()'
const matchingSecret: RetryVaultSecret = { id: 'secret-id', matches: true }
const matchingJob: RetryJob = {
  jobId: '7',
  schedule: RETRY_SCHEDULE,
  command,
  active: true,
}

describe('Bà Mối retry scheduler configuration', () => {
  it('adds the retry endpoint to an HTTPS service URL while preserving its path', () => {
    expect(retryUrl('https://service.example')).toBe('https://service.example/cron/retry-posts')
    expect(retryUrl('https://service.example/api/ba-moi/v1/')).toBe('https://service.example/api/ba-moi/v1/cron/retry-posts')
  })

  it('rejects non-HTTPS URLs, credentials, query strings, and fragments', () => {
    for (const url of [
      'http://service.example',
      'https://user:password@service.example',
      'https://service.example/api?token=secret',
      'https://service.example/api#retry',
    ]) {
      expect(() => retryUrl(url)).toThrow('invalid_service_url')
    }
  })

  it('treats ambiguity and any schedule drift as incomplete', () => {
    expect(complete([matchingSecret], [matchingJob], command)).toBe(true)
    expect(complete([matchingSecret, matchingSecret], [matchingJob], command)).toBe(false)
    expect(complete([matchingSecret], [matchingJob, matchingJob], command)).toBe(false)
    expect(complete([matchingSecret], [{ ...matchingJob, active: false }], command)).toBe(false)
    expect(complete([{ ...matchingSecret, matches: false }], [matchingJob], command)).toBe(false)
    expect(complete([matchingSecret], [{ ...matchingJob, command: 'SELECT stale()' }], command)).toBe(false)
  })
})
