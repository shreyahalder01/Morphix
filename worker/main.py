import asyncio
import os
from pathlib import Path
from contextlib import suppress

from fastapi import FastAPI

from worker.db import fetch_job
from worker.pipeline import process_render_job
from worker.queue import ensure_consumer_group, read_next_job, ack_job


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue

        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_env_file(Path(__file__).resolve().parents[1] / '.env.local')

app = FastAPI(title='Morphix Worker', version='1.0.0')

_worker_task: asyncio.Task[None] | None = None


@app.on_event('startup')
async def on_startup() -> None:
    await ensure_consumer_group()
    global _worker_task
    _worker_task = asyncio.create_task(queue_loop())


@app.on_event('shutdown')
async def on_shutdown() -> None:
    global _worker_task
    if _worker_task:
        _worker_task.cancel()
        with suppress(asyncio.CancelledError):
            await _worker_task


@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok', 'provider': os.getenv('MORPHIX_PROVIDER', 'comfyui')}


async def queue_loop() -> None:
    while True:
        job = await read_next_job()
        if job is None:
            continue

        try:
            manifest = await fetch_job(job.job_id)
            if manifest is None:
                await ack_job(job.stream_id)
                continue

            await process_render_job(manifest)
            await ack_job(job.stream_id)
        except Exception as error:  # noqa: BLE001
            # The pipeline records the failure in Postgres before the message is acked.
            print(f'[Morphix Worker] job failed: {error}')
            await ack_job(job.stream_id)
