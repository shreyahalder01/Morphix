import { NextResponse } from 'next/server';
import { getComfyUIConfig, pingComfyUI } from '@/lib/server/comfyui';

export const runtime = 'nodejs';

export async function GET() {
  const online = await pingComfyUI();
  const config = getComfyUIConfig();

  return NextResponse.json({
    online,
    baseUrl: config.baseUrl,
    checkpoint: config.checkpoint,
    provider: config.provider,
    apiKeyConfigured: config.apiKeyConfigured,
    apiKeyHeader: config.apiKeyHeader,
  });
}
