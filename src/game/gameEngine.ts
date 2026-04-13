import {
  BASE_MOVE_SPEED, SPEED_PER_LEVEL, BOAT_TURN_SPEED,
  MAX_HEALTH, BASE_COLLISION_DAMAGE, DAMAGE_PER_LEVEL, DEFENSE_PER_LEVEL,
  PLASTIC_STEAL_FRACTION,
  HEALTH_REGEN_RATE, HEALTH_REGEN_DELAY,
  INVULN_AFTER_HIT, BOAT_COLLISION_EXTENTS, GARBAGE_COLLECT_MARGIN,
  GARBAGE_SPAWN_INTERVAL, MAX_GARBAGE_COUNT, GARBAGE_WORLD_RADIUS,
  WORLD_RADIUS, LEVEL_THRESHOLD_MAP, MAX_BOAT_LEVEL,
  SOLAR_PANEL_REGEN_MULTIPLIER, SPEED_UPGRADE_BONUS, MAGNET_EXTRA_RADIUS,
  BOOST_DRAIN_RATE, BOOST_RECHARGE_RATE,
} from './constants';
import type { PlayerState, GarbageItem, GameInput, GameState, CollisionEvent, PlayerUpgrades } from './types';

let garbageIdCounter = 0;
const GARBAGE_TYPES = ['water_bottle', 'canister', 'plastic_bucket', 'traffic_cone'];

function randomGarbageType() {
  return GARBAGE_TYPES[Math.floor(Math.random() * GARBAGE_TYPES.length)];
}

export function createGarbage(): GarbageItem {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * GARBAGE_WORLD_RADIUS;
  return {
    id: `g_${garbageIdCounter++}`,
    x: Math.cos(angle) * dist,
    z: Math.sin(angle) * dist,
    type: randomGarbageType(),
    bobOffset: Math.random() * Math.PI * 2,
  };
}

export function spawnGarbageIfNeeded(garbage: GarbageItem[], timeSinceLast: number): { newGarbage: GarbageItem[]; spawnTimer: number } {
  if (garbage.length >= MAX_GARBAGE_COUNT) return { newGarbage: [], spawnTimer: timeSinceLast };
  const toSpawn = Math.floor(timeSinceLast / GARBAGE_SPAWN_INTERVAL);
  const newGarbage: GarbageItem[] = [];
  for (let i = 0; i < toSpawn && garbage.length + newGarbage.length < MAX_GARBAGE_COUNT; i++) {
    newGarbage.push(createGarbage());
  }
  return { newGarbage, spawnTimer: timeSinceLast % GARBAGE_SPAWN_INTERVAL };
}

export function movePlayer(player: PlayerState, input: GameInput, dt: number, upgrades?: PlayerUpgrades): void {
  const speedBonus = upgrades?.speed ? SPEED_UPGRADE_BONUS : 0;
  const speed = BASE_MOVE_SPEED + SPEED_PER_LEVEL * (player.boatLevel - 1) + speedBonus;
  if (input.left) player.rotation += BOAT_TURN_SPEED * dt;
  if (input.right) player.rotation -= BOAT_TURN_SPEED * dt;
  const moveDir = input.forward ? 1 : input.backward ? -0.5 : 0;
  const boosting = input.boost && player.boostEnergy > 0;
  if (boosting) {
    player.boostEnergy = Math.max(0, player.boostEnergy - BOOST_DRAIN_RATE * dt);
  } else {
    player.boostEnergy = Math.min(1, player.boostEnergy + BOOST_RECHARGE_RATE * dt);
  }
  const boostMul = boosting ? 1.5 : 1;
  const dx = Math.sin(player.rotation) * speed * moveDir * boostMul * dt;
  const dz = Math.cos(player.rotation) * speed * moveDir * boostMul * dt;
  player.x += dx;
  player.z += dz;

  // Track velocity for collision logic
  player.vx = dx / dt;
  player.vz = dz / dt;

  // Clamp to world
  const dist = Math.sqrt(player.x * player.x + player.z * player.z);
  if (dist > WORLD_RADIUS) {
    player.x = (player.x / dist) * WORLD_RADIUS;
    player.z = (player.z / dist) * WORLD_RADIUS;
  }
}

// ---- OBB (Oriented Bounding Box) collision helpers ----

export interface OBB2D {
  cx: number; cz: number;
  halfW: number; halfL: number;
  sin: number; cos: number;   // sin/cos of rotation (forward = [sin, cos])
}

export function boatOBB(p: { x: number; z: number; rotation: number; boatLevel?: number }, level?: number): OBB2D {
  const lvl = level ?? (p as PlayerState).boatLevel ?? 1;
  const ext = BOAT_COLLISION_EXTENTS[lvl] ?? BOAT_COLLISION_EXTENTS[1];
  return { cx: p.x, cz: p.z, halfW: ext.halfW, halfL: ext.halfL, sin: Math.sin(p.rotation), cos: Math.cos(p.rotation) };
}

function projectOBB(obb: OBB2D, ax: number, az: number): [number, number] {
  const center = obb.cx * ax + obb.cz * az;
  const extent = obb.halfL * Math.abs(obb.sin * ax + obb.cos * az)
               + obb.halfW * Math.abs(obb.cos * ax - obb.sin * az);
  return [center - extent, center + extent];
}

/** SAT overlap test for two OBBs. Returns null if no overlap, or push vector (a away from b). */
export function obbOverlap(a: OBB2D, b: OBB2D): { pushX: number; pushZ: number } | null {
  const axes = [
    [a.sin, a.cos], [a.cos, -a.sin],
    [b.sin, b.cos], [b.cos, -b.sin],
  ];
  let minOverlap = Infinity;
  let bestAx = 0, bestAz = 0;

  for (const [ax, az] of axes) {
    const [aMin, aMax] = projectOBB(a, ax, az);
    const [bMin, bMax] = projectOBB(b, ax, az);
    const overlap = Math.min(aMax - bMin, bMax - aMin);
    if (overlap <= 0) return null;
    if (overlap < minOverlap) {
      minOverlap = overlap;
      bestAx = ax; bestAz = az;
    }
  }

  // Ensure push direction goes from b toward a
  const dx = a.cx - b.cx;
  const dz = a.cz - b.cz;
  if (dx * bestAx + dz * bestAz < 0) { bestAx = -bestAx; bestAz = -bestAz; }

  return { pushX: bestAx * minOverlap, pushZ: bestAz * minOverlap };
}

/** Check if a point is inside an OBB expanded by `margin` on all sides. */
function pointInOBB(px: number, pz: number, obb: OBB2D, margin: number): boolean {
  const dx = px - obb.cx;
  const dz = pz - obb.cz;
  const localFwd = dx * obb.sin + dz * obb.cos;
  const localRight = dx * obb.cos - dz * obb.sin;
  return Math.abs(localFwd) <= obb.halfL + margin && Math.abs(localRight) <= obb.halfW + margin;
}

export function checkGarbageCollection(player: PlayerState, garbage: GarbageItem[], upgrades?: PlayerUpgrades): string[] {
  const obb = boatOBB(player);
  const margin = GARBAGE_COLLECT_MARGIN + (upgrades?.magnet ? MAGNET_EXTRA_RADIUS : 0);
  const collected: string[] = [];
  for (const g of garbage) {
    if (pointInOBB(g.x, g.z, obb, margin)) {
      collected.push(g.id);
      player.plasticCount += 1;
      player.totalCollected += 1;
      checkLevelUp(player);
    }
  }
  return collected;
}

export function checkLevelUp(player: PlayerState): boolean {
  if (player.boatLevel >= MAX_BOAT_LEVEL) return false;
  const threshold = LEVEL_THRESHOLD_MAP[player.boatLevel];
  if (threshold && player.plasticCount >= threshold) {
    player.plasticCount -= threshold;
    player.boatLevel += 1;
    return true;
  }
  return false;
}

let collisionIdCounter = 0;

export function checkBoatCollisions(players: PlayerState[], now: number): CollisionEvent[] {
  const events: CollisionEvent[] = [];
  const arr = Array.from(players);
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i];
      const b = arr[j];
      const obbA = boatOBB(a);
      const obbB = boatOBB(b);
      const hit = obbOverlap(obbA, obbB);
      if (hit) {
        events.push(...applyCollision(a, b, now));

        // Push apart — smaller boat gets pushed more
        const totalLevel = a.boatLevel + b.boatLevel;
        const aRatio = b.boatLevel / totalLevel;
        const bRatio = a.boatLevel / totalLevel;
        a.x += hit.pushX * aRatio;
        a.z += hit.pushZ * aRatio;
        b.x -= hit.pushX * bRatio;
        b.z -= hit.pushZ * bRatio;
      }
    }
  }
  return events;
}

/** How much a player is approaching the other (positive = moving toward). */
function approachSpeed(attacker: PlayerState, target: PlayerState): number {
  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const dist = Math.sqrt(dx * dx + dz * dz) || 1;
  return (attacker.vx * dx + attacker.vz * dz) / dist;
}

function applyCollision(a: PlayerState, b: PlayerState, now: number): CollisionEvent[] {
  const events: CollisionEvent[] = [];
  const aApproach = Math.max(0, approachSpeed(a, b));
  const bApproach = Math.max(0, approachSpeed(b, a));

  const aIsAggressor = aApproach > 0;
  const bIsAggressor = bApproach > 0;

  // Midpoint for floating text position
  const mx = (a.x + b.x) / 2;
  const mz = (a.z + b.z) / 2;

  // A attacks B
  if (aIsAggressor && now - b.lastHitTime > INVULN_AFTER_HIT) {
    const damage = Math.max(1, BASE_COLLISION_DAMAGE + DAMAGE_PER_LEVEL * a.boatLevel - DEFENSE_PER_LEVEL * b.boatLevel);
    b.health -= damage;
    b.lastHitTime = now;
    const stolen = Math.max(1, Math.ceil(b.plasticCount * PLASTIC_STEAL_FRACTION));
    const actualStolen = Math.min(stolen, b.plasticCount);
    b.plasticCount -= actualStolen;
    a.plasticCount += actualStolen;
    a.totalCollected += actualStolen;
    checkLevelUp(a);

    if (actualStolen > 0) {
      events.push({ id: `ce_${collisionIdCounter++}`, x: mx, z: mz, text: `+${actualStolen} plastic!`, color: '#ffd93d', time: now, victimId: b.id, attackerId: a.id });
    }
    events.push({ id: `ce_${collisionIdCounter++}`, x: b.x, z: b.z, text: `-${damage} HP`, color: '#ff4444', time: now, victimId: b.id, attackerId: a.id });
  }

  // B attacks A
  if (bIsAggressor && now - a.lastHitTime > INVULN_AFTER_HIT) {
    const damage = Math.max(1, BASE_COLLISION_DAMAGE + DAMAGE_PER_LEVEL * b.boatLevel - DEFENSE_PER_LEVEL * a.boatLevel);
    a.health -= damage;
    a.lastHitTime = now;
    const stolen = Math.max(1, Math.ceil(a.plasticCount * PLASTIC_STEAL_FRACTION));
    const actualStolen = Math.min(stolen, a.plasticCount);
    a.plasticCount -= actualStolen;
    b.plasticCount += actualStolen;
    b.totalCollected += actualStolen;
    checkLevelUp(b);

    if (actualStolen > 0) {
      events.push({ id: `ce_${collisionIdCounter++}`, x: mx, z: mz, text: `+${actualStolen} plastic!`, color: '#ffd93d', time: now, victimId: a.id, attackerId: b.id });
    }
    events.push({ id: `ce_${collisionIdCounter++}`, x: a.x, z: a.z, text: `-${damage} HP`, color: '#ff4444', time: now, victimId: a.id, attackerId: b.id });
  }

  return events;
}

export function handleDeath(player: PlayerState) {
  if (player.health <= 0) {
    player.health = MAX_HEALTH;
    player.plasticCount = 0;
    // Keep boatLevel, reset position
    const angle = Math.random() * Math.PI * 2;
    player.x = Math.cos(angle) * 30;
    player.z = Math.sin(angle) * 30;
    player.vx = 0;
    player.vz = 0;
    player.lastHitTime = 0;
    player.boostEnergy = 1;
  }
}

export function regenHealth(player: PlayerState, now: number, dt: number, upgrades?: PlayerUpgrades) {
  if (player.health < MAX_HEALTH && now - player.lastHitTime > HEALTH_REGEN_DELAY) {
    const regenMul = upgrades?.solar_panel ? SOLAR_PANEL_REGEN_MULTIPLIER : 1;
    player.health = Math.min(MAX_HEALTH, player.health + HEALTH_REGEN_RATE * regenMul * dt);
  }
}
