import type { PirateState, PlayerState, CollisionEvent, BombState } from './types';
import {
  PIRATE_SPEED, PIRATE_TURN_SPEED, PIRATE_CHASE_DURATION,
  PIRATE_COLLISION_DAMAGE, PIRATE_COLLISION_EXTENTS,
  PIRATE_BOMB_INTERVAL,
  INVULN_AFTER_HIT, WORLD_RADIUS,
} from './constants';
import { boatOBB, obbOverlap, type OBB2D } from './gameEngine';

let pirateCollisionIdCounter = 0;
let bombIdCounter = 0;

export interface UpdatePirateResult {
  events: CollisionEvent[];
  newBombs: BombState[];
}

/**
 * Update a single pirate ship for one tick.
 * Pirates never die — they chase, ram, and bomb players.
 */
export function updatePirate(
  pirate: PirateState,
  players: PlayerState[],
  dt: number,
  now: number,
): UpdatePirateResult {
  pirate.chaseTimer -= dt;

  // Pick / refresh target
  const needsNewTarget = pirate.chaseTimer <= 0 || !players.find(p => p.id === pirate.targetId);
  if (needsNewTarget) {
    // Exclude the previous target so we fairly rotate through ships
    const candidates = players.filter(p => p.id !== pirate.targetId);
    const pool = candidates.length > 0 ? candidates : players;

    let nearest: PlayerState | null = null;
    let nearestDist = Infinity;
    for (const p of pool) {
      const dx = pirate.x - p.x;
      const dz = pirate.z - p.z;
      const d = dx * dx + dz * dz;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = p;
      }
    }
    pirate.targetId = nearest?.id ?? null;
    pirate.chaseTimer = PIRATE_CHASE_DURATION;
  }

  // Steer toward target
  const target = players.find(p => p.id === pirate.targetId);
  if (target) {
    const dx = target.x - pirate.x;
    const dz = target.z - pirate.z;
    const targetAngle = Math.atan2(dx, dz);
    let diff = targetAngle - pirate.rotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const turnAmount = Math.min(Math.abs(diff), PIRATE_TURN_SPEED * dt);
    pirate.rotation += Math.sign(diff) * turnAmount;
  }

  // Move forward
  const moveX = Math.sin(pirate.rotation) * PIRATE_SPEED * dt;
  const moveZ = Math.cos(pirate.rotation) * PIRATE_SPEED * dt;
  pirate.x += moveX;
  pirate.z += moveZ;
  pirate.vx = moveX / dt;
  pirate.vz = moveZ / dt;

  // Clamp to world boundary
  const dist = Math.sqrt(pirate.x * pirate.x + pirate.z * pirate.z);
  if (dist > WORLD_RADIUS) {
    pirate.x = (pirate.x / dist) * WORLD_RADIUS;
    pirate.z = (pirate.z / dist) * WORLD_RADIUS;
  }

  // Bomb throwing
  pirate.bombTimer -= dt;
  const newBombs: BombState[] = [];
  if (pirate.bombTimer <= 0 && target) {
    pirate.bombTimer = PIRATE_BOMB_INTERVAL;
    // Aim slightly ahead of the target with a small random spread
    const spread = 1.5;
    newBombs.push({
      id: `bomb_${bombIdCounter++}`,
      originX: pirate.x,
      originZ: pirate.z,
      targetX: target.x + (Math.random() - 0.5) * spread,
      targetZ: target.z + (Math.random() - 0.5) * spread,
      progress: 0,
      pirateId: pirate.id,
    });
  }

  const events = checkPirateCollisions(pirate, players, now);
  return { events, newBombs };
}

function pirateOBB(pirate: PirateState): OBB2D {
  return {
    cx: pirate.x, cz: pirate.z,
    halfW: PIRATE_COLLISION_EXTENTS.halfW,
    halfL: PIRATE_COLLISION_EXTENTS.halfL,
    sin: Math.sin(pirate.rotation),
    cos: Math.cos(pirate.rotation),
  };
}

function checkPirateCollisions(
  pirate: PirateState,
  players: PlayerState[],
  now: number,
): CollisionEvent[] {
  const events: CollisionEvent[] = [];
  const pOBB = pirateOBB(pirate);

  for (const p of players) {
    const bOBB = boatOBB(p);
    const hit = obbOverlap(bOBB, pOBB);
    if (!hit) continue;

    // Push player away (pirate is immovable)
    p.x += hit.pushX;
    p.z += hit.pushZ;

    // Deal damage — pirate is always the aggressor
    if (now - p.lastHitTime > INVULN_AFTER_HIT) {
      p.health -= PIRATE_COLLISION_DAMAGE;
      p.lastHitTime = now;
      events.push({
        id: `pce_${pirateCollisionIdCounter++}`,
        x: p.x,
        z: p.z,
        text: `-${PIRATE_COLLISION_DAMAGE} HP`,
        color: '#ff4444',
        time: now,
        victimId: p.id,
        attackerId: pirate.id,
      });
    }
  }

  return events;
}

/** Push pirate ships apart so they don't overlap each other. No damage. */
export function checkPiratePirateCollisions(pirates: PirateState[]): void {
  for (let i = 0; i < pirates.length; i++) {
    for (let j = i + 1; j < pirates.length; j++) {
      const a = pirates[i];
      const b = pirates[j];
      const obbA = pirateOBB(a);
      const obbB = pirateOBB(b);
      const hit = obbOverlap(obbA, obbB);
      if (hit) {
        // Push apart equally
        a.x += hit.pushX * 0.5;
        a.z += hit.pushZ * 0.5;
        b.x -= hit.pushX * 0.5;
        b.z -= hit.pushZ * 0.5;
      }
    }
  }
}
