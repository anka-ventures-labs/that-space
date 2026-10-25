import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Vitest does not auto-clean rendered trees between tests the way Jest's
// Testing Library integration did, so unmount after every test.
afterEach(() => {
  cleanup()
})
