// ── Internal pipeline types ───────────────────────────────────────────────────

export type JobStatus =
  | 'pending'
  | 'extracting'
  | 'styling'
  | 'compiling'
  | 'done'
  | 'error';

export interface Job {
  id: string;
  style: string;
  fps: number;
  /** 0–1 strength (ComfyUI denoise equivalent). Defaults to 0.82. */
  strength?: number;
  status: JobStatus;
  progress: number;
  sourcePath: string;
  outputPath?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by /api/process/[jobId] to the frontend */
export interface ApiJob {
  id: string;
  style: string;
  fps: number;
  /** 0–1 strength (ComfyUI denoise equivalent) */
  strength?: number;
  status: JobStatus;
  progress: number;
  message?: string;
  error?: string;
  /** Streaming URL for the original source */
  originalUrl?: string;
  /** Streaming URL for the styled output */
  outputUrl?: string;
  /** Streaming URL for the poster frame */
  posterUrl?: string;
  /** Download URL for the output video */
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Style types ───────────────────────────────────────────────────────────────

export type StyleId = string;

export type MixedMediaStyleKey =
  | 'vintage-stop-motion-neon-2d'
  | 'live-action-comic-halftone'
  | 'watercolor-cutout'
  | 'paper-collage-ink'
  | 'scrapbook-cutout-motion'
  | 'glossy-3d-rotoscope'
  | 'vhs-neon-sketch';

export type ProcessingStatus =
  | 'idle'
  | 'uploaded'
  | 'queued'
  | 'extracting_frames'
  | 'applying_style_transfer'
  | 'recompiling_video'
  | 'done'
  | 'failed';

export interface StylePreset {
  key: MixedMediaStyleKey;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
}

export interface UploadJobRequest {
  styleKey: MixedMediaStyleKey;
  fps: number;
  prompt?: string;
  strength?: number;
}

export interface JobManifest {
  id: string;
  status: ProcessingStatus;
  progress: number;
  message: string;
  styleKey: MixedMediaStyleKey;
  fps: number;
  prompt?: string;
  strength?: number;
  createdAt: string;
  updatedAt: string;
  originalFileName: string;
  originalStoragePath?: string;
  outputStoragePath?: string;
  posterStoragePath?: string;
  provider?: string;
  providerJobId?: string;
  outputFileName?: string;
  originalUrl?: string;
  outputUrl?: string;
  downloadUrl?: string;
  posterUrl?: string;
  error?: string;
}

export interface RenderHistoryEvent {
  id: number;
  jobId: string;
  status: ProcessingStatus;
  progress: number;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProcessingPayload {
  jobId: string;
  style: StylePreset;
  fps: number;
  prompt?: string;
  strength?: number;
  originalPath: string;
  workDir: string;
}
