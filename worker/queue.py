from __future__ import annotations

import os
from dataclasses import dataclass

import redis.asyncio as redis

STREAM_NAME = os.getenv('REDIS_STREAM_NAME', 'morphix:render:jobs')
GROUP_NAME = os.getenv('REDIS_CONSUMER_GROUP', 'morphix-workers')
CONSUMER_NAME = os.getenv('REDIS_CONSUMER_NAME', 'worker-1')

_client: redis.Redis | None = None


def client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'), decode_responses=True)
    return _client


@dataclass
class QueueJob:
    stream_id: str
    job_id: str
    original_storage_path: str
    style_key: str
    fps: int
    prompt: str
    strength: float | None = None


async def ensure_consumer_group() -> None:
    redis_client = client()
    try:
        await redis_client.xgroup_create(STREAM_NAME, GROUP_NAME, id='$', mkstream=True)
    except Exception as error:  # noqa: BLE001
        if 'BUSYGROUP' not in str(error):
            raise


async def read_next_job() -> QueueJob | None:
    redis_client = client()
    response = await redis_client.xreadgroup(
        GROUP_NAME,
        CONSUMER_NAME,
        streams={STREAM_NAME: '>'},
        count=1,
        block=5000,
    )

    if not response:
        return None

    _, messages = response[0]
    stream_id, payload = messages[0]
    return QueueJob(
        stream_id=stream_id,
        job_id=payload['jobId'],
        original_storage_path=payload['originalStoragePath'],
        style_key=payload['styleKey'],
        fps=int(payload['fps']),
        prompt=payload.get('prompt', ''),
        strength=float(payload['strength']) if payload.get('strength') not in (None, '') else None,
    )


async def ack_job(stream_id: str) -> None:
    await client().xack(STREAM_NAME, GROUP_NAME, stream_id)
