from __future__ import annotations

import json
import os
from typing import Any

import psycopg
from psycopg.rows import dict_row


def _connect() -> psycopg.Connection[Any]:
    connection_string = os.environ['DATABASE_URL']
    return psycopg.connect(connection_string, row_factory=dict_row)


def fetch_job(job_id: str) -> dict[str, Any] | None:
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute('SELECT * FROM jobs WHERE id = %s', (job_id,))
            row = cursor.fetchone()
            return dict(row) if row else None


def update_job(job_id: str, **patch: Any) -> dict[str, Any]:
    row = fetch_job(job_id)
    if row is None:
        raise LookupError(f'Job {job_id} not found')

    row.update(patch)

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                UPDATE jobs SET
                    status = %s,
                    progress = %s,
                    message = %s,
                    style_key = %s,
                    fps = %s,
                    strength = %s,
                    prompt = %s,
                    updated_at = NOW(),
                    original_file_name = %s,
                    output_file_name = %s,
                    output_storage_path = %s,
                    poster_storage_path = %s,
                    provider = %s,
                    provider_job_id = %s,
                    original_url = %s,
                    output_url = %s,
                    download_url = %s,
                    poster_url = %s,
                    error = %s,
                    original_storage_path = %s
                WHERE id = %s
                RETURNING *
                ''',
                (
                    row['status'],
                    row['progress'],
                    row['message'],
                    row['style_key'],
                    row['fps'],
                    row.get('strength'),
                    row.get('prompt'),
                    row['original_file_name'],
                    row.get('output_file_name'),
                    row.get('output_storage_path'),
                    row.get('poster_storage_path'),
                    row.get('provider'),
                    row.get('provider_job_id'),
                    row.get('original_url'),
                    row.get('output_url'),
                    row.get('download_url'),
                    row.get('poster_url'),
                    row.get('error'),
                    row.get('original_storage_path'),
                    job_id,
                ),
            )
            connection.commit()
            return dict(cursor.fetchone())


def set_job_status(job_id: str, status: str, progress: int, message: str, **patch: Any) -> dict[str, Any]:
    return update_job(job_id, status=status, progress=progress, message=message, **patch)


def record_history(job_id: str, status: str, progress: int, message: str, metadata: dict[str, Any] | None = None) -> None:
    payload = json.dumps(metadata or {})
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                '''
                INSERT INTO render_history (job_id, status, progress, message, metadata)
                VALUES (%s, %s, %s, %s, %s::jsonb)
                ''',
                (job_id, status, progress, message, payload),
            )
            connection.commit()
