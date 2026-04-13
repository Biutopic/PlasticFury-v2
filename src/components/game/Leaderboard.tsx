import type { PlayerState } from '@/game/types';

interface Props {
  players: PlayerState[];
  localId: string;
}

export default function Leaderboard({ players, localId }: Props) {
  const sorted = [...players].sort((a, b) => b.totalCollected - a.totalCollected);

  return (
    <div className="absolute top-4 right-4 select-none pointer-events-none" style={{ width: 200 }}>
      <div className="game-panel overflow-hidden">
        <div
          className="px-3 py-2 text-[10px] font-bold tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--primary))', borderBottom: '1px solid hsl(var(--border))' }}
        >
          Leaderboard
        </div>
        <div className="py-1">
          {sorted.slice(0, 8).map((p, i) => (
            <div key={p.id} className={`leaderboard-row ${p.id === localId ? 'leaderboard-self' : ''}`}>
              <span className="text-muted-foreground w-4 text-right text-[10px]">{i + 1}</span>
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: p.color }}
              />
              <span className="flex-1 truncate text-xs">{p.name}</span>
              <span className="text-xs font-semibold" style={{ color: 'hsl(var(--accent))' }}>
                {p.totalCollected}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
