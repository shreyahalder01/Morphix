import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getJob } from '@/lib/server/job-store';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const kind = _req.nextUrl.searchParams.get('kind') ?? 'output';
  const shouldDownload = _req.nextUrl.searchParams.get('download') === '1';
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const filePath = kind === 'original' ? job.sourcePath : job.outputPath;

  if (kind === 'original') {
    if (!job.sourcePath) {
      return NextResponse.json({ error: 'Original file missing' }, { status: 404 });
    }
  } else if (job.status !== 'done' || !job.outputPath) {
    return NextResponse.json({ error: 'Output not ready' }, { status: 409 });
  }

  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Output file missing' }, { status: 404 });
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType =
    extension === '.mp4' ? 'video/mp4' :
    extension === '.mov' ? 'video/quicktime' :
    extension === '.webm' ? 'video/webm' :
    extension === '.avi' ? 'video/x-msvideo' :
    'application/octet-stream';

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': shouldDownload
        ? `attachment; filename="morphix-${jobId}.mp4"`
        : `inline; filename="${path.basename(filePath)}"`,
      'Content-Length': String(buffer.length),
    },
  });
}
