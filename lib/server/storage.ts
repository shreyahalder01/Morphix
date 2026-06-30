import path from 'node:path';
import { mkdir, access } from 'node:fs/promises';

export const runtimeRoot = process.cwd();
export const dataRoot = path.join(runtimeRoot, '.morphix');
export const uploadsRoot = path.join(dataRoot, 'uploads');
export const jobsRoot = path.join(dataRoot, 'jobs');
export const outputsRoot = path.join(dataRoot, 'outputs');
export const framesRoot = path.join(dataRoot, 'frames');
export const previewsRoot = path.join(dataRoot, 'previews');

export async function ensureRuntimeDirectories() {
  await Promise.all([
    mkdir(uploadsRoot, { recursive: true }),
    mkdir(jobsRoot, { recursive: true }),
    mkdir(outputsRoot, { recursive: true }),
    mkdir(framesRoot, { recursive: true }),
    mkdir(previewsRoot, { recursive: true })
  ]);
}

export async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}