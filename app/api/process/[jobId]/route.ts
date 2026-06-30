import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/server/job-store';
import type { ApiJob } from '@/types';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const apiJob: ApiJob = {
    id: job.id,
    style: job.style,
    fps: job.fps,
    strength: job.strength,
    status: job.status,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    error: job.error,
    downloadUrl: job.status === 'done' ? `/api/process/${job.id}/file?kind=output&download=1` : undefined,
    message:
      job.status === 'pending'
        ? 'Queued for processing.'
        : job.status === 'extracting'
          ? 'Extracting frames with FFmpeg...'
          : job.status === 'styling'
            ? 'Applying style transfer...'
            : job.status === 'compiling'
              ? 'Recompiling the output video...'
              : job.status === 'done'
                ? 'Mixed-media animation is ready.'
                : job.error ?? 'Processing failed.',
    originalUrl: job.sourcePath ? `/api/process/${job.id}/file?kind=original` : undefined,
    outputUrl: job.status === 'done' ? `/api/process/${job.id}/file?kind=output` : undefined,
  };

  return NextResponse.json(apiJob);
}
