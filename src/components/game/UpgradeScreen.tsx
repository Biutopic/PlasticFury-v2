import { useState, useEffect, useRef, useCallback } from 'react';
import type { UpgradeType, PlayerUpgrades } from '@/game/types';
import { UPGRADE_SCREEN_DURATION } from '@/game/constants';

interface UpgradeOption {
  type: UpgradeType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const ALL_UPGRADES: UpgradeOption[] = [
  { type: 'solar_panel', label: 'Solar Panel', icon: '☀️', description: 'HP regenerates 2.5× faster', color: '#ffd93d' },
  { type: 'speed', label: 'Speed Boost', icon: '⚡', description: 'Move significantly faster', color: '#4d96ff' },
  { type: 'magnet', label: 'Magnet', icon: '🧲', description: 'Attract plastic from greater range', color: '#cc5de8' },
];

interface Props {
  currentUpgrades: PlayerUpgrades;
  onSelect: (upgrade: UpgradeType) => void;
}

export default function UpgradeScreen({ currentUpgrades, onSelect }: Props) {
  const [selected, setSelected] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(UPGRADE_SCREEN_DURATION);
  const startTimeRef = useRef(performance.now());
  const resolvedRef = useRef(false);

  const available = ALL_UPGRADES.filter(u => !currentUpgrades[u.type]);

  const confirm = useCallback((idx: number) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const pick = available[idx] ?? available[0];
    onSelect(pick.type);
  }, [available, onSelect]);

  // Countdown timer
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, UPGRADE_SCREEN_DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        confirm(selected);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selected, confirm]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        const idx = parseInt(e.key) - 1;
        if (idx < available.length) {
          setSelected(idx);
          confirm(idx);
        }
      }
      if (e.key === 'a' || e.key === 'ArrowLeft') {
        setSelected(s => Math.max(0, s - 1));
      }
      if (e.key === 'd' || e.key === 'ArrowRight') {
        setSelected(s => Math.min(available.length - 1, s + 1));
      }
      if (e.key === 'Enter' || e.key === ' ') {
        confirm(selected);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [available.length, selected, confirm]);

  const progressPct = (timeLeft / UPGRADE_SCREEN_DURATION) * 100;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)' }}
    >
      {/* Title */}
      <div className="mb-6 text-center">
        <h2
          className="text-3xl font-bold tracking-wider mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--primary))' }}
        >
          LEVEL UP!
        </h2>
        <p className="text-sm text-muted-foreground">Choose an upgrade (1/2/3 or arrows + enter)</p>
      </div>

      {/* Upgrade cards */}
      <div className="flex gap-4 mb-6">
        {available.map((upgrade, idx) => {
          const isSelected = idx === selected;
          return (
            <button
              key={upgrade.type}
              onClick={() => { setSelected(idx); confirm(idx); }}
              onMouseEnter={() => setSelected(idx)}
              className="relative flex flex-col items-center gap-2 p-5 rounded-xl transition-all duration-150"
              style={{
                width: 160,
                background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: isSelected ? `2px solid ${upgrade.color}` : '2px solid rgba(255,255,255,0.1)',
                boxShadow: isSelected ? `0 0 20px ${upgrade.color}40` : 'none',
                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <span className="text-xs font-bold absolute top-2 left-3 opacity-50">{idx + 1}</span>
              <span className="text-4xl">{upgrade.icon}</span>
              <span
                className="text-sm font-bold tracking-wide"
                style={{ fontFamily: 'var(--font-heading)', color: upgrade.color }}
              >
                {upgrade.label}
              </span>
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {upgrade.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timer bar */}
      <div className="w-80 rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.15)' }}>
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: 'hsl(var(--primary))',
            borderRadius: 999,
            transition: 'width 0.1s linear',
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Auto-selecting in {Math.ceil(timeLeft)}s
      </p>
    </div>
  );
}
