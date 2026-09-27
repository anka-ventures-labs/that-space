import { getDeps } from '@/lib/service/deps'
import { handleDiscourseWebhook } from '@/lib/service/relay'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function POST(request: Request) {
  return handleDiscourseWebhook(request, getDeps())
}
