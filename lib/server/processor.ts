import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { updateJob } from './job-store';
import { buildAiProviderPayload, mockStyleTransfer } from './ai-engine';
import { ffmpegBinary, recompileVideo } from './ffmpeg';
import { stylizeFrame } from './comfyui';

const execFileAsync = promisify(execFile);
const AI_PROVIDER = process.env.AI_PROVIDER ?? process.env.MORPHIX_PROVIDER ?? 'mock';

export async function processJob(
  jobId: string,
  sourcePath: string,
  style: string,
  fps: number,
  prompt?: string,
  /** 0–1 style strength; mirrors ComfyUI denoise. Defaults to 0.82. */
  strength = 0.82,
): Promise<void> {
  const jobDir = path.join(process.cwd(), 'data', 'renders', jobId);
  const frameDir = path.join(jobDir, 'frames');
  const styledDir = path.join(jobDir, 'styled');
  const outputPath = path.join(jobDir, 'output.mp4');

  try {
    fs.mkdirSync(frameDir, { recursive: true });
    fs.mkdirSync(styledDir, { recursive: true });

    // Step 1: Extract frames
    updateJob(jobId, { status: 'extracting', progress: 5 });
    await execFileAsync(ffmpegBinary(), [
      '-i', sourcePath,
      '-vf', `fps=${fps}`,
      '-q:v', '2',
      path.join(frameDir, 'frame_%04d.png'),
    ]);

    // Step 2: AI style transfer
    updateJob(jobId, { status: 'styling', progress: 30 });

    const payload = buildAiProviderPayload(
      jobId, style, fps, frameDir, styledDir, prompt, strength,
    );

    const frameFiles = fs.readdirSync(frameDir)
      .filter((file) => file.endsWith('.png') || file.endsWith('.jpg'))
      .sort();

    if (AI_PROVIDER === 'mock') {
      await mockStyleTransfer(payload);
    } else {
      fs.mkdirSync(styledDir, { recursive: true });
      let providerSucceeded = false;

      for (const frameFile of frameFiles) {
        const framePath = path.join(frameDir, frameFile);
        const styledPath = path.join(styledDir, frameFile);

        try {
          const styledBuffer = await stylizeFrame(framePath, style, payload.prompt, strength);
          fs.writeFileSync(styledPath, styledBuffer);
          providerSucceeded = true;
        } catch (err) {
          console.warn(`[${AI_PROVIDER}] Frame ${frameFile} failed; using local fallback:`, err);
          providerSucceeded = false;
          break;
        }
      }

      if (!providerSucceeded || fs.readdirSync(styledDir).length !== frameFiles.length) {
        fs.rmSync(styledDir, { recursive: true, force: true });
        fs.mkdirSync(styledDir, { recursive: true });
        await mockStyleTransfer(payload);
      }
    }

    updateJob(jobId, { progress: 80 });

    // Step 3: Recompile
    updateJob(jobId, { status: 'compiling', progress: 85 });
    await recompileVideo({
      inputPattern: path.join(styledDir, 'frame_%04d.png'),
      outputPath,
      fps,
      audioSourcePath: sourcePath,
    });

    updateJob(jobId, { status: 'done', progress: 100, outputPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateJob(jobId, { status: 'error', error: message });
    throw err;
  }
}