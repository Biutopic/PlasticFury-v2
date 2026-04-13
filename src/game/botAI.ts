import type { PlayerState, GarbageItem, GameInput } from './types';

interface BotBrain {
  targetGarbageId: string | null;
  decisionTimer: number;
}

const brains = new Map<string, BotBrain>();

function getBrain(id: string): BotBrain {
  if (!brains.has(id)) brains.set(id, { targetGarbageId: null, decisionTimer: 0 });
  return brains.get(id)!;
}

export function computeBotInput(bot: PlayerState, garbage: GarbageItem[], players: PlayerState[], dt: number): GameInput {
  const brain = getBrain(bot.id);
  brain.decisionTimer -= dt;

  const input: GameInput = { forward: true, backward: false, left: false, right: false, boost: false };

  // Pick new target periodically
  if (brain.decisionTimer <= 0 || !garbage.find(g => g.id === brain.targetGarbageId)) {
    brain.decisionTimer = 1.5 + Math.random() * 2;
    // Find nearest garbage
    let nearest: GarbageItem | null = null;
    let nearestDist = Infinity;
    for (const g of garbage) {
      const dx = bot.x - g.x;
      const dz = bot.z - g.z;
      const d = dx * dx + dz * dz;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = g;
      }
    }
    brain.targetGarbageId = nearest?.id ?? null;
  }

  const target = garbage.find(g => g.id === brain.targetGarbageId);
  if (target) {
    const dx = target.x - bot.x;
    const dz = target.z - bot.z;
    const targetAngle = Math.atan2(dx, dz);
    let diff = targetAngle - bot.rotation;
    // Normalize
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (diff > 0.1) input.left = true;
    else if (diff < -0.1) input.right = true;
  }

  return input;
}
