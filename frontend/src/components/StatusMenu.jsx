import { useEffect, useRef, useState } from 'react';
import { STATUS_CONFIG, STATUS_ORDER } from '../constants/status.js';

export default function StatusMenu({ status, onChange, size = 'sm' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.to_watch;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`flex items-center gap-1.5 ${textSize} font-medium px-2 py-1 rounded-full ${config.badge} hover:brightness-125 transition`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
        <span className="text-[9px] opacity-60">▼</span>
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 right-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[130px]"
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_ORDER.map((key) => (
            <button
              key={key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(key);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-zinc-800 transition ${
                key === status ? 'text-zinc-100 font-medium' : 'text-zinc-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[key].dot}`} />
              {STATUS_CONFIG[key].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
