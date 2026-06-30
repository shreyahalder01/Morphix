'use client';

import { Download, PlayCircle, SplitSquareHorizontal, Video } from 'lucide-react';

interface ResultsPanelProps {
  originalUrl?: string;
  outputUrl?: string;
  posterUrl?: string;
  downloadUrl?: string;
  previewUrl?: string;
  fps: number;
  styleLabel: string;
}

export function ResultsPanel({ originalUrl, outputUrl, posterUrl, downloadUrl, previewUrl, fps, styleLabel }: ResultsPanelProps) {
  const hasResult = Boolean(originalUrl && outputUrl);

  return (
    <section className="glass-panel gradient-border rounded-[1.75rem] p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-morphix-purple/90">Step 3</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Results and output player</h2>
          <p className="mt-2 text-sm text-slate-300">Compare the original upload against the generated mixed-media render at {fps} fps.</p>
        </div>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white">
              <Video className="h-4 w-4 text-morphix-blue" />
              <span className="font-medium">Original</span>
            </div>
            <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-slate-300">Source</span>
          </div>

          <div className="overflow-hidden rounded-[1.2rem] border border-white/8 bg-black">
            {originalUrl ? (
              <video className="aspect-video w-full" controls playsInline src={originalUrl} poster={posterUrl} />
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-slate-400">Upload a video to preview the source here.</div>
            )}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white">
              <SplitSquareHorizontal className="h-4 w-4 text-morphix-purple" />
              <span className="font-medium">Mixed-media output</span>
            </div>
            <span className="rounded-full border border-morphix-purple/20 bg-morphix-purple/10 px-2.5 py-1 text-xs text-morphix-purple">{styleLabel}</span>
          </div>

          <div className="overflow-hidden rounded-[1.2rem] border border-white/8 bg-black">
            {previewUrl ? (
              <video className="aspect-video w-full" controls playsInline src={previewUrl} poster={posterUrl} />
            ) : hasResult && outputUrl ? (
              <video className="aspect-video w-full" controls playsInline src={outputUrl} poster={posterUrl} />
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                <PlayCircle className="mr-2 h-4 w-4 text-slate-500" />
                Generated output will appear here after processing completes.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
        <strong className="text-white">Integration note:</strong> the download link should point to an object store or signed asset URL in production. This scaffold serves the file directly from the local job folder through <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-200">/api/process/[jobId]/file</code>.
      </div>
    </section>
  );
}