import 'server-only';

import { createClient } from 'redis';

declare global {
  // eslint-disable-next-line no-var
  var __morphixRedisClient: ReturnType<typeof createRedisClient> | undefined;
}

const streamName = process.env.REDIS_STREAM_NAME ?? 'morphix:render:jobs';

function createRedisClient() {
  const client = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
  client.on('error', (error) => {
    console.error('[Morphix Redis]', error);
  });
  return client;
}

async function getRedisClient() {
  const client = globalThis.__morphixRedisClient ?? createRedisClient();
  if (!client.isOpen) {
    await client.connect();
  }
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__morphixRedisClient = client;
  }
  return client;
}

export interface QueueJobPayload {
  jobId: string;
  originalStoragePath: string;
  styleKey: string;
  fps: number;
  prompt?: string;
  strength?: number;
}

export async function ensureQueueGroup() {
  const client = await getRedisClient();
  try {
    await client.xGroupCreate(streamName, process.env.REDIS_CONSUMER_GROUP ?? 'morphix-workers', '$', {
      MKSTREAM: true
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('BUSYGROUP')) {
      throw error;
    }
  }
}

export async function enqueueRenderJob(payload: QueueJobPayload) {
  const client = await getRedisClient();
  await client.xAdd(streamName, '*', {
    jobId: payload.jobId,
    originalStoragePath: payload.originalStoragePath,
    styleKey: payload.styleKey,
    fps: String(payload.fps),
    prompt: payload.prompt ?? '',
    strength: payload.strength !== undefined ? String(payload.strength) : ''
  });
}

export async function publishJobStatus(jobId: string, status: string) {
  const client = await getRedisClient();
  await client.publish(process.env.REDIS_STATUS_CHANNEL ?? 'morphix:render:status', JSON.stringify({ jobId, status }));
}

export { streamName };