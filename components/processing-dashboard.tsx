'use client';

import { CheckCircle2, Clock3, Loader2, Sparkles } from 'lucide-react';
import type { ApiJob } from '@/types';

const steps: Array<{ status: ApiJob['status']; label: string; description: string }> = [
  { status: 'pending', label: 'Upload accepted', description: 'File stored and job created' },
  { status: 'extracting', label: 'Extracting frames', description: 'FFmpeg is sampling frames at the target FPS' },
  { status: 'styling', label: 'Applying style transfer', description: 'AI provider receives the style payload' },
  { status: 'compiling', label: 'Recompiling video', description: 'Frames are assembled back into a deliverable video' },
  { status: 'done', label: 'Render complete', description: 'Download-ready output is available' }
];

interface ProcessingDashboardProps {
  status: ApiJob['status'];
  progress: number;
  message: string;
  jobId?: string;
}

const statusCopy: Record<ApiJob['status'], string> = {
  pending: 'Queued for extraction',
  extracting: 'Extracting frames...',
  styling: 'Applying style transfer...',
  compiling: 'Recompiling at selected FPS...',
  done: 'Mixed-media animation is ready',
  error: 'Processing failed'
};

export function ProcessingDashboard({ status, progress, message, jobId }: ProcessingDashboardProps) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.status === status)
  );

  return (
    <section className="glass-panel gradient-border rounded-[1.75rem] p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-morphix-purple/90">Step 2</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Processing dashboard</h2>
          <p className="mt-2 text-sm text-slate-300">{statusCopy[status]}</p>
        </div>

        <div className="rounded-[1.25rem] border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-300">
          <div className="flex items-center gap-2 text-white">
            {status === 'done' ? <CheckCircle2 className="h-4 w-4 text-morphix-green" /> : <Loader2 className="h-4 w-4 animate-spin text-morphix-purple" />}
            <span className="font-medium">{progress}% complete</span>
          </div>
          {jobId ? <p className="mt-1 text-xs text-slate-400">Job ID: {jobId}</p> : null}
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-morphix-purple via-morphix-blue to-morphix-magenta transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-black/20 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          {steps.map((step, index) => {
            const isComplete = index < activeIndex || status === 'done';
            const isActive = step.status === status;

            return (
              <div
                key={step.status}
                className={`rounded-[1rem] border p-3 transition ${
                  isActive
                    ? 'border-morphix-purple/40 bg-morphix-purple/10'
                    : isComplete
                      ? 'border-morphix-green/20 bg-morphix-green/5'
                      : 'border-white/8 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">{index + 1}</p>
                  {isComplete ? <CheckCircle2 className="h-4 w-4 text-morphix-green" /> : <Clock3 className="h-4 w-4 text-slate-500" />}
                </div>
                <p className="mt-3 text-sm font-medium text-white">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-[1.15rem] border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-300">
        <Sparkles className="h-4 w-4 text-morphix-blue" />
        <span>{message}</span>
      </div>
    </section>
  );
}