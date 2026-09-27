import { getDeps } from '@/lib/service/deps'
import { handleRetryRequest } from '@/lib/service/cron'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  return handleRetryRequest(request, getDeps())
}

export async function POST(request: Request) {
  return handleRetryRequest(request, getDeps())
}
