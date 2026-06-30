'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Clapperboard, PlayCircle, RefreshCw, Scissors, SlidersHorizontal, WandSparkles } from 'lucide-react';
import { UploadPanel } from './upload-panel';
import StyleSelector, { STYLES } from './style-selector';
import { ProcessingDashboard } from './processing-dashboard';
import { ResultsPanel } from './results-panel';
import type { ApiJob } from '@/types';

const defaultStyle = STYLES[0]?.id ?? 'ghibli';

function getProgressFromStatus(status: ApiJob['status']) {
  switch (status) {
    case 'pending':
      return 10;
    case 'extracting':
      return 28;
    case 'styling':
      return 56;
    case 'compiling':
      return 84;
    case 'done':
      return 100;
    case 'error':
      return 100;
    default:
      return 0;
  }
}

function getMessageFromJob(job: Pick<ApiJob, 'status' | 'error'>) {
  switch (job.status) {
    case 'pending':
      return 'Queued for processing.';
    case 'extracting':
      return 'Extracting frames with FFmpeg...';
    case 'styling':
      return 'Applying style transfer...';
    case 'compiling':
      return 'Recompiling the output video...';
    case 'done':
      return 'Mixed-media animation is ready.';
    case 'error':
      return job.error ?? 'Processing failed.';
  }
}

export function MixedMediaStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [styleKey, setStyleKey] = useState<string>(defaultStyle);
  const [fps, setFps] = useState(12);
  const [strength, setStrength] = useState(82);
  const [status, setStatus] = useState<ApiJob['status']>('pending');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Upload a video to begin.');
  const [jobId, setJobId] = useState<string | undefined>();
  const [result, setResult] = useState<ApiJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(5);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [isPreviewing, setIsPreviewing] = useState(false);

  const activeStyle = STYLES.find((style) => style.id === styleKey) ?? STYLES[0];
  const resultStyle = result?.style ? STYLES.find((style) => style.id === result.style) : undefined;
  const resultFps = result?.fps ?? fps;

  useEffect(() => {
    setProgress(getProgressFromStatus(status));
  }, [status]);

  useEffect(() => {
    if (!jobId || status === 'done' || status === 'error') return;

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/process/${jobId}`);
      if (!response.ok) return;

      const manifest = (await response.json()) as ApiJob;
      setStatus(manifest.status);
      setProgress(manifest.progress);
      setMessage(manifest.message ?? getMessageFromJob(manifest));
      setResult(manifest);

      if (manifest.status === 'done' || manifest.status === 'error') {
        window.clearInterval(interval);
      }
    }, 1500);

    return () => window.clearInterval(interval);
  }, [jobId, status]);

  const handlePreview = async () => {
    if (!file) return;

    setIsPreviewing(true);
    setMessage('Generating a 1-second preview...');

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('style', styleKey);
      formData.append('strength', String(strength / 100));
      formData.append('startTime', String(startTime));
      formData.append('endTime', String(endTime));

      const response = await fetch('/api/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error ?? 'Preview generation failed.');
      }

      const payload = (await response.json()) as { previewUrl?: string };
      setPreviewUrl(payload.previewUrl);
      setMessage('Preview ready.');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unexpected preview failure.';
      setMessage(messageText);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;

    setIsSubmitting(true);
    setStatus('pending');
    setMessage('Uploading file and creating job...');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('style', styleKey);
      formData.append('fps', String(fps));
      formData.append('strength', (strength / 100).toFixed(2));
      formData.append('prompt', activeStyle.promptHint);
      formData.append('startTime', String(startTime));
      formData.append('endTime', String(endTime));

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error ?? 'Failed to create processing job.');
      }

      const payload = (await response.json()) as { jobId: string; manifest: ApiJob };
      setJobId(payload.jobId);
      setStatus(payload.manifest.status);
      setProgress(payload.manifest.progress);
      setMessage(payload.manifest.message ?? getMessageFromJob(payload.manifest));
      setResult(payload.manifest);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unexpected processing failure.';
      setStatus('error');
      setMessage(messageText);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(139,104,255,0.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(66,166,255,0.16),transparent_24%)]" />

      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-morphix-purple ring-1 ring-white/8">
                <Clapperboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Morphix Studio</p>
                <h1 className="text-xl font-semibold md:text-2xl">Mixed-media animation builder</h1>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-slate-300 md:flex">
            <WandSparkles className="h-4 w-4 text-morphix-blue" />
            Stable Video Diffusion + FFmpeg + AI provider seam
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <UploadPanel file={file} onFileChange={setFile} />

            <section className="glass-panel gradient-border rounded-[1.75rem] p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-morphix-purple/90">Configuration</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Frame rate and prompt controls</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-300">
                  <SlidersHorizontal className="h-4 w-4 text-morphix-purple" />
                  Output tuned for mixed-media animation
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-white">Frame rate: {fps} fps</label>
                    <p className="mt-2 text-sm text-slate-400">
                      Mixed-media animation can render from 5 to 60 fps. Lower values create a steppy handcrafted feel; higher values keep movement smoother.
                    </p>
                    <input
                      type="range"
                      aria-label="Frame rate"
                      data-testid="fps-slider"
                      min={5}
                      max={60}
                      step={1}
                      value={fps}
                      onInput={(event) => setFps(Number(event.currentTarget.value))}
                      onChange={(event) => setFps(Number(event.target.value))}
                      className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-morphix-purple"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>5 fps</span>
                      <span>30 fps</span>
                      <span>60 fps</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white">Style strength: {strength}%</label>
                    <p className="mt-2 text-sm text-slate-400">
                      Lower strength preserves more of the original video. Higher strength pushes heavier media layers, texture, tape, stickers, and cel lines.
                    </p>
                    <input
                      type="range"
                      aria-label="Style strength"
                      data-testid="style-strength-slider"
                      min={0}
                      max={100}
                      step={1}
                      value={strength}
                      onInput={(event) => setStrength(Number(event.currentTarget.value))}
                      onChange={(event) => setStrength(Number(event.target.value))}
                      className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-morphix-magenta"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>Subtle</span>
                      <span>Balanced</span>
                      <span>Max</span>
                    </div>
                  </div>

                  <div className="rounded-[1.3rem] border border-white/8 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-white">
                        <Scissors className="h-4 w-4 text-morphix-purple" />
                        <span className="text-sm font-medium">Trim window</span>
                      </div>
                      <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-slate-300">
                        {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Start</label>
                        <input
                          type="range"
                          min={0}
                          max={30}
                          step={0.1}
                          value={startTime}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            setStartTime(next);
                            if (endTime <= next) setEndTime(Math.min(30, next + 0.5));
                          }}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-morphix-purple"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">End</label>
                        <input
                          type="range"
                          min={0.5}
                          max={30}
                          step={0.1}
                          value={endTime}
                          onChange={(event) => setEndTime(Number(event.target.value))}
                          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-morphix-blue"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={!file || isPreviewing}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPreviewing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  Preview 1s clip
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!file || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-morphix-purple to-morphix-blue px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Generate mixed-media animation
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <StyleSelector value={styleKey} onChange={setStyleKey} />

            <ProcessingDashboard status={status} progress={progress} message={message} jobId={jobId} />

            <div className="glass-panel gradient-border rounded-[1.75rem] p-5 md:p-6">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-morphix-purple/90">Selected preset</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">{activeStyle.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{activeStyle.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em] text-slate-300">
                  {activeStyle.tag}
                </span>
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em] text-slate-300">
                  {activeStyle.category}
                </span>
              </div>
            </div>
          </div>
        </section>

        <ResultsPanel
          originalUrl={result?.originalUrl}
          outputUrl={result?.outputUrl}
          posterUrl={result?.posterUrl}
          downloadUrl={result?.downloadUrl}
          previewUrl={previewUrl}
          fps={resultFps}
          styleLabel={resultStyle?.name ?? activeStyle.name}
        />
      </main>
    </div>
  );
}

export default MixedMediaStudio;
