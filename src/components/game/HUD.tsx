import { MAX_HEALTH, LEVEL_THRESHOLD_MAP } from '@/game/constants';
import type { PlayerState } from '@/game/types';

interface Props {
  player: PlayerState;
}

export default function HUD({ player }: Props) {
  const healthPct = Math.max(0, player.health / MAX_HEALTH) * 100;
  const isCritical = player.health < MAX_HEALTH * 0.3;
  const nextThreshold = LEVEL_THRESHOLD_MAP[player.boatLevel];
  const xpPct = nextThreshold ? (player.plasticCount / nextThreshold) * 100 : 100;

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 select-none pointer-events-none" style={{ width: 220 }}>
      {/* Player info */}
      <div className="game-panel p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-wider" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--primary))' }}>
            {player.name}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">Lv {player.boatLevel}</span>
        </div>

        {/* Health */}
        <div className="mb-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>HP</span>
            <span>{Math.ceil(player.health)}/{MAX_HEALTH}</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 8, background: 'hsl(var(--muted))' }}>
            <div
              className={isCritical ? 'health-bar-critical' : 'health-bar-fill'}
              style={{ width: `${healthPct}%`, height: '100%', borderRadius: 999 }}
            />
          </div>
        </div>

        {/* Boost energy */}
        <div className="mb-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>Boost</span>
            <span>{Math.round(player.boostEnergy * 100)}%</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'hsl(var(--muted))' }}>
            <div
              style={{
                width: `${player.boostEnergy * 100}%`,
                height: '100%',
                borderRadius: 999,
                background: player.boostEnergy < 0.25 ? '#ef4444' : player.boostEnergy < 0.6 ? '#f59e0b' : '#22d3ee',
                transition: 'background 0.3s',
              }}
            />
          </div>
        </div>

        {/* XP / progression */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>Plastic</span>
            <span>
              {player.plasticCount}{nextThreshold ? `/${nextThreshold}` : ' MAX'}
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'hsl(var(--muted))' }}>
            <div className="xp-bar-fill" style={{ width: `${Math.min(100, xpPct)}%`, height: '100%', borderRadius: 999 }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="game-panel px-3 py-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Total collected</span>
        <span className="font-bold" style={{ color: 'hsl(var(--accent))' }}>{player.totalCollected}</span>
      </div>
    </div>
  );
}
