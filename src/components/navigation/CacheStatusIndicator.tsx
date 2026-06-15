import { useEffect, useState } from 'react';
import { Activity, Database, Wifi } from 'lucide-react';
import { getCacheStatusSnapshot, subscribeCacheStatus, type CacheStatusSnapshot } from '@/lib/preloadCache';

export function CacheStatusIndicator() {
  const [status, setStatus] = useState<CacheStatusSnapshot>(() => getCacheStatusSnapshot());

  useEffect(() => subscribeCacheStatus(setStatus), []);

  const running = status.active > 0;
  const Icon = running ? Activity : status.lastSource === 'warmed-cache' ? Database : Wifi;
  const label = running
    ? `Preloading ${Math.max(status.completed, 0)}/${Math.max(status.total, status.active)}`
    : status.lastSource === 'warmed-cache'
      ? 'Warmed cache'
      : 'Fresh data';

  return (
    <div
      className="fixed z-[70] flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase"
      style={{
        right: 10,
        top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        background: running ? '#FFE9A8' : '#FFFDF5',
        color: '#111111',
        border: '2px solid #111111',
        borderRadius: 6,
        boxShadow: '3px 3px 0px #111111',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
      title={running ? 'Background preload is running' : 'Latest data source'}
      aria-live="polite"
    >
      <Icon className={running ? 'w-3.5 h-3.5 animate-pulse' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </div>
  );
}