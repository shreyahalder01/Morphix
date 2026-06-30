import { NextResponse } from 'next/server';
import { listJobs } from '@/lib/server/job-store';
import type { ApiJob } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  const jobs = listJobs();
  const apiJobs: ApiJob[] = jobs.map(job => ({
    id: job.id,
    style: job.style,
    fps: job.fps,
    status: job.status,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    error: job.error,
    downloadUrl: job.status === 'done' ? `/api/process/${job.id}/file?kind=output&download=1` : undefined,
  }));

  return NextResponse.json(apiJobs);
}
