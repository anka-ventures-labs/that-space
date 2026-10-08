import { baMoiDisabledResponse, baMoiEnabled, getDeps } from '@/lib/service/deps'
import { handleToolRequest } from '@/lib/service/dispatch'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1' // next to Supabase ap-southeast-1
export const dynamic = 'force-dynamic'
// A match commits its durable outbox before sending up to four native posts.
// Allow their bounded five-second requests to finish on a cold instance.
export const maxDuration = 60

export async function POST(request: Request, { params }: { params: Promise<{ tool: string }> }) {
  if (!baMoiEnabled()) return baMoiDisabledResponse()
  return handleToolRequest((await params).tool, request, getDeps())
}
