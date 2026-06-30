import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createStylePreview } from '@/lib/server/ffmpeg';
import { getMockFilter } from '@/lib/server/ai-engine';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('video') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'data', 'uploads', 'preview-temp');
    fs.mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(file.name || '.mp4') || '.mp4';
    const sourceName = `preview_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const sourcePath = path.join(uploadDir, sourceName);

    const bytes = await file.arrayBuffer();
    fs.writeFileSync(sourcePath, Buffer.from(bytes));

    const style = (formData.get('style') as string | null)?.trim() || 'ghibli';
    const strength = Math.max(0, Math.min(1, Number(formData.get('strength') ?? 0.82)));
    const startTime = Math.max(0, Number(formData.get('startTime') ?? 0));
    const requestedEndTime = Number(formData.get('endTime') ?? startTime + 1);
    const endTime = Math.max(startTime + 0.1, Math.min(requestedEndTime, startTime + 1));
    const filter = getMockFilter(style, style, strength, style);

    const outputName = `preview_${Date.now()}.mp4`;
    const outputPath = path.join(process.cwd(), 'data', 'previews', outputName);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await createStylePreview({
      inputPath: sourcePath,
      outputPath,
      startTime,
      endTime,
      filter,
    });

    return NextResponse.json({
      previewUrl: `/api/preview/file?name=${encodeURIComponent(outputName)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create preview snippet.';
    console.error('[api/preview] Failed to create preview:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
