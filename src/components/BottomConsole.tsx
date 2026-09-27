import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Filter, Trash2, ArrowDownCircle } from 'lucide-react';
import { TelemetryLog, LogCategory } from '../types/simulation';

interface BottomConsoleProps {
  logs: TelemetryLog[];
  onClearLogs: () => void;
}

export const BottomConsole: React.FC<BottomConsoleProps> = ({ logs, onClearLogs }) => {
  const [selectedCategory, setSelectedCategory] = useState<LogCategory>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (selectedCategory === 'ALL') return true;
    return log.category === selectedCategory;
  });

  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelStyle = (level: TelemetryLog['level']) => {
    switch (level) {
      case 'info':
        return 'text-slate-300';
      case 'warn':
        return 'text-amber-300 font-semibold';
      case 'crit':
        return 'text-red-400 font-bold';
      case 'success':
        return 'text-emerald-300 font-semibold';
    }
  };

  const getCategoryBadge = (category: TelemetryLog['category']) => {
    switch (category) {
      case 'POWER':
        return 'bg-amber-950/70 border-amber-500/40 text-amber-400';
      case 'THERMAL':
        return 'bg-cyan-950/70 border-cyan-500/40 text-cyan-400';
      case 'WEATHER':
        return 'bg-orange-950/70 border-orange-500/40 text-orange-400';
      case 'ROVERS':
        return 'bg-sky-950/70 border-sky-500/40 text-sky-400';
      case 'SYSTEM':
      default:
        return 'bg-slate-900 border-slate-700 text-slate-400';
    }
  };

  return (
    <footer className="h-28 border-t border-cyan-500/20 bg-slate-950/95 backdrop-blur flex flex-col font-mono-data text-xs select-none z-20">
      {/* Console Header Bar */}
      <div className="h-7 px-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold text-slate-200 tracking-wider font-hud uppercase">
            ARES TELEMETRY CONSOLE // REAL-TIME EVENT STREAM
          </span>
          <span className="text-[10px] text-slate-500">
            ({filteredLogs.length} events logged)
          </span>
        </div>

        {/* Filter categories & controls */}
        <div className="flex items-center gap-1.5 text-[10px]">
          {(['ALL', 'POWER', 'THERMAL', 'WEATHER', 'ROVERS'] as LogCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          <div className="h-3 w-px bg-slate-800 mx-1" />

          {/* Auto scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
            className={`p-1 rounded cursor-pointer ${
              autoScroll ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          {/* Clear logs */}
          <button
            onClick={onClearLogs}
            title="Clear event log"
            className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrolling Log Output Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto hud-scrollbar p-2 space-y-1 bg-slate-950/80"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-[11px] italic py-1">
            No events logged in category {selectedCategory}.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-baseline gap-2 text-[11px] leading-tight">
              <span className="text-slate-500 text-[10px] shrink-0 font-normal">
                [SOL {String(log.sol).padStart(2, '0')} · {log.timeStr}]
              </span>
              <span className={`px-1 py-0.2 text-[9px] border rounded uppercase font-semibold shrink-0 ${getCategoryBadge(log.category)}`}>
                {log.category}
              </span>
              <span className={`${getLevelStyle(log.level)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </footer>
  );
};
