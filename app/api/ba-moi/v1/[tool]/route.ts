import { getDeps } from '@/lib/service/deps'
import { handleToolRequest } from '@/lib/service/dispatch'

export const runtime = 'nodejs'
export const preferredRegion = 'sin1' // next to Supabase ap-southeast-1
export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function POST(request: Request, { params }: { params: Promise<{ tool: string }> }) {
  return handleToolRequest((await params).tool, request, getDeps())
}
