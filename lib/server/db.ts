import { Pool as PgPool } from 'pg';

type Pool = InstanceType<typeof PgPool>;

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function saveJobToDb(job: {
  id: string;
  style: string;
  fps: number;
  status: string;
  strength: number;
  prompt: string;
  originalFileName: string;
  originalStoragePath: string;
  message?: string;
}): Promise<void> {
  try {
    const db = getPool();
    await db.query(
      `INSERT INTO jobs (
         id, status, progress, message, style_key, fps, strength, prompt,
         original_file_name, original_storage_path, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
       ON CONFLICT (id) DO UPDATE
         SET status = EXCLUDED.status,
             progress = EXCLUDED.progress,
             message = EXCLUDED.message,
             style_key = EXCLUDED.style_key,
             fps = EXCLUDED.fps,
             strength = EXCLUDED.strength,
             prompt = EXCLUDED.prompt,
             original_file_name = EXCLUDED.original_file_name,
             original_storage_path = EXCLUDED.original_storage_path,
             updated_at = now()`,
      [
        job.id,
        job.status,
        0,
        job.message ?? 'Upload accepted. Processing has started.',
        job.style,
        job.fps,
        job.strength,
        job.prompt,
        job.originalFileName,
        job.originalStoragePath,
      ],
    );
  } catch {
    // Non-fatal — file store is the source of truth locally
    console.warn('[db] Could not write to jobs (DB may be unavailable)');
  }
}
