import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createJob } from '@/lib/server/job-store';
import { saveJobToDb } from '@/lib/server/db';
import { processJob } from '@/lib/server/processor';
import { resolvePrompt } from '@/lib/server/styles-data';
import { trimVideo } from '@/lib/server/ffmpeg';
import type { ApiJob } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = (formData.get('video') ?? formData.get('file')) as File | null;
    const style = ((formData.get('style') ?? formData.get('styleKey')) as string | null) || 'ghibli';
    const promptOverride = (formData.get('prompt') as string | null)?.trim();
    const prompt = resolvePrompt(style, promptOverride || undefined);
    const fps = Number(formData.get('fps') ?? 24);
    const rawStrength = Number(formData.get('strength') ?? 0.82);
    const strength = Number.isFinite(rawStrength) ? Math.max(0, Math.min(1, rawStrength)) : 0.82;
    const startTime = Number(formData.get('startTime') ?? 0);
    const endTime = Number(formData.get('endTime') ?? 0);

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    if (fps < 5 || fps > 60) {
      return NextResponse.json({ error: 'FPS must be between 5 and 60' }, { status: 400 });
    }

    // Save uploaded file
    const uploadDir = path.join(process.cwd(), 'data', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || '.mp4';
    const sourceName = `upload_${Date.now()}${ext}`;
    const sourcePath = path.join(uploadDir, sourceName);
    fs.writeFileSync(sourcePath, buffer);

    let processingSourcePath = sourcePath;
    if (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime) {
      const trimmedName = `trimmed_${Date.now()}${ext}`;
      const trimmedPath = path.join(uploadDir, trimmedName);
      await trimVideo({
        inputPath: sourcePath,
        outputPath: trimmedPath,
        startTime,
        endTime,
      });
      processingSourcePath = trimmedPath;
    }

    // Create job record
    const job = createJob(style, fps, processingSourcePath, strength);

    // Persist to DB (non-fatal if DB is down)
    await saveJobToDb({
      id: job.id,
      style,
      fps,
      status: job.status,
      strength,
      prompt,
      originalFileName: file.name,
      originalStoragePath: sourcePath,
      message: 'Upload accepted. Processing has started.',
    });

    const manifest: ApiJob = {
      id: job.id,
      style: job.style,
      fps: job.fps,
      strength: job.strength,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      downloadUrl: undefined,
      message: 'Upload accepted. Processing has started.',
      originalUrl: `/api/process/${job.id}/file?kind=original`,
    };

    // Start processing in the background (fire-and-forget)
    processJob(job.id, processingSourcePath, style, fps, prompt, strength).catch(err => {
      console.error(`[processor] Job ${job.id} failed:`, err);
    });

    return NextResponse.json({ jobId: job.id, status: job.status, manifest }, { status: 201 });
  } catch (err) {
    console.error('[api/process] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
