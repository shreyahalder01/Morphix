'use client';
import { useEffect, useState } from 'react';

interface Status {
  online: boolean;
  baseUrl: string;
  checkpoint: string;
  provider: string;
  apiKeyConfigured: boolean;
  apiKeyHeader?: string;
}

export default function ComfyUIStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/comfyui');
        if (res.ok) setStatus(await res.json());
      } catch { /* silent */ }
    }
    check();
    const id = setInterval(check, 8000);
    return () => clearInterval(id);
  }, []);

  if (!status) return null;

  const isComfyUI = status.provider === 'comfyui';
  const color = !isComfyUI ? '#96a0b5' : status.online ? '#57e6a4' : '#ef5aa8';
  const label = !isComfyUI ? 'Mock mode' : status.online ? 'ComfyUI connected' : 'ComfyUI offline';

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}28`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0,
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }} />
        <span style={{ color: 'var(--white)', fontSize: '0.88rem', fontWeight: 600 }}>{label}</span>
      </div>

      <div style={{ display: 'grid', gap: '6px' }}>
        {[
          ['Provider', status.provider],
          ['Endpoint', status.baseUrl],
          ['Checkpoint', status.checkpoint],
          ['API key', status.apiKeyConfigured ? 'Configured' : 'Missing'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '0.76rem' }}>
            <span style={{ color: 'var(--muted)' }}>{k}</span>
            <span style={{
              color: 'var(--white)', maxWidth: '160px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textAlign: 'right',
            }}>{v}</span>
          </div>
        ))}
      </div>

      {isComfyUI && !status.online && (
        <div style={{
          marginTop: '10px', padding: '8px 10px', borderRadius: '10px',
          background: 'rgba(239,90,168,0.08)', border: '1px solid rgba(239,90,168,0.20)',
          color: '#ef5aa8', fontSize: '0.75rem', lineHeight: 1.5,
        }}>
          Start ComfyUI locally:<br />
          <code style={{ opacity: 0.8 }}>python main.py --listen</code>
        </div>
      )}
    </div>
  );
}
