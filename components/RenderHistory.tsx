'use client';
import { useEffect, useState } from 'react';
import type { ApiJob } from '@/types';

const STATUS_DOT: Record<string, string> = {
  done:       '#57e6a4',
  error:      '#ef5aa8',
  pending:    '#96a0b5',
  extracting: '#42a6ff',
  styling:    '#8b68ff',
  compiling:  '#ef5aa8',
};

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

export default function RenderHistory({ onSelect }: { onSelect?: (job: ApiJob) => void }) {
  const [jobs, setJobs] = useState<ApiJob[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) setJobs(await res.json());
      } catch { /* silent */ }
    }
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  if (!jobs.length) return null;

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
        Recent renders
      </div>
      {jobs.slice(0, 8).map(job => (
        <div
          key={job.id}
          onClick={() => onSelect?.(job)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            cursor: onSelect ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}
        >
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
            background: STATUS_DOT[job.status] ?? '#96a0b5',
            boxShadow: `0 0 8px ${STATUS_DOT[job.status] ?? '#96a0b5'}88`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--white)', fontSize: '0.88rem', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {job.style} · {job.fps} fps
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: '2px' }}>
              {TIME_FORMATTER.format(new Date(job.createdAt))}
            </div>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.76rem', textTransform: 'capitalize' }}>{job.status}</div>
        </div>
      ))}
    </div>
  );
}
