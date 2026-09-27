/**
 * Replaces the demo pool's sample members (lib/db/samples.ts). Needs
 * DATABASE_URL, the Supabase transaction pooler, which `npm run seed:samples`
 * reads from .env.local.
 */
import { getDb } from '@/lib/db/db'
import { seedSampleMembers } from '@/lib/db/samples'

seedSampleMembers(getDb()).then(
  ({ removed, inserted }) => {
    console.log(`Sample members: removed ${removed}, inserted ${inserted}.`)
    process.exit(0)
  },
  (error) => {
    console.error(error)
    process.exit(1)
  },
)
