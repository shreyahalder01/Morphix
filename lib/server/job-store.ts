import fs from 'fs';
import path from 'path';
import type { Job, JobStatus } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data', 'jobs');

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function saveJob(job: Job): void {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, `${job.id}.json`), JSON.stringify(job, null, 2));
}

export function getJob(id: string): Job | null {
  ensureDir();
  const filePath = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Job;
}

export function updateJob(id: string, patch: Partial<Job>): Job | null {
  const job = getJob(id);
  if (!job) return null;
  const updated: Job = { ...job, ...patch, updatedAt: new Date().toISOString() };
  saveJob(updated);
  return updated;
}

export function listJobs(): Job[] {
  ensureDir();
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  return files
    .map(f => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')) as Job)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createJob(
  style: string,
  fps: number,
  sourcePath: string,
  /** 0–1 strength; maps to ComfyUI denoise. Default 0.82. */
  strength = 0.82,
): Job {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const job: Job = {
    id,
    style,
    fps,
    strength,
    status: 'pending',
    progress: 0,
    sourcePath,
    createdAt: now,
    updatedAt: now,
  };
  saveJob(job);
  return job;
}
