import { spawn } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';

const delay = promisify(setTimeout);
let cachedBinary: string | null = null;

function loadStaticBinary(): string | null {
  try {
    const staticBinary = require('ffmpeg-static') as string | null;
    return typeof staticBinary === 'string' && staticBinary.length > 0 ? staticBinary : null;
  } catch {
    return null;
  }
}

function isUsableBinary(command: string): boolean {
  const looksLikePath = path.isAbsolute(command) || command.includes(path.sep) || command.includes('/');
  if (looksLikePath) {
    return fs.existsSync(command);
  }

  const result = spawnSync(command, ['-version'], { stdio: 'ignore', windowsHide: true });
  return !result.error && result.status === 0;
}

export function ffmpegBinary(): string {
  const configured = process.env.FFMPEG_PATH?.trim();
  if (configured && isUsableBinary(configured)) {
    return configured;
  }

  if (cachedBinary) {
    return cachedBinary;
  }

  const staticBinary = loadStaticBinary();
  if (staticBinary && isUsableBinary(staticBinary)) {
    cachedBinary = staticBinary;
    return cachedBinary;
  }

  if (configured) {
    cachedBinary = configured;
    return cachedBinary;
  }

  cachedBinary = 'ffmpeg';
  return cachedBinary;
}

function runProcess(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `Process exited with code ${code}`));
    });
  });
}

export async function extractFrames(inputPath: string, framesDir: string, fps: number) {
  await mkdir(framesDir, { recursive: true });
  const outputPattern = path.join(framesDir, '%06d.png');

  await runProcess(ffmpegBinary(), [
    '-hide_banner',
    '-y',
    '-i',
    inputPath,
    '-vf',
    `fps=${fps},scale=1280:-2:flags=lanczos`,
    '-start_number',
    '0',
    outputPattern
  ]);
}

export async function trimVideo({
  inputPath,
  outputPath,
  startTime,
  endTime,
}: {
  inputPath: string;
  outputPath: string;
  startTime: number;
  endTime: number;
}) {
  const duration = Math.max(0.1, endTime - startTime);

  await runProcess(ffmpegBinary(), [
    '-hide_banner',
    '-y',
    '-ss',
    String(startTime),
    '-i',
    inputPath,
    '-t',
    String(duration),
    '-c:v',
    'libx264',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    outputPath,
  ]);
}

export async function recompileVideo({
  inputPattern,
  outputPath,
  fps,
  audioSourcePath
}: {
  inputPattern: string;
  outputPath: string;
  fps: number;
  audioSourcePath?: string;
}) {
  const args = ['-hide_banner', '-y', '-framerate', String(fps), '-i', inputPattern];

  if (audioSourcePath) {
    args.push('-i', audioSourcePath);
    args.push('-map', '0:v:0', '-map', '1:a?');
  }

  args.push(
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-r',
    String(fps)
  );

  if (audioSourcePath) {
    args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  }

  args.push(outputPath);
  await runProcess(ffmpegBinary(), args);
}

export async function createStylePreview({
  inputPath,
  outputPath,
  startTime,
  endTime,
  filter,
}: {
  inputPath: string;
  outputPath: string;
  startTime: number;
  endTime: number;
  filter: string;
}) {
  const duration = Math.max(0.1, endTime - startTime);

  await runProcess(ffmpegBinary(), [
    '-hide_banner',
    '-y',
    '-ss',
    String(startTime),
    '-i',
    inputPath,
    '-t',
    String(duration),
    '-vf',
    filter,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    outputPath,
  ]);
}

export async function createPreviewPoster(inputPath: string, outputPath: string) {
  await runProcess(ffmpegBinary(), [
    '-hide_banner',
    '-y',
    '-ss',
    '00:00:01.000',
    '-i',
    inputPath,
    '-frames:v',
    '1',
    '-q:v',
    '2',
    outputPath
  ]);
}

export async function delayForDemo(ms: number) {
  await delay(ms);
}